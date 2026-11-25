# MCHOSE Ace 68 / Ace 68 Air — Native Go Offline Driver

Fast, 100% offline Windows desktop driver for MCHOSE Cizhou magnetic-switch keyboards (Ace 68 / Air / Pro / Turbo / V2, Ace 60, Jet 75, Mix 87, etc.) built with pure Go (`hid.dll` + `setupapi.dll`, zero external Go dependencies, zero cloud telemetry).

## Project Structure

```text
mchose68air-go/
├── cmd/
│   └── mchose-hub/
│       └── main.go              # CLI flags, local HTTP server, Edge/Chrome app window launcher
├── internal/
│   ├── hid/
│   │   ├── devices.go           # MCHOSE VID/PID catalog & Windows SetupAPI USB HID enumeration
│   │   ├── framing.go           # Cizhou 64-byte packet framing & 56-byte chunk diff planner
│   │   ├── hid_windows.go       # Overlapped Win32 HID I/O, async background reader, event pub/sub
│   │   └── framing_test.go      # Unit tests for framing and chunk planning
│   ├── protocol/
│   │   ├── types.go             # Trigger, Performance, Lighting, KeyMap, AdvancedKey structs
│   │   ├── codec.go             # Binary encoders/decoders matching Cizhou GLW firmware layout
│   │   ├── client.go            # High-level keyboard operations (state sync, triggers, RGB, SOCD/MT/TGL, calibration)
│   │   └── protocol_test.go     # Codec unit tests + opt-in live hardware round-trip test
│   └── server/
│       ├── server.go            # Local REST API & SSE live telemetry stream
│       └── server_test.go       # API & routing unit tests
├── web/
│   ├── embed.go                 # Go embed wrapper for frontend assets
│   └── assets/
│       ├── index.html           # Official-style Light UI (all 6 tabs + Device Picker modal)
│       ├── style.css
│       ├── app.js
│       └── ace68_models.json    # Hardware key matrix & switch definitions
├── go.mod
└── .gitignore
```

## Build

```powershell
go build -ldflags="-s -w -H=windowsgui" -o MCHOSE-Ace68-Go.exe ./cmd/mchose-hub
```

## Test

Run all unit tests (no keyboard required):

```powershell
go test -v ./...
```

Run live USB HID actuation write/read-back/restore verification against a plugged-in keyboard:

```powershell
$env:MCHOSE_LIVE_TEST="1"
go test -v ./internal/protocol -run TestLiveHardwareActuationRoundTrip
```


> Disclaimer: This is an unofficial, community-built tool reverse-engineered for personal use and is not affiliated with MCHOSE. While tested with live hardware round-trip verification, use at your own risk.