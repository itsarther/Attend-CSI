#!/usr/bin/env python3
"""
Attend | CSI - Local Venue Companion Service
----------------------------------------------
Runs on the CSI-CATT committee member's laptop during an event.
Broadcasts short-lived rotating attendance presence tokens over the local Wi-Fi/LAN network.
"""

import time
import socket
import hmac
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import threading

# Companion Defaults
PORT = 8080
ROTATION_INTERVAL = 20
PRESENCE_SEED = "csi_catt_venue_presence_secret_2026"


def get_local_ip():
    """Find local network IP address of host laptop."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip


def generate_venue_token(session_uuid: str = "venue_session_default", timestamp: int = None) -> tuple:
    if timestamp is None:
        timestamp = int(time.time())
    time_counter = timestamp // ROTATION_INTERVAL
    seconds_remaining = ROTATION_INTERVAL - (timestamp % ROTATION_INTERVAL)
    
    key = f"{session_uuid}:{PRESENCE_SEED}:{time_counter}".encode('utf-8')
    raw_hmac = hmac.new(key, msg=f"csi_presence_{time_counter}".encode('utf-8'), digestmod=hashlib.sha256).hexdigest()
    return raw_hmac[:6].upper(), seconds_remaining


class TokenHandler(BaseHTTPRequestHandler):
    session_uuid = "active_event_session"

    def do_GET(self):
        token, remaining = generate_venue_token(self.session_uuid)
        local_ip = get_local_ip()

        if self.path in ["/token", "/token/"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            resp = {
                "status": "active",
                "token": token,
                "remaining_seconds": remaining,
                "rotation_interval": ROTATION_INTERVAL,
                "venue_ip": local_ip,
                "timestamp": int(time.time())
            }
            self.wfile.write(json.dumps(resp).encode('utf-8'))
        elif self.path in ["/health", "/status"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "online", "venue_ip": local_ip}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Silence default HTTP server access logs
        return


def start_companion_server():
    local_ip = get_local_ip()
    print("=" * 65)
    print(" 🚀 ATTEND | CSI - LOCAL VENUE COMPANION SERVICE")
    print("=" * 65)
    print(f" 📍 Venue Local IP Address : http://{local_ip}:{PORT}")
    print(f" 🔑 Token Broadcast Endpoint: http://{local_ip}:{PORT}/token")
    print(f" ⏳ Token Rotation Interval : Every {ROTATION_INTERVAL} Seconds")
    print("=" * 65)
    print("\nPress Ctrl+C to terminate the companion broadcast service.\n")

    server = HTTPServer(('0.0.0.0', PORT), TokenHandler)

    # Monitor thread printing token to terminal
    def monitor_tokens():
        prev_token = None
        while True:
            t, sec = generate_venue_token("active_event_session")
            if t != prev_token:
                print(f"[{time.strftime('%H:%M:%S')}] 🟢 ACTIVE VENUE TOKEN: >>> {t} <<< (Rotates in {sec}s)")
                prev_token = t
            time.sleep(1)

    t = threading.Thread(target=monitor_tokens, daemon=True)
    t.start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Companion Service...")
        server.server_close()


if __name__ == "__main__":
    start_companion_server()
