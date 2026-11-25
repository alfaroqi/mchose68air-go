//go:build windows

package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func TestAPITriggersJSONDecode(t *testing.T) {
	body := `{"profile":0,"updates":{"71":{"switchType":0,"keyMode":1,"priority":0,"keyActuation":40,"pressPrecision":0,"releasePrecision":0,"rtPress":10,"rtRelease":15,"pressDeadzone":5,"releaseDeadzone":5}}}`
	var req triggerUpdateRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		t.Fatalf("unmarshal failed: %v", err)
	}
	trig, ok := req.Updates[71]
	if !ok || trig.KeyActuation != 40 || trig.RtPress != 10 || trig.RtRelease != 15 {
		t.Fatalf("unexpected decoded trigger map: %+v", req.Updates)
	}
}

func TestPingAndStaticAssetRouting(t *testing.T) {
	memFS := fstest.MapFS{
		"index.html": {Data: []byte("<h1>MCHOSE Hub</h1>")},
	}
	srv := New(memFS, false)
	h := srv.Handler()

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/ping", nil))
	if rec.Code != 200 {
		t.Fatalf("/api/ping status = %d, want 200", rec.Code)
	}

	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec2.Code != 200 {
		t.Fatalf("/ status = %d, want 200", rec2.Code)
	}
}
