"""
Root Launcher for Rosa-sinensis Leaf Health Diagnostic System
=============================================================
Runs FastAPI on http://localhost:5000 and automatically opens the web browser.
Serves the React SPA frontend directly at http://localhost:5000.
"""

import os
import sys
import time
import subprocess
import threading
import webbrowser
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


def free_port_if_in_use(port: int):
    """If port is occupied by a stale process, terminate it to prevent Errno 10048."""
    try:
        current_pid = os.getpid()
        output = subprocess.check_output("netstat -ano", shell=True, text=True, stderr=subprocess.DEVNULL)
        for line in output.splitlines():
            if f":{port} " in line and "LISTENING" in line:
                parts = line.strip().split()
                if len(parts) >= 5:
                    pid = int(parts[-1])
                    if pid != current_pid and pid > 0:
                        print(f"[*] Freeing occupied port {port} (PID: {pid})...")
                        subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
                        time.sleep(0.6)
    except Exception:
        pass


def open_browser(port: int):
    try:
        webbrowser.open_new(f"http://localhost:{port}")
    except Exception:
        pass


if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    port = int(os.environ.get("PORT", 5000))
    free_port_if_in_use(port)

    has_frontend = os.path.isfile(os.path.join(FRONTEND_DIST, "index.html"))

    print("\n" + "=" * 70)
    print("🌿 Rosa-sinensis Leaf Health Diagnostic System (Clean Architecture)")
    print("=" * 70)
    print(f"[*] Frontend Engine : {'React SPA (Vite + Tailwind CSS)' if has_frontend else 'Standalone API'}")
    print(f"[*] Web App URL     : http://localhost:{port}")
    print(f"[*] Swagger API Docs: http://localhost:{port}/docs")
    print(f"[*] Health Check    : http://localhost:{port}/api/status")
    print(f"[*] Pipeline Engine : 12-Stage Vascular Computer Vision & Severity Engine")
    print("=" * 70 + "\n")

    # Automatically launch browser after 1.2 seconds
    threading.Timer(1.2, open_browser, args=(port,)).start()

    # Start FastAPI server
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=False)
