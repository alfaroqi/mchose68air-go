//go:build windows

package protocol

import (
	"encoding/json"
	"fmt"

	"mchose68air-go/internal/hid"
)

// Client provides high-level Cizhou GLW keyboard operations over a HID connection.
type Client struct {
	Conn *hid.Conn
}

func NewClient(conn *hid.Conn) *Client {
	return &Client{Conn: conn}
}

func (c *Client) Close() {
	if c != nil && c.Conn != nil {
		c.Conn.Close()
	}
}

func (c *Client) ReadFullState(profileOverride int, layer int) (*FullKeyboardState, error) {
	infoRaw, err := c.Conn.SimpleGet(3, 0, 56)
	if err != nil {
		return nil, fmt.Errorf("getInfo: %w", err)
	}
	fwVer := fmt.Sprintf("%x", (uint16(infoRaw[1])<<8)|uint16(infoRaw[0]))

	baseRaw, err := c.Conn.SimpleGet(4, 0, 56)
	if err != nil {
		return nil, fmt.Errorf("getBase: %w", err)
	}
	profCount := int(baseRaw[1])
	if profCount < 1 || profCount > 4 {
		profCount = 3
	}
	order := make([]int, profCount)
	for i := 0; i < profCount; i++ {
		order[i] = int(baseRaw[2+i])
	}
	activeOrderIdx := int(baseRaw[0])
	activeProf := 0
	if activeOrderIdx >= 0 && activeOrderIdx < len(order) {
		activeProf = order[activeOrderIdx]
	}
	if profileOverride >= 0 && profileOverride < profCount {
		activeProf = profileOverride
	}

	funcRaw, err := c.Conn.SimpleGet(5, 64*activeProf, 64)
	if err != nil {
		return nil, fmt.Errorf("getFuncConfig: %w", err)
	}
	perf, light := DecodeFuncConfig(funcRaw)

	trigRaw, err := c.Conn.SimpleGet(160, 1024*activeProf, 1024)
	if err != nil {
		return nil, fmt.Errorf("getKeyTrigger: %w", err)
	}
	triggers := DecodeKeyTriggers(trigRaw, 128)

	kmRaw, err := c.Conn.SimpleGet(8, 512*(4*activeProf+layer), 384)
	if err != nil {
		kmRaw = make([]byte, 384)
	}
	km := DecodeKeyMatrix(kmRaw, layer)

	var customColors []string
	if ccRaw, err := c.Conn.SimpleGet(10, 512*activeProf, 384); err == nil {
		customColors = DecodeCustomColors(ccRaw)
	}

	var dksSlots []DksSlot
	if dksRaw, err := c.Conn.SimpleGet(162, 768*activeProf, 768); err == nil {
		dksSlots = DecodeDksSlots(dksRaw)
	}
	var mtSlots []MtSlot
	if mtRaw, err := c.Conn.SimpleGet(164, 256*activeProf, 192); err == nil {
		mtSlots = DecodeMtSlots(mtRaw)
	}
	var tglSlots []KeyTuple
	if tglRaw, err := c.Conn.SimpleGet(166, 128*activeProf, 96); err == nil {
		tglSlots = DecodeTglSlots(tglRaw)
	}

	var profNames []string
	if pnRaw, err := c.Conn.SimpleGet(241, 336, 280); err == nil {
		profNames = DecodeCustomJSONStrings(pnRaw)
	}

	devCopy := c.Conn.Info
	return &FullKeyboardState{
		Connected:    true,
		Device:       &devCopy,
		FirmwareVer:  fwVer,
		Profile:      activeProf,
		ProfileCount: profCount,
		ProfileOrder: order,
		ProfileNames: profNames,
		Layer:        layer,
		Performance:  perf,
		Lighting:     light,
		CustomColors: customColors,
		Triggers:     triggers,
		KeyMatrix:    km,
		AdvancedKeys: AdvancedKeysState{Dks: dksSlots, Mt: mtSlots, Tgl: tglSlots},
	}, nil
}

func (c *Client) SwitchProfile(activeProf int) error {
	baseRaw, err := c.Conn.SimpleGet(4, 0, 56)
	if err != nil {
		return err
	}
	profCount := int(baseRaw[1])
	if profCount < 1 || profCount > 4 {
		profCount = 3
		baseRaw[1] = 3
		baseRaw[2], baseRaw[3], baseRaw[4] = 0, 1, 2
	}
	idx := 0
	for i := 0; i < profCount; i++ {
		if int(baseRaw[2+i]) == activeProf {
			idx = i
			break
		}
	}
	baseRaw[0] = byte(idx)
	return c.Conn.SimpleSend(14, 0, baseRaw, 56)
}

func (c *Client) WriteProfileNames(names []string) error {
	encoded, err := json.Marshal(names)
	if err != nil {
		return err
	}
	buf := make([]byte, 280)
	for i := range buf {
		buf[i] = 0xFF
	}
	copy(buf, encoded)
	sendLen := ((len(encoded) + 1 + 55) / 56) * 56
	if sendLen > 280 {
		sendLen = 280
	}
	if sendLen < 56 {
		sendLen = 56
	}
	return c.Conn.SimpleSend(242, 336, buf[:sendLen], 1)
}

func (c *Client) WriteKeyTriggerUpdates(profile int, updates map[int]KeyTrigger) error {
	if len(updates) == 0 {
		return nil
	}
	oldRaw, err := c.Conn.SimpleGet(160, 1024*profile, 1024)
	if err != nil {
		return err
	}
	newRaw := make([]byte, len(oldRaw))
	copy(newRaw, oldRaw)
	for idx, t := range updates {
		if idx >= 0 && idx < 128 {
			b := EncodeSingleTrigger(t)
			copy(newRaw[idx*8:idx*8+8], b[:])
		}
	}
	return c.Conn.SimpleUpdateSend(161, 1024*profile, newRaw, oldRaw, 8)
}

func (c *Client) WriteLighting(profile int, light LightConfig) error {
	raw, err := c.Conn.SimpleGet(5, 64*profile, 64)
	if err != nil {
		return err
	}
	ApplyLightToRaw(raw, light)
	return c.Conn.SimpleSend(6, 64*profile, raw, 64)
}

func (c *Client) WriteCustomKeyColors(profile int, updates map[int]string) error {
	if len(updates) > 20 {
		raw, err := c.Conn.SimpleGet(10, 512*profile, 384)
		if err != nil {
			raw = make([]byte, 384)
		}
		for idx, hx := range updates {
			if idx >= 0 && idx < 128 {
				r, g, b := hexToRGB(hx)
				raw[idx*3], raw[idx*3+1], raw[idx*3+2] = r, g, b
			}
		}
		return c.Conn.SimpleSend(11, 512*profile, raw, 3)
	}
	for idx, hx := range updates {
		if idx < 0 || idx >= 128 {
			continue
		}
		r, g, b := hexToRGB(hx)
		if err := c.Conn.SimpleSend(11, 512*profile+3*idx, []byte{r, g, b}, 3); err != nil {
			return err
		}
	}
	return nil
}

func (c *Client) WritePerformance(profile int, perf PerformanceConfig, updateRate bool) error {
	raw, err := c.Conn.SimpleGet(5, 64*profile, 64)
	if err != nil {
		return err
	}
	ApplyPerformanceToRaw(raw, perf, updateRate)
	return c.Conn.SimpleSend(6, 64*profile, raw, 64)
}

func (c *Client) SetDebugMode(profile int, enabled bool) error {
	raw, err := c.Conn.SimpleGet(5, 64*profile, 64)
	if err != nil {
		return err
	}
	perf, _ := DecodeFuncConfig(raw)
	if enabled {
		perf.DebugMode = 1
	} else {
		perf.DebugMode = 0
	}
	ApplyPerformanceToRaw(raw, perf, false)
	if err := c.Conn.SimpleSend(6, 64*profile, raw, 64); err != nil {
		return err
	}
	// GLW Cizhou firmware streams 0xA0 real-time key travel packets when BOTH debugMode=1 AND cmd 168 are active.
	if enabled {
		return c.Conn.SimpleSend(168, 0, []byte{0}, 1)
	}
	return c.Conn.SimpleSend(169, 0, []byte{0}, 1)
}

func (c *Client) WriteKeyRemap(profile int, layer int, keyIndex int, typ, c1, c2 byte) error {
	offset := 512*(4*profile+layer) + 3*keyIndex
	return c.Conn.SimpleSend(9, offset, []byte{typ, c1, c2}, 3)
}

func (c *Client) WriteAdvancedKeys(profile int, dks []DksSlot, mt []MtSlot, tgl []KeyTuple) error {
	if len(dks) > 0 {
		if err := c.Conn.SimpleSend(163, 768*profile, EncodeDksSlots(dks), 24); err != nil {
			return err
		}
	}
	if len(mt) > 0 {
		if err := c.Conn.SimpleSend(165, 256*profile, EncodeMtSlots(mt), 6); err != nil {
			return err
		}
	}
	if len(tgl) > 0 {
		if err := c.Conn.SimpleSend(167, 128*profile, EncodeTglSlots(tgl), 3); err != nil {
			return err
		}
	}
	return nil
}

func (c *Client) StartCalibration(profile int) error {
	return c.SetDebugMode(profile, true)
}

func (c *Client) EndCalibration(profile int) error {
	return c.SetDebugMode(profile, false)
}

func (c *Client) RestartCalibration() error {
	if err := c.Conn.SimpleSend(169, 0, []byte{0}, 1); err != nil {
		return err
	}
	if err := c.Conn.SimpleSend(177, 0, []byte{0}, 1); err != nil {
		return err
	}
	return c.Conn.SimpleSend(168, 0, []byte{0}, 1)
}

func (c *Client) FactoryReset() error {
	return c.Conn.SimpleSend(238, 0, []byte{0xFF}, 1)
}
