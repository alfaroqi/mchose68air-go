//go:build windows

package server

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"mchose68air-go/internal/hid"
	"mchose68air-go/internal/protocol"
)

// AppServer serves the embedded frontend and exposes the local HID REST/SSE API.
type AppServer struct {
	mu        sync.Mutex
	client    *protocol.Client
	quitTimer *time.Timer
	allowQuit bool
	webFS     fs.FS
}

func New(webFS fs.FS, allowQuit bool) *AppServer {
	return &AppServer{
		webFS:     webFS,
		allowQuit: allowQuit,
	}
}

func (s *AppServer) ensureConnected() (*protocol.Client, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.client != nil {
		return s.client, nil
	}
	conn, err := hid.Open()
	if err != nil {
		return nil, err
	}
	s.client = protocol.NewClient(conn)
	return s.client, nil
}

func (s *AppServer) resetConn() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.client != nil {
		s.client.Close()
		s.client = nil
	}
}

func (s *AppServer) connectToPath(targetPath string) (*protocol.Client, error) {
	s.resetConn()
	s.mu.Lock()
	defer s.mu.Unlock()
	conn, err := hid.OpenByPath(targetPath)
	if err != nil {
		return nil, err
	}
	s.client = protocol.NewClient(conn)
	return s.client, nil
}

func (s *AppServer) connectedPath() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.client == nil || s.client.Conn == nil {
		return ""
	}
	return s.client.Conn.Info.Path
}

func (s *AppServer) cancelPendingQuit() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.quitTimer != nil {
		s.quitTimer.Stop()
		s.quitTimer = nil
	}
}

func (s *AppServer) scheduleQuit() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.allowQuit {
		return
	}
	if s.quitTimer != nil {
		s.quitTimer.Stop()
	}
	// Delay exit by 2.5s so F5 / page reload cancels shutdown cleanly.
	s.quitTimer = time.AfterFunc(2500*time.Millisecond, func() {
		s.resetConn()
		os.Exit(0)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]any{"ok": false, "error": err.Error()})
}

// Handler builds the HTTP router for all REST endpoints, SSE telemetry, and static assets.
func (s *AppServer) Handler() http.Handler {
	mux := http.NewServeMux()
	fileServer := http.FileServer(http.FS(s.webFS))

	mux.HandleFunc("/api/status", s.handleStatus)
	mux.HandleFunc("/api/connect", s.handleConnect)
	mux.HandleFunc("/api/disconnect", s.handleDisconnect)
	mux.HandleFunc("/api/state", s.handleState)
	mux.HandleFunc("/api/events", s.handleEvents)
	mux.HandleFunc("/api/profile", s.handleProfile)
	mux.HandleFunc("/api/profile-names", s.handleProfileNames)
	mux.HandleFunc("/api/triggers", s.handleTriggers)
	mux.HandleFunc("/api/lighting", s.handleLighting)
	mux.HandleFunc("/api/custom-colors", s.handleCustomColors)
	mux.HandleFunc("/api/performance", s.handlePerformance)
	mux.HandleFunc("/api/debug-mode", s.handleDebugMode)
	mux.HandleFunc("/api/remap", s.handleRemap)
	mux.HandleFunc("/api/advanced", s.handleAdvanced)
	mux.HandleFunc("/api/calibrate", s.handleCalibrate)
	mux.HandleFunc("/api/reset", s.handleReset)
	mux.HandleFunc("/api/ping", s.handlePing)
	mux.HandleFunc("/api/quit", s.handleQuit)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		s.cancelPendingQuit()
		fileServer.ServeHTTP(w, r)
	})
	return mux
}

func (s *AppServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	devs, _ := hid.EnumerateMchoseDevices()
	writeJSON(w, 200, map[string]any{
		"ok":            true,
		"connectedPath": s.connectedPath(),
		"devices":       devs,
	})
}

func (s *AppServer) handleConnect(w http.ResponseWriter, r *http.Request) {
	s.cancelPendingQuit()
	targetPath := r.URL.Query().Get("path")
	if targetPath == "" && r.Method == http.MethodPost {
		var req struct {
			Path string `json:"path"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		targetPath = req.Path
	}
	c, err := s.connectToPath(targetPath)
	if err != nil {
		writeJSON(w, 200, map[string]any{"ok": false, "connected": false, "error": err.Error()})
		return
	}
	state, err := c.ReadFullState(-1, 0)
	if err != nil {
		s.resetConn()
		writeJSON(w, 200, map[string]any{"ok": false, "connected": false, "error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "state": state})
}

func (s *AppServer) handleDisconnect(w http.ResponseWriter, r *http.Request) {
	s.resetConn()
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handleState(w http.ResponseWriter, r *http.Request) {
	prof, _ := strconv.Atoi(r.URL.Query().Get("profile"))
	if r.URL.Query().Get("profile") == "" {
		prof = -1
	}
	layer, _ := strconv.Atoi(r.URL.Query().Get("layer"))

	c, err := s.ensureConnected()
	if err != nil {
		writeJSON(w, 200, map[string]any{"ok": false, "connected": false, "error": err.Error()})
		return
	}
	st, err := c.ReadFullState(prof, layer)
	if err != nil {
		s.resetConn()
		writeJSON(w, 200, map[string]any{"ok": false, "connected": false, "error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "state": st})
}

func (s *AppServer) handleEvents(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	flusher.Flush()

	ch, unsub := c.Conn.Subscribe()
	defer unsub()

	ctx := r.Context()
	keepalive := time.NewTicker(15 * time.Second)
	defer keepalive.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-c.Conn.Done():
			return
		case ev := <-ch:
			b, _ := json.Marshal(ev)
			fmt.Fprintf(w, "data: %s\n\n", b)
			flusher.Flush()
		case <-keepalive.C:
			fmt.Fprintf(w, ": ping\n\n")
			flusher.Flush()
		}
	}
}

func (s *AppServer) handleProfile(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Profile int `json:"profile"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.SwitchProfile(req.Profile); err != nil {
		s.resetConn()
		writeErr(w, 500, err)
		return
	}
	st, err := c.ReadFullState(req.Profile, 0)
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "state": st})
}

func (s *AppServer) handleProfileNames(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Names []string `json:"names"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.WriteProfileNames(req.Names); err != nil {
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

type triggerUpdateRequest struct {
	Profile int                         `json:"profile"`
	Updates map[int]protocol.KeyTrigger `json:"updates"`
}

func (s *AppServer) handleTriggers(w http.ResponseWriter, r *http.Request) {
	var req triggerUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	t0 := time.Now()
	if err := c.WriteKeyTriggerUpdates(req.Profile, req.Updates); err != nil {
		s.resetConn()
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "ms": time.Since(t0).Milliseconds()})
}

func (s *AppServer) handleLighting(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Profile  int                  `json:"profile"`
		Lighting protocol.LightConfig `json:"lighting"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.WriteLighting(req.Profile, req.Lighting); err != nil {
		s.resetConn()
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handleCustomColors(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Profile int            `json:"profile"`
		Updates map[int]string `json:"updates"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.WriteCustomKeyColors(req.Profile, req.Updates); err != nil {
		s.resetConn()
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handlePerformance(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Profile     int                        `json:"profile"`
		UpdateRate  bool                       `json:"updateRate"`
		Performance protocol.PerformanceConfig `json:"performance"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.WritePerformance(req.Profile, req.Performance, req.UpdateRate); err != nil {
		s.resetConn()
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handleDebugMode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Profile int  `json:"profile"`
		Enabled bool `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.SetDebugMode(req.Profile, req.Enabled); err != nil {
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handleRemap(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Profile  int  `json:"profile"`
		Layer    int  `json:"layer"`
		KeyIndex int  `json:"keyIndex"`
		Type     byte `json:"type"`
		Code1    byte `json:"code1"`
		Code2    byte `json:"code2"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.WriteKeyRemap(req.Profile, req.Layer, req.KeyIndex, req.Type, req.Code1, req.Code2); err != nil {
		s.resetConn()
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handleAdvanced(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Profile  int                         `json:"profile"`
		Layer    int                         `json:"layer"`
		Dks      []protocol.DksSlot          `json:"dks"`
		Mt       []protocol.MtSlot           `json:"mt"`
		Tgl      []protocol.KeyTuple         `json:"tgl"`
		KeyMaps  []protocol.KeyMapEntry      `json:"keyMaps"`
		Triggers map[int]protocol.KeyTrigger `json:"triggers"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err)
		return
	}
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.WriteAdvancedKeys(req.Profile, req.Dks, req.Mt, req.Tgl); err != nil {
		s.resetConn()
		writeErr(w, 500, err)
		return
	}
	for _, km := range req.KeyMaps {
		if err := c.WriteKeyRemap(req.Profile, req.Layer, km.Index, km.Type, km.Code1, km.Code2); err != nil {
			s.resetConn()
			writeErr(w, 500, err)
			return
		}
	}
	if len(req.Triggers) > 0 {
		if err := c.WriteKeyTriggerUpdates(req.Profile, req.Triggers); err != nil {
			s.resetConn()
			writeErr(w, 500, err)
			return
		}
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handleCalibrate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Profile int    `json:"profile"`
		Action  string `json:"action"` // "start" | "end" | "restart"
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	switch req.Action {
	case "start":
		err = c.StartCalibration(req.Profile)
	case "restart":
		err = c.RestartCalibration()
	default:
		err = c.EndCalibration(req.Profile)
	}
	if err != nil {
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handleReset(w http.ResponseWriter, r *http.Request) {
	c, err := s.ensureConnected()
	if err != nil {
		writeErr(w, 503, err)
		return
	}
	if err := c.FactoryReset(); err != nil {
		writeErr(w, 500, err)
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handlePing(w http.ResponseWriter, r *http.Request) {
	s.cancelPendingQuit()
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *AppServer) handleQuit(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{"ok": true})
	s.scheduleQuit()
}
