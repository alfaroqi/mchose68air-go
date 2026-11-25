package hid

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
)

func TestBuildCizhouFrameChecksumAndLayout(t *testing.T) {
	payload := []byte{0xA0, 0x01, 0x36, 0x00, 0x27, 0x1E, 0x27, 0x1E}
	pkt := BuildCizhouFrame(161, 1024+80, byte(len(payload)), payload)

	if pkt[0] != 0x55 || pkt[1] != 161 || pkt[2] != 0x00 || pkt[4] != 8 {
		t.Fatalf("unexpected header: %X", pkt[:8])
	}
	gotOff := uint16(pkt[5]) | (uint16(pkt[6]) << 8)
	if gotOff != 1104 {
		t.Fatalf("offset = %d, want 1104", gotOff)
	}
	if !bytes.Equal(pkt[8:16], payload) {
		t.Fatalf("payload mismatch: got %X, want %X", pkt[8:16], payload)
	}
	var sum uint32
	for i := 4; i < 64; i++ {
		sum += uint32(pkt[i])
	}
	if pkt[3] != byte(sum&0xFF) {
		t.Fatalf("checksum = 0x%02X, want 0x%02X", pkt[3], byte(sum&0xFF))
	}
}

func TestPlanFullSendChunksNoPartialTail(t *testing.T) {
	data := make([]byte, 1024)
	for i := range data {
		data[i] = byte(i & 0xFF)
	}
	chunks := PlanFullSendChunks(data, 8)
	if len(chunks) != 19 {
		t.Fatalf("1024B chunks = %d, want 19", len(chunks))
	}
	for i, ch := range chunks {
		if len(ch.Data) != 56 {
			t.Fatalf("chunk %d len = %d, want 56", i, len(ch.Data))
		}
		if !bytes.Equal(ch.Data, data[ch.Offset:ch.Offset+56]) {
			t.Fatalf("chunk %d data mismatch at offset %d", i, ch.Offset)
		}
	}
	if last := chunks[len(chunks)-1]; last.Offset != 1024-56 {
		t.Fatalf("last chunk offset = %d, want %d", last.Offset, 1024-56)
	}

	fc := make([]byte, 64)
	for i := range fc {
		fc[i] = byte(i)
	}
	fcChunks := PlanFullSendChunks(fc, 64)
	if len(fcChunks) != 2 || fcChunks[0].Offset != 0 || len(fcChunks[0].Data) != 56 || fcChunks[1].Offset != 8 || len(fcChunks[1].Data) != 56 {
		t.Fatalf("unexpected 64B FuncConfig chunks: %+v", fcChunks)
	}
}

func TestPlanDiffSendChunksSingleAndWASD(t *testing.T) {
	oldRaw := make([]byte, 1024)
	newRaw := make([]byte, 1024)
	for i := range oldRaw {
		oldRaw[i] = byte(i & 0xFF)
		newRaw[i] = oldRaw[i]
	}

	if ch := PlanDiffSendChunks(newRaw, oldRaw, 8); len(ch) != 0 {
		t.Fatalf("expected 0 chunks for identical buffers, got %d", len(ch))
	}

	// Single key update at index 10 -> 1 full 56-byte packet at offset 80
	newRaw[10*8+2] = 0x09
	ch1 := PlanDiffSendChunks(newRaw, oldRaw, 8)
	if len(ch1) != 1 || len(ch1[0].Data) != 56 || ch1[0].Offset != 80 {
		t.Fatalf("single key update unexpected: %+v", ch1)
	}

	// Tail key at index 127 -> 1 full 56-byte packet shifted back to offset 968
	copy(newRaw, oldRaw)
	newRaw[127*8+2] = 0x33
	chEnd := PlanDiffSendChunks(newRaw, oldRaw, 8)
	if len(chEnd) != 1 || chEnd[0].Offset != 968 || len(chEnd[0].Data) != 56 {
		t.Fatalf("tail key update unexpected: %+v", chEnd)
	}

	// WASD (indices 71, 10, 61, 11) -> 3 full 56-byte packets (A+D share one window)
	copy(newRaw, oldRaw)
	for _, idx := range []int{71, 10, 61, 11} {
		newRaw[idx*8+2] ^= 0xFF
	}
	chWASD := PlanDiffSendChunks(newRaw, oldRaw, 8)
	if len(chWASD) != 3 {
		t.Fatalf("WASD update chunks = %d, want 3", len(chWASD))
	}
	for i, ch := range chWASD {
		if len(ch.Data) != 56 || !bytes.Equal(ch.Data, newRaw[ch.Offset:ch.Offset+56]) {
			t.Fatalf("WASD chunk %d invalid", i)
		}
	}
}

func TestTravelEventJSONIncludesZeroCodes(t *testing.T) {
	// Standard keys have Code1=0; modifiers have Code2=0; key release has Travel=0.
	// None of these may be omitted from SSE JSON or JS tuple matching will fail.
	ev := Event{
		Kind:       "travel",
		KeyType:    16,
		Code1:      0,
		Code2:      26,
		Travel:     0,
		Calibrated: false,
	}
	raw, err := json.Marshal(ev)
	if err != nil {
		t.Fatalf("json.Marshal failed: %v", err)
	}
	s := string(raw)
	for _, want := range []string{`"kind":"travel"`, `"keyType":16`, `"code1":0`, `"code2":26`, `"travel":0`, `"calibrated":false`} {
		if !strings.Contains(s, want) {
			t.Fatalf("marshaled Event %s missing %s", s, want)
		}
	}
}
