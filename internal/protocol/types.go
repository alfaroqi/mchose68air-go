package protocol

import "mchose68air-go/internal/hid"

// KeyTrigger matches the Cizhou 8-byte per-key magnetic switch trigger struct.
type KeyTrigger struct {
	SwitchType       int `json:"switchType"`
	KeyMode          int `json:"keyMode"`          // 0=Normal, 1=RapidTrigger
	Priority         int `json:"priority"`         // SOCD priority (0=Last, 1=Key1, 2=Key2, 3=Neutral)
	KeyActuation     int `json:"keyActuation"`     // units of 0.01mm (10..350)
	PressPrecision   int `json:"pressPrecision"`   // 0..3
	ReleasePrecision int `json:"releasePrecision"` // 0..3
	RtPress          int `json:"rtPress"`          // units of 0.01mm (1..240)
	RtRelease        int `json:"rtRelease"`        // units of 0.01mm (1..240)
	PressDeadzone    int `json:"pressDeadzone"`    // units of 0.01mm (0..100)
	ReleaseDeadzone  int `json:"releaseDeadzone"`  // units of 0.01mm (0..100)
}

// PerformanceConfig matches GLW FuncConfig performance bytes.
// ReportRate values on GLW: 4=1000Hz, 3=2000Hz, 2=4000Hz, 1=8000Hz, 0=16000Hz.
type PerformanceConfig struct {
	MacMode                int `json:"macMode"`
	ReportRate             int `json:"reporteRate"`
	TickRate               int `json:"tickRate"`
	DeadZone               int `json:"deadZone"`
	LockWin                int `json:"lockWin"`
	LockAltTab             int `json:"lockAltTap"`
	LockAltF4              int `json:"lockAltF4"`
	TachyonMode            int `json:"tachyonMode"`            // Berserk mode
	BottomRapidTriggerMode int `json:"bottomrapidtriggerMode"` // Stability mode
	TravelCheck            int `json:"travelCheck"`            // Adaptive dynamic calibration
	DebugMode              int `json:"debugMode"`              // Streams 0xA0 live travel telemetry
	DebounceLevel          int `json:"debounceLevel"`          // Key debounce optimization
	RtSmart                int `json:"rtsmart"`                // 0=off, 1..15=anti-noise level
}

// LightConfig matches GLW FuncConfig lighting bytes.
type LightConfig struct {
	Effect                  int    `json:"effect"`     // 0=Custom, 1..22=Effects, 255=Off
	Brightness              int    `json:"brightness"` // 0..4 (0=off)
	Speed                   int    `json:"speed"`      // 0..4
	Direct                  int    `json:"direct"`     // 0 or 1
	CustomColorDisabled     int    `json:"customColorDisabled"`
	ColorIndex              int    `json:"colorIndex"`
	HexColor                string `json:"hexColor"`
	SideEffect              int    `json:"side_effect"`
	SideBrightness          int    `json:"side_brightness"`
	SideSpeed               int    `json:"side_speed"`
	SideCustomColorDisabled int    `json:"sideCustomColorDisabled"`
	SideHexColor            string `json:"side_hexColor"`
}

// KeyMapEntry represents a 3-byte key assignment in the key matrix.
// Types: 16=Normal/Mod, 144=DKS, 145=TGL, 146=MT, 147=RS, 148=SOCD, 240=FN
type KeyMapEntry struct {
	Index int  `json:"index"`
	Layer int  `json:"layer"`
	Type  byte `json:"type"`
	Code1 byte `json:"code1"`
	Code2 byte `json:"code2"`
}

// KeyTuple is a 3-byte key code tuple used inside MT/SOCD/TGL slots.
type KeyTuple struct {
	Type  byte `json:"type"`
	Code1 byte `json:"code1"`
	Code2 byte `json:"code2"`
}

// MtSlot is a 6-byte entry in the MT/SOCD/RS table (cmd 164/165, up to 32 slots).
type MtSlot struct {
	Click KeyTuple `json:"click"`
	Down  KeyTuple `json:"down"`
}

// DksSlot is a 24-byte entry in the DKS table (cmd 162/163, up to 32 slots).
// Layout: [0..3]=points (0.1mm units), then 4x5-byte action blocks: [type, code1, code2, flagsLo, flagsHi].
type DksSlot struct {
	Points  [4]byte     `json:"points"`  // e.g. [10, 30, 30, 10] => 1.0mm, 3.0mm
	Actions [4]KeyTuple `json:"actions"` // up to 4 mapped keys
	Flags   [4]uint16   `json:"flags"`   // 10-bit stage flags per action (bits 0..2=s0, 3..5=s1, 6..8=s2, 9=s3)
}

// AdvancedKeysState holds DKS, MT/SOCD, and TGL slot tables for the current profile.
type AdvancedKeysState struct {
	Dks []DksSlot  `json:"dks"`
	Mt  []MtSlot   `json:"mt"`
	Tgl []KeyTuple `json:"tgl"`
}

// FullKeyboardState is the complete snapshot returned to the UI on connect/sync.
type FullKeyboardState struct {
	Connected    bool              `json:"connected"`
	Device       *hid.DeviceInfo   `json:"device,omitempty"`
	FirmwareVer  string            `json:"firmwareVer"`
	Profile      int               `json:"profile"`
	ProfileCount int               `json:"profileCount"`
	ProfileOrder []int             `json:"profileOrder"`
	ProfileNames []string          `json:"profileNames"`
	Layer        int               `json:"layer"`
	Performance  PerformanceConfig `json:"performance"`
	Lighting     LightConfig       `json:"lighting"`
	CustomColors []string          `json:"customColors"`
	Triggers     []KeyTrigger      `json:"triggers"`
	KeyMatrix    []KeyMapEntry     `json:"keyMatrix"`
	AdvancedKeys AdvancedKeysState `json:"advancedKeys"`
}
