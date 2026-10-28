"""
Flask Application Entry Point for Rosa-sinensis Leaf Health Diagnostic System
"""
import os
import sys

# Ensure current directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from app import app, HAS_LEAFVEIN_REWORK

if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    port = int(os.environ.get("PORT", 5000))
    print("\n" + "=" * 70)
    print("🌿 Rosa-sinensis Leaf Health Diagnostic - Flask Server")
    print(f"[*] Frontend & Backend connected via Flask")
    print(f"[*] Web App URL:      http://localhost:{port}")
    print(f"[*] Backend Status:   http://localhost:{port}/api/status")
    print(f"[*] leafvein_rework:  {'CONNECTED (active)' if HAS_LEAFVEIN_REWORK else 'FALLBACK (local)'}")
    print("=" * 70 + "\n")
    app.run(host="0.0.0.0", port=port, debug=False)
