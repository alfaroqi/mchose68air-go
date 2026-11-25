//go:build windows

package hid

import (
	"errors"
	"fmt"
	"strings"
	"syscall"
	"unsafe"
)

// DeviceInfo describes a discovered MCHOSE USB HID control interface.
type DeviceInfo struct {
	Path        string `json:"path"`
	VendorID    uint16 `json:"vendorId"`
	ProductID   uint16 `json:"productId"`
	ProductName string `json:"productName"`
	ModelTag    string `json:"modelTag"`
	ModelName   string `json:"modelName"`
	UsagePage   uint16 `json:"usagePage"`
	Usage       uint16 `json:"usage"`
	InputLen    uint16 `json:"inputLen"`
	OutputLen   uint16 `json:"outputLen"`
}

var knownModels = map[uint32]struct{ Tag, Name string }{
	// Ace 68 series
	0x41E4_2120: {"ace68_air_ii", "Ace 68 Air"},
	0x41E4_2132: {"ace68_air_iii", "Ace 68 Air (Ultra)"},
	0x3837_300A: {"ace68_air_2", "Ace 68 Air 2"},
	0x41E4_2114: {"ace68_i", "Ace 68"},
	0x41E4_2116: {"ace68_pro", "Ace 68 Pro"},
	0x3837_3003: {"ace68_iii", "Ace 68 (Ultra)"},
	0x3837_3024: {"ace68_v2", "Ace 68 V2"},
	0x3837_3026: {"ace68_v2", "Ace 68 Turbo (16K)"},
	0x3837_3028: {"ace68_v2", "Ace 68 Turbo (8K)"},
	0x3837_3007: {"ace68_v2", "Ace 68 GT"},
	// Other MCHOSE Cizhou keyboards
	0x41E4_2101: {"ace68_i", "Ace 60"},
	0x19F5_FC30: {"ace68_pro", "Ace 60 Pro"},
	0x3837_3040: {"ace68_pro", "Ace 60 Pro ISO"},
	0x3837_3002: {"ace68_pro", "Ace 60 Pro Nordic"},
	0x41E4_2126: {"ace68_i", "Ace 60X"},
	0x41E4_2112: {"ace68_pro", "Ace 60X II"},
	0x3837_301D: {"ace68_v2", "Ace 75 (16K)"},
	0x3837_303C: {"ace68_v2", "Ace 75 (8K)"},
	0x41E4_2118: {"ace68_pro", "Jet 75"},
	0x41E4_211A: {"ace68_pro", "Jet 75 II"},
	0x3837_3008: {"ace68_v2", "Jet 75 III"},
	0x3837_3020: {"ace68_v2", "God 60"},
	0x3837_302D: {"ace68_v2", "GT 75"},
	0x3837_300D: {"ace68_v2", "Mix 87"},
	0x41E4_211C: {"ace68_pro", "Zero75X"},
	0x3837_2021: {"ace68_v2", "G75 V2"},
	0x3837_2015: {"ace68_v2", "G87 V2"},
	0x3837_2025: {"ace68_v2", "G98 V3"},
	0x3837_2023: {"ace68_v2", "K87 V3"},
	0x3837_200E: {"ace68_v2", "K87S"},
	0x3837_2020: {"ace68_v2", "K99 V3"},
	0x3837_3033: {"ace68_v2", "MCHOSE 2.4G Wireless"},
	0x3837_1015: {"ace68_v2", "MCHOSE 2.4G Wireless"},
}

func isMchoseVID(vid uint16) bool {
	return vid == 0x41E4 || vid == 0x3837 || vid == 0x19F5
}

// EnumerateMchoseDevices scans Windows SetupAPI for connected MCHOSE Cizhou HID control interfaces.
func EnumerateMchoseDevices() ([]DeviceInfo, error) {
	var hidGuid guid
	procHidDGetHidGuid.Call(uintptr(unsafe.Pointer(&hidGuid)))

	hDevInfo, _, _ := procSetupDiGetClassDevsW.Call(
		uintptr(unsafe.Pointer(&hidGuid)),
		0,
		0,
		digcfPresent|digcfDeviceInterface,
	)
	if hDevInfo == uintptr(syscall.InvalidHandle) {
		return nil, errors.New("SetupDiGetClassDevsW failed")
	}
	defer procSetupDiDestroyDeviceInfoList.Call(hDevInfo)

	var results []DeviceInfo
	var index uint32
	for {
		var ifData spDeviceInterfaceData
		ifData.CbSize = uint32(unsafe.Sizeof(ifData))
		ok, _, _ := procSetupDiEnumDeviceInterfaces.Call(
			hDevInfo,
			0,
			uintptr(unsafe.Pointer(&hidGuid)),
			uintptr(index),
			uintptr(unsafe.Pointer(&ifData)),
		)
		if ok == 0 {
			break
		}
		index++

		var reqSize uint32
		procSetupDiGetDeviceInterfaceDetailW.Call(hDevInfo, uintptr(unsafe.Pointer(&ifData)), 0, 0, uintptr(unsafe.Pointer(&reqSize)), 0)
		if reqSize == 0 || reqSize > 4096 {
			continue
		}

		buf := make([]byte, reqSize)
		cbSize := uint32(8)
		if unsafe.Sizeof(uintptr(0)) == 4 {
			cbSize = 6
		}
		*(*uint32)(unsafe.Pointer(&buf[0])) = cbSize

		ok, _, _ = procSetupDiGetDeviceInterfaceDetailW.Call(
			hDevInfo,
			uintptr(unsafe.Pointer(&ifData)),
			uintptr(unsafe.Pointer(&buf[0])),
			uintptr(reqSize),
			0,
			0,
		)
		if ok == 0 {
			continue
		}

		utf16Slice := unsafe.Slice((*uint16)(unsafe.Pointer(&buf[4])), (reqSize-4)/2)
		devPath := syscall.UTF16ToString(utf16Slice)
		lowPath := strings.ToLower(devPath)
		if !strings.Contains(lowPath, "vid_41e4") && !strings.Contains(lowPath, "vid_3837") && !strings.Contains(lowPath, "vid_19f5") {
			continue
		}

		pathPtr, err := syscall.UTF16PtrFromString(devPath)
		if err != nil {
			continue
		}
		hMeta, err := syscall.CreateFile(pathPtr, 0, fileShareRead|fileShareWrite, nil, openExisting, 0, 0)
		if err != nil {
			continue
		}

		var attr hiddAttributes
		attr.Size = uint32(unsafe.Sizeof(attr))
		okAttr, _, _ := procHidDGetAttributes.Call(uintptr(hMeta), uintptr(unsafe.Pointer(&attr)))
		if okAttr == 0 || !isMchoseVID(attr.VendorID) {
			syscall.CloseHandle(hMeta)
			continue
		}

		var preparsed uintptr
		var caps hidpCaps
		if okP, _, _ := procHidDGetPreparsedData.Call(uintptr(hMeta), uintptr(unsafe.Pointer(&preparsed))); okP != 0 && preparsed != 0 {
			procHidPGetCaps.Call(preparsed, uintptr(unsafe.Pointer(&caps)))
			procHidDFreePreparsedData.Call(preparsed)
		}

		nameBuf := make([]uint16, 128)
		prodName := ""
		if okN, _, _ := procHidDGetProductString.Call(uintptr(hMeta), uintptr(unsafe.Pointer(&nameBuf[0])), uintptr(len(nameBuf)*2)); okN != 0 {
			prodName = syscall.UTF16ToString(nameBuf)
		}
		syscall.CloseHandle(hMeta)

		isControl := (caps.UsagePage == 0x0001 && caps.Usage == 0x0000) || (caps.UsagePage >= 0xFF00 && caps.OutputReportByteLength >= 64)
		if !isControl {
			continue
		}

		key := (uint32(attr.VendorID) << 16) | uint32(attr.ProductID)
		m, found := knownModels[key]
		if !found {
			m = struct{ Tag, Name string }{"ace68_air_ii", prodName}
			if m.Name == "" {
				m.Name = fmt.Sprintf("MCHOSE Keyboard (%04X:%04X)", attr.VendorID, attr.ProductID)
			}
		}

		results = append(results, DeviceInfo{
			Path:        devPath,
			VendorID:    attr.VendorID,
			ProductID:   attr.ProductID,
			ProductName: prodName,
			ModelTag:    m.Tag,
			ModelName:   m.Name,
			UsagePage:   caps.UsagePage,
			Usage:       caps.Usage,
			InputLen:    caps.InputReportByteLength,
			OutputLen:   caps.OutputReportByteLength,
		})
	}

	// Prioritize UsagePage 0x0001 Usage 0x0000 (primary Cizhou protocol channel)
	if len(results) > 1 {
		for i := 1; i < len(results); i++ {
			if results[i].UsagePage == 1 && results[i].Usage == 0 && !(results[0].UsagePage == 1 && results[0].Usage == 0) {
				results[0], results[i] = results[i], results[0]
				break
			}
		}
	}
	return results, nil
}
