package hid

// SendChunk represents a single HID write chunk (offset relative to baseOffset + payload bytes).
type SendChunk struct {
	Offset int
	Data   []byte
}

// BuildCizhouFrame builds a 64-byte Cizhou GLW HID packet:
// [0]=0x55, [1]=cmd, [2]=0x00, [3]=sum(4..63)&0xFF, [4]=size, [5]=lo, [6]=hi, [7]=0x00, [8..]=payload
func BuildCizhouFrame(cmd byte, offset uint16, size byte, payload []byte) [64]byte {
	var p [64]byte
	p[0] = 0x55
	p[1] = cmd
	p[2] = 0x00
	p[4] = size
	p[5] = byte(offset & 0xFF)
	p[6] = byte((offset >> 8) & 0xFF)
	p[7] = 0x00
	if len(payload) > 0 {
		copy(p[8:], payload)
	}
	var sum uint32
	for i := 4; i < 64; i++ {
		sum += uint32(p[i])
	}
	p[3] = byte(sum & 0xFF)
	return p
}

// PlanFullSendChunks mirrors Cizhou's _simpleFullSendCommand:
// aligns chunks to structSize (<=56 bytes) and shifts any trailing partial chunk backward
// so the firmware never receives an under-sized tail packet.
func PlanFullSendChunks(data []byte, structSize int) []SendChunk {
	if len(data) == 0 {
		return nil
	}
	if structSize <= 0 {
		structSize = 1
	}
	step := (56 / structSize) * structSize
	if step <= 0 || step > 56 {
		step = 56
	}
	if len(data) <= step {
		cp := make([]byte, len(data))
		copy(cp, data)
		return []SendChunk{{Offset: 0, Data: cp}}
	}

	var chunks []SendChunk
	for off := 0; off < len(data); off += step {
		actualOff := off
		end := off + step
		if end > len(data) {
			actualOff = len(data) - step
			end = len(data)
		}
		cp := make([]byte, end-actualOff)
		copy(cp, data[actualOff:end])
		chunks = append(chunks, SendChunk{Offset: actualOff, Data: cp})
	}
	return chunks
}

// PlanDiffSendChunks mirrors Cizhou's _simpleUpdateSendCommand:
// diffs newData vs oldData in structSize-aligned units and emits full 56-byte packets
// covering only modified regions (falling back to PlanFullSendChunks if >= full count).
func PlanDiffSendChunks(newData, oldData []byte, structSize int) []SendChunk {
	if len(oldData) != len(newData) || len(newData) == 0 {
		return PlanFullSendChunks(newData, structSize)
	}
	if structSize <= 0 {
		structSize = 1
	}
	const maxPkt = 56
	if len(newData) <= maxPkt {
		same := true
		for i := range newData {
			if newData[i] != oldData[i] {
				same = false
				break
			}
		}
		if same {
			return nil
		}
		return PlanFullSendChunks(newData, structSize)
	}

	coveredUnits := make(map[int]bool)
	seenOffsets := make(map[int]bool)
	var chunks []SendChunk

	for i := 0; i < len(newData); i++ {
		if newData[i] == oldData[i] {
			continue
		}
		unit := i / structSize
		if coveredUnits[unit] {
			continue
		}
		start := unit * structSize
		end := start + structSize
		for end-start < maxPkt && end+structSize <= len(newData) {
			end += structSize
		}
		if end > len(newData) {
			end = len(newData)
		}
		for end-start < maxPkt && start-structSize >= 0 {
			start -= structSize
		}
		if start < 0 {
			start = 0
		}
		for off := start; off < end; off += maxPkt {
			curOff := off
			if curOff+maxPkt > end {
				curOff = end - maxPkt
				if curOff < start {
					curOff = start
				}
			}
			curEnd := curOff + maxPkt
			if curEnd > end {
				curEnd = end
			}
			if !seenOffsets[curOff] {
				seenOffsets[curOff] = true
				pkt := make([]byte, maxPkt)
				copy(pkt, newData[curOff:curEnd])
				chunks = append(chunks, SendChunk{Offset: curOff, Data: pkt})
			}
		}
		for uOff := (start / structSize) * structSize; uOff < end; uOff += structSize {
			coveredUnits[uOff/structSize] = true
		}
	}

	fullCount := (len(newData) + maxPkt - 1) / maxPkt
	if len(chunks) >= fullCount {
		return PlanFullSendChunks(newData, structSize)
	}
	return chunks
}
