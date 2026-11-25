package protocol

import (
	"encoding/json"
	"fmt"
)

func DecodeKeyTriggers(raw []byte, maxKeys int) []KeyTrigger {
	count := len(raw) / 8
	if count > maxKeys {
		count = maxKeys
	}
	out := make([]KeyTrigger, count)
	for i := 0; i < count; i++ {
		o := raw[i*8 : i*8+8]
		act := int(uint16(o[2])|(uint16(o[3]&1)<<8)) + 1
		rtp := int(uint16(o[4])|(uint16(o[5]&1)<<8)) + 1
		rtr := int(uint16(o[6])|(uint16(o[7]&1)<<8)) + 1
		out[i] = KeyTrigger{
			SwitchType:       int(o[0] & 0x0F),
			KeyMode:          int(o[1] & 0x0F),
			Priority:         int(o[1] >> 4),
			KeyActuation:     act,
			PressPrecision:   int((o[3] >> 3) & 0x03),
			ReleasePrecision: int((o[3] >> 1) & 0x03),
			RtPress:          rtp,
			RtRelease:        rtr,
			PressDeadzone:    int((o[5] >> 1) & 0x7F),
			ReleaseDeadzone:  int((o[7] >> 1) & 0x7F),
		}
	}
	return out
}

func EncodeSingleTrigger(t KeyTrigger) [8]byte {
	var n [8]byte
	n[0] = 0xA0 | byte(t.SwitchType&0x0F)
	if t.Priority != 0 {
		n[1] = byte(((t.Priority & 0x0F) << 4) | (t.KeyMode & 0x0F))
	} else {
		n[1] = byte(t.KeyMode & 0x0F)
	}
	act := t.KeyActuation - 1
	if act < 0 {
		act = 0
	}
	n[2] = byte(act & 0xFF)
	n[3] = byte(((act >> 8) & 1) | ((t.PressPrecision & 3) << 3) | ((t.ReleasePrecision & 3) << 1))

	rtp := t.RtPress - 1
	if rtp < 0 {
		rtp = 0
	}
	pdz := t.PressDeadzone
	if pdz < 0 {
		pdz = 0
	}
	n[4] = byte(rtp & 0xFF)
	n[5] = byte(((rtp >> 8) & 1) | ((pdz & 0x7F) << 1))

	rtr := t.RtRelease - 1
	if rtr < 0 {
		rtr = 0
	}
	rdz := t.ReleaseDeadzone
	if rdz < 0 {
		rdz = 0
	}
	n[6] = byte(rtr & 0xFF)
	n[7] = byte(((rtr >> 8) & 1) | ((rdz & 0x7F) << 1))
	return n
}

func rgbToHex(r, g, b byte) string {
	return fmt.Sprintf("#%02x%02x%02x", r, g, b)
}

func hexToRGB(h string) (byte, byte, byte) {
	if len(h) == 7 && h[0] == '#' {
		var r, g, b uint8
		fmt.Sscanf(h[1:], "%02x%02x%02x", &r, &g, &b)
		return r, g, b
	}
	return 0, 212, 255
}

func DecodeFuncConfig(e []byte) (PerformanceConfig, LightConfig) {
	var p PerformanceConfig
	var l LightConfig
	if len(e) < 40 {
		return p, l
	}
	p = PerformanceConfig{
		MacMode:                int(e[1] & 0x0F),
		ReportRate:             int(e[4] & 0x0F),
		TickRate:               int((e[4] >> 4) & 0x0F),
		DeadZone:               int(e[5]),
		LockWin:                int(e[6] & 1),
		LockAltTab:             int((e[6] >> 1) & 1),
		LockAltF4:              int((e[6] >> 2) & 1),
		TachyonMode:            int(e[7] & 1),
		BottomRapidTriggerMode: int((e[7] >> 1) & 1),
		TravelCheck:            int((e[7] >> 2) & 1),
		DebugMode:              int((e[7] >> 3) & 1),
		DebounceLevel:          int((e[7] >> 5) & 7),
		RtSmart:                int(e[20]),
	}
	l = LightConfig{
		Effect:                  int(e[8]),
		Brightness:              int(e[9]),
		Speed:                   4 - int(e[10]),
		Direct:                  int(e[11]),
		CustomColorDisabled:     int(e[12]),
		ColorIndex:              int(e[13]),
		HexColor:                rgbToHex(e[14], e[15], e[16]),
		SideEffect:              int(e[24]),
		SideBrightness:          int(e[25]),
		SideSpeed:               4 - int(e[26]),
		SideCustomColorDisabled: int(e[27]),
		SideHexColor:            rgbToHex(e[29], e[30], e[31]),
	}
	if l.Speed < 0 {
		l.Speed = 0
	}
	if l.Speed > 4 {
		l.Speed = 4
	}
	if l.SideSpeed < 0 {
		l.SideSpeed = 0
	}
	if l.SideSpeed > 4 {
		l.SideSpeed = 4
	}
	return p, l
}

func ApplyPerformanceToRaw(e []byte, p PerformanceConfig, updateRate bool) {
	e[1] = (e[1] & 0xF0) | byte(p.MacMode&0x0F)
	if updateRate {
		e[4] = byte(((p.TickRate & 0x0F) << 4) | (p.ReportRate & 0x0F))
	}
	e[5] = byte(p.DeadZone)
	e[6] = (e[6] & 0xF8) | byte(((p.LockAltF4&1)<<2)|((p.LockAltTab&1)<<1)|(p.LockWin&1))
	e[7] = (e[7] & 0x10) | byte(((p.DebounceLevel&7)<<5)|((p.DebugMode&1)<<3)|((p.TravelCheck&1)<<2)|((p.BottomRapidTriggerMode&1)<<1)|(p.TachyonMode&1))
	e[20] = byte(p.RtSmart)
}

func ApplyLightToRaw(e []byte, l LightConfig) {
	r, g, b := hexToRGB(l.HexColor)
	sr, sg, sb := hexToRGB(l.SideHexColor)
	e[8] = byte(l.Effect)
	e[9] = byte(l.Brightness)
	sp := 4 - l.Speed
	if sp < 0 {
		sp = 0
	}
	e[10] = byte(sp)
	e[11] = byte(l.Direct)
	if l.CustomColorDisabled != 0 {
		e[12] = 1
	} else {
		e[12] = 0
	}
	e[13] = byte(l.ColorIndex)
	e[14], e[15], e[16] = r, g, b

	e[24] = byte(l.SideEffect)
	e[25] = byte(l.SideBrightness)
	ssp := 4 - l.SideSpeed
	if ssp < 0 {
		ssp = 0
	}
	e[26] = byte(ssp)
	if l.SideCustomColorDisabled != 0 {
		e[27] = 1
	} else {
		e[27] = 0
	}
	e[29], e[30], e[31] = sr, sg, sb
}

func DecodeKeyMatrix(raw []byte, layer int) []KeyMapEntry {
	n := len(raw) / 3
	out := make([]KeyMapEntry, n)
	for i := 0; i < n; i++ {
		out[i] = KeyMapEntry{
			Index: i,
			Layer: layer,
			Type:  raw[i*3],
			Code1: raw[i*3+1],
			Code2: raw[i*3+2],
		}
	}
	return out
}

func DecodeDksSlots(raw []byte) []DksSlot {
	out := make([]DksSlot, 32)
	for i := 0; i < 32 && i*24+23 < len(raw); i++ {
		o := raw[i*24 : i*24+24]
		var slot DksSlot
		copy(slot.Points[:], o[0:4])
		for a := 0; a < 4; a++ {
			base := 4 + a*5
			slot.Actions[a] = KeyTuple{Type: o[base], Code1: o[base+1], Code2: o[base+2]}
			slot.Flags[a] = uint16(o[base+3]) | (uint16(o[base+4]) << 8)
		}
		out[i] = slot
	}
	return out
}

func EncodeDksSlots(slots []DksSlot) []byte {
	buf := make([]byte, 768)
	for i := 0; i < len(slots) && i < 32; i++ {
		base := i * 24
		copy(buf[base:base+4], slots[i].Points[:])
		for a := 0; a < 4; a++ {
			off := base + 4 + a*5
			buf[off] = slots[i].Actions[a].Type
			buf[off+1] = slots[i].Actions[a].Code1
			buf[off+2] = slots[i].Actions[a].Code2
			buf[off+3] = byte(slots[i].Flags[a] & 0xFF)
			buf[off+4] = byte((slots[i].Flags[a] >> 8) & 0xFF)
		}
	}
	return buf
}

func DecodeMtSlots(raw []byte) []MtSlot {
	out := make([]MtSlot, 32)
	for i := 0; i < 32 && i*6+5 < len(raw); i++ {
		o := raw[i*6 : i*6+6]
		out[i] = MtSlot{
			Click: KeyTuple{Type: o[0], Code1: o[1], Code2: o[2]},
			Down:  KeyTuple{Type: o[3], Code1: o[4], Code2: o[5]},
		}
	}
	return out
}

func EncodeMtSlots(slots []MtSlot) []byte {
	buf := make([]byte, 256)
	for i := 0; i < len(slots) && i < 32; i++ {
		buf[i*6] = slots[i].Click.Type
		buf[i*6+1] = slots[i].Click.Code1
		buf[i*6+2] = slots[i].Click.Code2
		buf[i*6+3] = slots[i].Down.Type
		buf[i*6+4] = slots[i].Down.Code1
		buf[i*6+5] = slots[i].Down.Code2
	}
	return buf
}

func DecodeTglSlots(raw []byte) []KeyTuple {
	out := make([]KeyTuple, 32)
	for i := 0; i < 32 && i*3+2 < len(raw); i++ {
		out[i] = KeyTuple{Type: raw[i*3], Code1: raw[i*3+1], Code2: raw[i*3+2]}
	}
	return out
}

func EncodeTglSlots(slots []KeyTuple) []byte {
	buf := make([]byte, 128)
	for i := 0; i < len(slots) && i < 32; i++ {
		buf[i*3] = slots[i].Type
		buf[i*3+1] = slots[i].Code1
		buf[i*3+2] = slots[i].Code2
	}
	return buf
}

func DecodeCustomColors(raw []byte) []string {
	n := len(raw) / 3
	out := make([]string, n)
	for i := 0; i < n; i++ {
		out[i] = rgbToHex(raw[i*3], raw[i*3+1], raw[i*3+2])
	}
	return out
}

func DecodeCustomJSONStrings(raw []byte) []string {
	end := len(raw)
	for i, b := range raw {
		if b == 0xFF || b == 0x00 {
			end = i
			break
		}
	}
	if end <= 2 {
		return nil
	}
	var out []string
	if err := json.Unmarshal(raw[:end], &out); err == nil {
		return out
	}
	return nil
}
