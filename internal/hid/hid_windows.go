//go:build windows

package hid

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

var (
	modHid      = syscall.NewLazyDLL("hid.dll")
	modSetupAPI = syscall.NewLazyDLL("setupapi.dll")
	modKernel32 = syscall.NewLazyDLL("kernel32.dll")

	procHidDGetHidGuid        = modHid.NewProc("HidD_GetHidGuid")
	procHidDGetAttributes     = modHid.NewProc("HidD_GetAttributes")
	procHidDGetProductString  = modHid.NewProc("HidD_GetProductString")
	procHidDGetPreparsedData  = modHid.NewProc("HidD_GetPreparsedData")
	procHidDFreePreparsedData = modHid.NewProc("HidD_FreePreparsedData")
	procHidPGetCaps           = modHid.NewProc("HidP_GetCaps")

	procSetupDiGetClassDevsW             = modSetupAPI.NewProc("SetupDiGetClassDevsW")
	procSetupDiEnumDeviceInterfaces      = modSetupAPI.NewProc("SetupDiEnumDeviceInterfaces")
	procSetupDiGetDeviceInterfaceDetailW = modSetupAPI.NewProc("SetupDiGetDeviceInterfaceDetailW")
	procSetupDiDestroyDeviceInfoList     = modSetupAPI.NewProc("SetupDiDestroyDeviceInfoList")

	procCreateEventW        = modKernel32.NewProc("CreateEventW")
	procResetEvent          = modKernel32.NewProc("ResetEvent")
	procGetOverlappedResult = modKernel32.NewProc("GetOverlappedResult")
	procCancelIoEx          = modKernel32.NewProc("CancelIoEx")
)

const (
	digcfPresent         = 0x00000002
	digcfDeviceInterface = 0x00000010
	genericRead          = 0x80000000
	genericWrite         = 0x40000000
	fileShareRead        = 0x00000001
	fileShareWrite       = 0x00000002
	openExisting         = 3
	fileFlagOverlapped   = 0x40000000
	errorIoPending       = 997
	waitObject0          = 0x00000000
	waitTimeout          = 0x00000102
)

type guid struct {
	Data1 uint32
	Data2 uint16
	Data3 uint16
	Data4 [8]byte
}

type spDeviceInterfaceData struct {
	CbSize             uint32
	InterfaceClassGuid guid
	Flags              uint32
	Reserved           uintptr
}

type hiddAttributes struct {
	Size          uint32
	VendorID      uint16
	ProductID     uint16
	VersionNumber uint16
}

type hidpCaps struct {
	Usage                     uint16
	UsagePage                 uint16
	InputReportByteLength     uint16
	OutputReportByteLength    uint16
	FeatureReportByteLength   uint16
	Reserved                  [17]uint16
	NumberLinkCollectionNodes uint16
	NumberInputButtonCaps     uint16
	NumberInputValueCaps      uint16
	NumberInputDataIndices    uint16
	NumberOutputButtonCaps    uint16
	NumberOutputValueCaps     uint16
	NumberOutputDataIndices   uint16
	NumberFeatureButtonCaps   uint16
	NumberFeatureValueCaps    uint16
	NumberFeatureDataIndices  uint16
}

// Event represents spontaneous telemetry pushed by the keyboard (live key travel, calibration, hotkeys).
type Event struct {
	Kind       string `json:"kind"` // "travel" | "funcUpdate" | "profile"
	KeyType    byte   `json:"keyType"`
	Code1      byte   `json:"code1"`
	Code2      byte   `json:"code2"`
	Travel     int    `json:"travel"` // 0.01mm units (0..350)
	Calibrated bool   `json:"calibrated"`
	Profile    int    `json:"profile,omitempty"`
}

// Conn manages an open overlapped Win32 HID connection with a continuous background reader.
type Conn struct {
	cmdMu     sync.Mutex
	handle    syscall.Handle
	readEv    syscall.Handle
	writeEv   syscall.Handle
	Info      DeviceInfo
	respCh    chan [64]byte
	closeOnce sync.Once
	closed    chan struct{}
	readDone  chan struct{}

	subMu sync.Mutex
	subs  map[chan Event]struct{}
}

// Open opens the first available MCHOSE HID control interface.
func Open() (*Conn, error) {
	return OpenByPath("")
}

// OpenByPath opens a specific MCHOSE HID control interface (or the first available if targetPath is empty).
func OpenByPath(targetPath string) (*Conn, error) {
	devs, err := EnumerateMchoseDevices()
	if err != nil {
		return nil, err
	}
	if len(devs) == 0 {
		return nil, errors.New("no MCHOSE keyboard found on USB")
	}

	candidates := devs
	if targetPath != "" {
		candidates = nil
		for _, d := range devs {
			if strings.EqualFold(d.Path, targetPath) {
				candidates = append(candidates, d)
				break
			}
		}
		if len(candidates) == 0 {
			return nil, errors.New("selected MCHOSE keyboard is no longer connected")
		}
	}

	var lastErr error
	for _, d := range candidates {
		pathPtr, err := syscall.UTF16PtrFromString(d.Path)
		if err != nil {
			continue
		}
		h, err := syscall.CreateFile(
			pathPtr,
			genericRead|genericWrite,
			fileShareRead|fileShareWrite,
			nil,
			openExisting,
			fileFlagOverlapped,
			0,
		)
		if err != nil {
			lastErr = err
			continue
		}
		rEv, _, _ := procCreateEventW.Call(0, 1, 0, 0)
		wEv, _, _ := procCreateEventW.Call(0, 1, 0, 0)
		c := &Conn{
			handle:   h,
			readEv:   syscall.Handle(rEv),
			writeEv:  syscall.Handle(wEv),
			Info:     d,
			respCh:   make(chan [64]byte, 64),
			closed:   make(chan struct{}),
			readDone: make(chan struct{}),
			subs:     make(map[chan Event]struct{}),
		}
		go c.readLoop()
		return c, nil
	}
	return nil, fmt.Errorf("failed to open HID interface: %v", lastErr)
}

// Done returns a channel that is closed when the HID connection is closed.
func (c *Conn) Done() <-chan struct{} {
	return c.closed
}

// Subscribe registers a listener for spontaneous hardware telemetry events.
func (c *Conn) Subscribe() (chan Event, func()) {
	ch := make(chan Event, 64)
	c.subMu.Lock()
	c.subs[ch] = struct{}{}
	c.subMu.Unlock()
	unsub := func() {
		c.subMu.Lock()
		delete(c.subs, ch)
		c.subMu.Unlock()
	}
	return ch, unsub
}

func (c *Conn) broadcast(ev Event) {
	c.subMu.Lock()
	defer c.subMu.Unlock()
	for ch := range c.subs {
		select {
		case ch <- ev:
		default:
			select {
			case <-ch:
			default:
			}
			select {
			case ch <- ev:
			default:
			}
		}
	}
}

func (c *Conn) readLoop() {
	defer close(c.readDone)
	inLen := int(c.Info.InputLen)
	if inLen < 65 {
		inLen = 65
	}
	buf := make([]byte, inLen)

	for {
		select {
		case <-c.closed:
			return
		default:
		}

		procResetEvent.Call(uintptr(c.readEv))
		var ov syscall.Overlapped
		ov.HEvent = c.readEv

		var readBytes uint32
		err := syscall.ReadFile(c.handle, buf, &readBytes, &ov)
		if err != nil && !errors.Is(err, syscall.Errno(errorIoPending)) {
			return
		}

		for {
			res, wErr := syscall.WaitForSingleObject(c.readEv, 200)
			if wErr != nil {
				procCancelIoEx.Call(uintptr(c.handle), uintptr(unsafe.Pointer(&ov)))
				return
			}
			if res == waitTimeout {
				select {
				case <-c.closed:
					procCancelIoEx.Call(uintptr(c.handle), uintptr(unsafe.Pointer(&ov)))
					return
				default:
					continue
				}
			}
			if res != waitObject0 {
				procCancelIoEx.Call(uintptr(c.handle), uintptr(unsafe.Pointer(&ov)))
				return
			}
			break
		}

		ok, _, _ := procGetOverlappedResult.Call(uintptr(c.handle), uintptr(unsafe.Pointer(&ov)), uintptr(unsafe.Pointer(&readBytes)), 0)
		if ok == 0 {
			select {
			case <-c.closed:
				return
			default:
				continue
			}
		}
		if len(buf) < 65 {
			continue
		}

		var pkt [64]byte
		copy(pkt[:], buf[1:65])

		switch {
		case pkt[0] == 0xA0:
			travel := int(uint16(pkt[7]) | (uint16(pkt[6]) << 8))
			c.broadcast(Event{
				Kind:       "travel",
				KeyType:    pkt[1],
				Code1:      pkt[2],
				Code2:      pkt[3],
				Travel:     travel,
				Calibrated: pkt[10] == 255,
			})
		case pkt[0] == 0xA3:
			c.broadcast(Event{Kind: "funcUpdate"})
		case pkt[0] == 0xAA && pkt[1] == 0xFA:
			// Real-time light notification; ignore for command channel
		case pkt[0] == 0xFA && pkt[1] == 0xFB:
			if pkt[2] < 4 {
				c.broadcast(Event{Kind: "profile", Profile: int(pkt[2])})
			}
		case pkt[0] == 0xAA:
			select {
			case c.respCh <- pkt:
			default:
				select {
				case <-c.respCh:
				default:
				}
				select {
				case c.respCh <- pkt:
				default:
				}
			}
		}
	}
}

// Close cancels pending overlapped I/O, stops the reader goroutine, and releases Win32 handles.
func (c *Conn) Close() {
	c.closeOnce.Do(func() {
		close(c.closed)
		if c.handle != 0 && c.handle != syscall.InvalidHandle {
			procCancelIoEx.Call(uintptr(c.handle), 0)
		}
		select {
		case <-c.readDone:
		case <-time.After(500 * time.Millisecond):
		}
		if c.handle != 0 && c.handle != syscall.InvalidHandle {
			syscall.CloseHandle(c.handle)
			c.handle = syscall.InvalidHandle
		}
		if c.readEv != 0 {
			syscall.CloseHandle(c.readEv)
			c.readEv = 0
		}
		if c.writeEv != 0 {
			syscall.CloseHandle(c.writeEv)
			c.writeEv = 0
		}
	})
}

func (c *Conn) writePacket64(pkt [64]byte) error {
	outLen := int(c.Info.OutputLen)
	if outLen < 65 {
		outLen = 65
	}
	buf := make([]byte, outLen)
	buf[0] = 0x00 // Report ID 0
	copy(buf[1:65], pkt[:])

	procResetEvent.Call(uintptr(c.writeEv))
	var ov syscall.Overlapped
	ov.HEvent = c.writeEv

	var written uint32
	err := syscall.WriteFile(c.handle, buf, &written, &ov)
	if err != nil && !errors.Is(err, syscall.Errno(errorIoPending)) {
		return fmt.Errorf("WriteFile: %w", err)
	}
	res, err := syscall.WaitForSingleObject(c.writeEv, 400)
	if err != nil || res != waitObject0 {
		procCancelIoEx.Call(uintptr(c.handle), uintptr(unsafe.Pointer(&ov)))
		return errors.New("HID write timeout")
	}
	ok, _, _ := procGetOverlappedResult.Call(uintptr(c.handle), uintptr(unsafe.Pointer(&ov)), uintptr(unsafe.Pointer(&written)), 0)
	if ok == 0 {
		return errors.New("GetOverlappedResult write failed")
	}
	return nil
}

func (c *Conn) transceiveChunk(cmd byte, offset uint16, size byte, writeData []byte) ([]byte, error) {
	pkt := BuildCizhouFrame(cmd, offset, size, writeData)
	lo := byte(offset & 0xFF)
	hi := byte((offset >> 8) & 0xFF)

	for {
		select {
		case <-c.respCh:
		default:
			goto drained
		}
	}
drained:

	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		if err := c.writePacket64(pkt); err != nil {
			lastErr = err
			continue
		}
		deadline := time.NewTimer(350 * time.Millisecond)
		for {
			select {
			case <-c.closed:
				deadline.Stop()
				return nil, errors.New("keyboard connection closed")
			case resp := <-c.respCh:
				if resp[0] == 0xAA && resp[1] == cmd && resp[5] == lo && resp[6] == hi {
					deadline.Stop()
					n := int(resp[4])
					if n > 56 {
						n = 56
					}
					out := make([]byte, n)
					copy(out, resp[8:8+n])
					return out, nil
				}
			case <-deadline.C:
				lastErr = errors.New("HID read timeout")
				goto retry
			}
		}
	retry:
	}
	return nil, fmt.Errorf("cmd 0x%02X @ %d failed: %v", cmd, offset, lastErr)
}

// SimpleGet reads totalLen bytes in 56-byte chunks using Cizhou command `cmd`.
func (c *Conn) SimpleGet(cmd byte, baseOffset int, totalLen int) ([]byte, error) {
	c.cmdMu.Lock()
	defer c.cmdMu.Unlock()

	out := make([]byte, 0, totalLen)
	for off := 0; off < totalLen; off += 56 {
		chunkLen := totalLen - off
		if chunkLen > 56 {
			chunkLen = 56
		}
		part, err := c.transceiveChunk(cmd, uint16(baseOffset+off), byte(chunkLen), nil)
		if err != nil {
			return nil, err
		}
		out = append(out, part...)
	}
	if len(out) > totalLen {
		out = out[:totalLen]
	}
	return out, nil
}

// SimpleSend writes data in chunk-aligned packets (<=56 bytes) using Cizhou command `cmd`.
func (c *Conn) SimpleSend(cmd byte, baseOffset int, data []byte, structSize int) error {
	c.cmdMu.Lock()
	defer c.cmdMu.Unlock()

	for _, ch := range PlanFullSendChunks(data, structSize) {
		if _, err := c.transceiveChunk(cmd, uint16(baseOffset+ch.Offset), byte(len(ch.Data)), ch.Data); err != nil {
			return err
		}
	}
	return nil
}

// SimpleUpdateSend diffs newData against oldData and sends minimal full 56-byte Cizhou packets.
func (c *Conn) SimpleUpdateSend(cmd byte, baseOffset int, newData, oldData []byte, structSize int) error {
	c.cmdMu.Lock()
	defer c.cmdMu.Unlock()

	for _, ch := range PlanDiffSendChunks(newData, oldData, structSize) {
		if _, err := c.transceiveChunk(cmd, uint16(baseOffset+ch.Offset), byte(len(ch.Data)), ch.Data); err != nil {
			return err
		}
	}
	return nil
}
