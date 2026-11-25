//go:build windows

package protocol

import (
	"os"
	"testing"

	"mchose68air-go/internal/hid"
)

func TestKeyTriggerEncodeDecodeRoundTrip(t *testing.T) {
	cases := []KeyTrigger{
		{SwitchType: 0, KeyMode: 1, Priority: 0, KeyActuation: 10, PressPrecision: 0, ReleasePrecision: 0, RtPress: 2, RtRelease: 65, PressDeadzone: 15, ReleaseDeadzone: 15},
		{SwitchType: 7, KeyMode: 1, Priority: 2, KeyActuation: 340, PressPrecision: 3, ReleasePrecision: 2, RtPress: 260, RtRelease: 300, PressDeadzone: 100, ReleaseDeadzone: 85},
		{SwitchType: 1, KeyMode: 0, Priority: 0, KeyActuation: 200, PressPrecision: 0, ReleasePrecision: 0, RtPress: 15, RtRelease: 15, PressDeadzone: 0, ReleaseDeadzone: 0},
	}

	raw := make([]byte, len(cases)*8)
	for i, tc := range cases {
		enc := EncodeSingleTrigger(tc)
		if enc[0]&0xF0 != 0xA0 {
			t.Fatalf("case %d: header nibble = 0x%02X, want 0xA0", i, enc[0]&0xF0)
		}
		copy(raw[i*8:i*8+8], enc[:])
	}

	got := DecodeKeyTriggers(raw, len(cases))
	if len(got) != len(cases) {
		t.Fatalf("decoded len = %d, want %d", len(got), len(cases))
	}
	for i, want := range cases {
		if got[i] != want {
			t.Errorf("case %d mismatch:\n got: %+v\nwant: %+v", i, got[i], want)
		}
	}
}

func TestFuncConfigEncodeDecodeRoundTrip(t *testing.T) {
	raw := make([]byte, 64)
	raw[7] = 0x10

	wantPerf := PerformanceConfig{
		MacMode:                10,
		ReportRate:             1,
		TickRate:               2,
		DeadZone:               1,
		LockWin:                1,
		LockAltTab:             0,
		LockAltF4:              1,
		TachyonMode:            1,
		BottomRapidTriggerMode: 1,
		TravelCheck:            1,
		DebugMode:              0,
		DebounceLevel:          3,
		RtSmart:                7,
	}
	wantLight := LightConfig{
		Effect:                  6,
		Brightness:              4,
		Speed:                   3,
		Direct:                  1,
		CustomColorDisabled:     0,
		ColorIndex:              2,
		HexColor:                "#00d4ff",
		SideEffect:              2,
		SideBrightness:          3,
		SideSpeed:               1,
		SideCustomColorDisabled: 1,
		SideHexColor:            "#ff2d55",
	}

	ApplyPerformanceToRaw(raw, wantPerf, true)
	ApplyLightToRaw(raw, wantLight)

	if raw[7]&0x10 != 0x10 {
		t.Fatalf("reserved bit 4 in raw[7] was clobbered: 0x%02X", raw[7])
	}
	modPerf := wantPerf
	modPerf.ReportRate = 4
	ApplyPerformanceToRaw(raw, modPerf, false)

	gotPerf, gotLight := DecodeFuncConfig(raw)
	if gotPerf != wantPerf {
		t.Errorf("perf mismatch:\n got: %+v\nwant: %+v", gotPerf, wantPerf)
	}
	if gotLight != wantLight {
		t.Errorf("light mismatch:\n got: %+v\nwant: %+v", gotLight, wantLight)
	}
}

func TestAdvancedSlotsAndProfileNames(t *testing.T) {
	dks := make([]DksSlot, 32)
	dks[1] = DksSlot{
		Points: [4]byte{10, 30, 30, 10},
		Actions: [4]KeyTuple{
			{Type: 16, Code1: 0, Code2: 26}, // W
			{Type: 16, Code1: 2, Code2: 0},  // LShift
			{},
			{},
		},
		Flags: [4]uint16{0b0000000111, 0b0000111000, 0, 0},
	}
	if got := DecodeDksSlots(EncodeDksSlots(dks)); got[1] != dks[1] {
		t.Fatalf("DKS slot round-trip mismatch: got %+v want %+v", got[1], dks[1])
	}

	mt := make([]MtSlot, 32)
	mt[0] = MtSlot{
		Click: KeyTuple{Type: 16, Code1: 0, Code2: 4},
		Down:  KeyTuple{Type: 16, Code1: 0, Code2: 7},
	}
	if got := DecodeMtSlots(EncodeMtSlots(mt)); got[0] != mt[0] {
		t.Fatalf("MT slot round-trip mismatch: got %+v want %+v", got[0], mt[0])
	}

	tgl := make([]KeyTuple, 32)
	tgl[2] = KeyTuple{Type: 16, Code1: 2, Code2: 0}
	if got := DecodeTglSlots(EncodeTglSlots(tgl)); got[2] != tgl[2] {
		t.Fatalf("TGL slot round-trip mismatch: got %+v want %+v", got[2], tgl[2])
	}

	rawNames := append([]byte(`["my config 1","ax1","x1"]`), 0xFF, 0xFF, 0xFF)
	names := DecodeCustomJSONStrings(rawNames)
	if len(names) != 3 || names[0] != "my config 1" || names[2] != "x1" {
		t.Fatalf("profile names decode mismatch: %v", names)
	}
}

// TestLiveHardwareActuationRoundTrip verifies real USB HID write + read-back + restore.
// Run with: $env:MCHOSE_LIVE_TEST="1"; go test -v ./internal/protocol -run TestLiveHardwareActuationRoundTrip
func TestLiveHardwareActuationRoundTrip(t *testing.T) {
	if os.Getenv("MCHOSE_LIVE_TEST") != "1" {
		t.Skip("set MCHOSE_LIVE_TEST=1 to run live USB HID hardware round-trip test")
	}

	conn, err := hid.Open()
	if err != nil {
		t.Fatalf("hid.Open failed: %v", err)
	}
	client := NewClient(conn)
	defer client.Close()

	st, err := client.ReadFullState(-1, 0)
	if err != nil {
		t.Fatalf("ReadFullState failed: %v", err)
	}
	prof := st.Profile
	const testKeyIdx = 0
	orig := st.Triggers[testKeyIdx]
	t.Logf("Connected %s (FW %s), profile=%d, key[%d] original actuation=%d (%.2fmm)",
		st.Device.ModelName, st.FirmwareVer, prof, testKeyIdx, orig.KeyActuation, float64(orig.KeyActuation)/100)

	defer func() {
		if rErr := client.WriteKeyTriggerUpdates(prof, map[int]KeyTrigger{testKeyIdx: orig}); rErr != nil {
			t.Errorf("failed to restore original trigger: %v", rErr)
		}
		if checkRaw, rErr := conn.SimpleGet(160, 1024*prof, 1024); rErr == nil {
			restored := DecodeKeyTriggers(checkRaw, 128)[testKeyIdx]
			if restored != orig {
				t.Errorf("restore verification mismatch: got %+v want %+v", restored, orig)
			}
		}
	}()

	testAct := 123
	if orig.KeyActuation == testAct {
		testAct = 177
	}
	modified := orig
	modified.KeyActuation = testAct

	if err := client.WriteKeyTriggerUpdates(prof, map[int]KeyTrigger{testKeyIdx: modified}); err != nil {
		t.Fatalf("WriteKeyTriggerUpdates failed: %v", err)
	}

	afterRaw, err := conn.SimpleGet(160, 1024*prof, 1024)
	if err != nil {
		t.Fatalf("read-back cmd 160 failed: %v", err)
	}
	after := DecodeKeyTriggers(afterRaw, 128)[testKeyIdx]
	if after.KeyActuation != testAct {
		t.Fatalf("HARDWARE DID NOT PERSIST ACTUATION: got %d, want %d", after.KeyActuation, testAct)
	}
}
