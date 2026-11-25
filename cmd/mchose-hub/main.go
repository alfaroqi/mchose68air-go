//go:build windows

package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"mchose68air-go/internal/server"
	"mchose68air-go/web"
)

func openAppWindow(url string) {
	candidates := []string{
		filepath.Join(os.Getenv("ProgramFiles(x86)"), `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(os.Getenv("ProgramFiles"), `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(os.Getenv("ProgramFiles"), `Google\Chrome\Application\chrome.exe`),
		filepath.Join(os.Getenv("ProgramFiles(x86)"), `Google\Chrome\Application\chrome.exe`),
	}
	for _, bin := range candidates {
		if bin != "" {
			if _, err := os.Stat(bin); err == nil {
				cmd := exec.Command(bin, "--app="+url, "--window-size=1440,900")
				_ = cmd.Start()
				return
			}
		}
	}
	_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
}

func main() {
	port := flag.Int("port", 18768, "Local port")
	noOpen := flag.Bool("no-open", false, "Do not launch desktop app window automatically")
	flag.Parse()

	addr := fmt.Sprintf("127.0.0.1:%d", *port)
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		ln, err = net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			log.Fatalf("listen failed: %v", err)
		}
	}
	actualURL := "http://" + ln.Addr().String()

	webFS, err := web.FS()
	if err != nil {
		log.Fatalf("load embedded web assets: %v", err)
	}
	app := server.New(webFS, !*noOpen)

	fmt.Println("==========================================================")
	fmt.Println("  MCHOSE Ace 68 / Ace 68 Air — Native Go Offline Driver")
	fmt.Println("  Instant Win32 Raw HID Engine (Zero Cloud, Zero Lag)")
	fmt.Printf("  App URL: %s\n", actualURL)
	fmt.Println("==========================================================")

	if !*noOpen {
		go func() {
			time.Sleep(80 * time.Millisecond)
			openAppWindow(actualURL)
		}()
	}

	if err := http.Serve(ln, app.Handler()); err != nil {
		log.Fatal(err)
	}
}
