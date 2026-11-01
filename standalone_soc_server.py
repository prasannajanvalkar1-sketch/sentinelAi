"""
SentinelAI - Standalone Cyber Defense Training Hub & Telemetry API Server
========================================================================
Zero-dependency Python server (uses built-in standard library).
Listens on 0.0.0.0:8000 to receive real-time training events, security alerts 
(USB insertion, Screenshot detection), and remote admin quarantine/block commands.

Key Endpoints:
- POST /api/telemetry/ingest/ : Ingests live trainee progress & security violations from friend
- POST /api/telemetry/block/  : Admin command to block/unblock a trainee
- GET  /api/telemetry/feed/   : Streams live trainees, security alerts, & KPIs to Dashboard

Usage:
  python standalone_soc_server.py
"""

import os
import sys
import json
import random
import datetime
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

# Safe UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except Exception:
        try:
            cleaned = [str(a).encode('ascii', 'ignore').decode('ascii') for a in args]
            print(*cleaned, **kwargs)
        except Exception:
            pass

PORT = int(os.environ.get('PORT', 8000))
API_KEY = os.environ.get('SENTINEL_API_KEY', "sk_sentinel_live_938aB")

# Real Live Trainees (Populated by incoming telemetry & updated by admin actions)
TRAINEES = []

# Real Live Event Feed (Includes simulation activity, USB/Screenshot alerts & admin blocks)
TELEMETRY_FEED = []

def compute_metrics():
    total = len(TRAINEES)
    completed = len([t for t in TRAINEES if t.get("status") in ["CERTIFIED", "COMPLETED"] or t.get("currentModule") == 20])
    failed = len([t for t in TRAINEES if t.get("status") == "FAILED"])
    stuck = len([t for t in TRAINEES if str(t.get("status", "")).startswith("STUCK")])
    blocked = len([t for t in TRAINEES if t.get("status") == "BLOCKED" or t.get("isBlocked")])
    in_prog = total - (completed + failed + stuck + blocked)
    avg_score = round(sum(t.get("avgScore", 0) for t in TRAINEES if t.get("status") != "BLOCKED") / max(1, total - blocked), 1) if (total - blocked) > 0 else 0.0
    alerts_count = len([e for e in TELEMETRY_FEED if e.get("alert_type") in ["USB_DETECTED", "SCREENSHOT_DETECTED", "SECURITY_ALERT"]])

    return {
        "traineesToday": total,
        "avgScoreToday": avg_score,
        "completedToday": completed,
        "failedToday": failed,
        "stuckToday": stuck,
        "blockedToday": blocked,
        "alertsToday": alerts_count,
        "inProgressToday": max(0, in_prog),
        "passRate": f"{round((completed / total) * 100, 1)}%" if total > 0 else "0%",
        "totalModules": 20
    }

# SQLite Persistence
def init_db():
    conn = sqlite3.connect("telemetry.db")
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS training_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT UNIQUE,
            user_id TEXT,
            student_name TEXT,
            module_number INTEGER,
            video_watched INTEGER,
            quiz_score REAL,
            status TEXT,
            stuck_reason TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


class SOCAPIRequestHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Sentinel-API-Key, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/telemetry/feed') or self.path.startswith('/api/training/feed'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()

            payload = {
                "status": "success",
                "data": {
                    "incidents": TELEMETRY_FEED,
                    "trainees": TRAINEES,
                    "trainingMetrics": compute_metrics()
                }
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
        elif self.path == '/' or self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"status": "online", "service": "Sentinel SOC Server", "metrics": compute_metrics()}).encode('utf-8'))
        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Not Found"}')

    def do_POST(self):
        global TELEMETRY_FEED, TRAINEES

        # 1. Admin Block / Unblock Trainee Endpoint
        if self.path.startswith('/api/telemetry/block'):
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body)
            except Exception:
                data = {}

            username = str(data.get('username') or data.get('name') or '').strip()
            action = str(data.get('action', 'BLOCK')).upper()
            reason = str(data.get('reason') or 'Security Policy Violation (USB / Screenshot Detected)').strip()

            target_trainee = None
            for t in TRAINEES:
                if t['name'].lower() == username.lower() or t['email'].lower() == username.lower():
                    target_trainee = t
                    if action == 'BLOCK':
                        t['status'] = 'BLOCKED'
                        t['isBlocked'] = True
                        t['stuckReason'] = f"BLOCKED BY ADMIN: {reason}"
                    else:
                        t['status'] = 'IN_PROGRESS'
                        t['isBlocked'] = False
                        t['stuckReason'] = None
                    break

            if not target_trainee and action == 'BLOCK' and username:
                # User not in list yet, create a blocked entry so future logins are rejected
                target_trainee = {
                    "id": f"LRN-2026-{random.randint(100, 999)}",
                    "name": username,
                    "email": f"{username.lower().replace(' ', '')}@platform.live" if '@' not in username else username,
                    "currentModule": 1,
                    "totalModules": 20,
                    "videoWatched": False,
                    "avgScore": 0.0,
                    "status": "BLOCKED",
                    "isBlocked": True,
                    "stuckReason": f"BLOCKED BY ADMIN: {reason}",
                    "lastActive": "Just now"
                }
                TRAINEES.insert(0, target_trainee)

            timestamp_str = datetime.datetime.now().strftime("%I:%M:%S %p")
            event_id = f"SEC-{datetime.datetime.now().year}-{random.randint(1000, 9999)}"
            sec_event = {
                "id": event_id,
                "timestamp": timestamp_str,
                "severity": "CRITICAL" if action == 'BLOCK' else "LOW",
                "vector": f"🚨 Admin Command: {action} Trainee '{username}'",
                "target": f"{username} ({action}ED)",
                "sourceIp": "Admin SOC Command Console",
                "action": f"User {action}ed",
                "alert_type": "USER_BLOCKED" if action == 'BLOCK' else "USER_UNBLOCKED",
                "username": username,
                "details": reason
            }
            TELEMETRY_FEED.insert(0, sec_event)
            safe_print(f"[{timestamp_str}] [ADMIN {action}] User '{username}' was {action}ed. Reason: {reason}")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "action": action,
                "username": username,
                "trainee": target_trainee,
                "message": f"User '{username}' is now {action}ED"
            }).encode('utf-8'))
            return

        # 2. Main Telemetry Ingestion Endpoint
        if self.path.startswith('/api/telemetry/ingest') or self.path.startswith('/api/training/ingest'):
            # Validate API Key
            auth_key = self.headers.get('X-Sentinel-API-Key')
            if not auth_key or auth_key != API_KEY:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Unauthorized. Missing or invalid X-Sentinel-API-Key."}).encode('utf-8'))
                return

            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                self.send_response(400)
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid JSON format"}).encode('utf-8'))
                return

            # If running locally, mirror telemetry to Render Cloud so Vercel gets it in real time
            if not os.environ.get('RENDER'):
                def _mirror_to_render():
                    try:
                        import urllib.request
                        cloud_req = urllib.request.Request(
                            "https://sentinelai-backend-33dw.onrender.com/api/telemetry/ingest/",
                            data=body.encode('utf-8'),
                            headers={
                                "Content-Type": "application/json",
                                "X-Sentinel-API-Key": API_KEY
                            }
                        )
                        urllib.request.urlopen(cloud_req, timeout=4)
                    except Exception:
                        pass
                import threading
                threading.Thread(target=_mirror_to_render, daemon=True).start()

            event_id = f"TRN-{datetime.datetime.now().year}-{random.randint(1000, 9999)}"
            timestamp_str = datetime.datetime.now().strftime("%I:%M:%S %p")

            # Extract EXACT student name sent from friend's software
            raw_name = data.get('student_name') or data.get('username') or data.get('user') or data.get('name') or data.get('user_id') or 'Trainee'
            student_name = str(raw_name).strip()
            
            raw_email = data.get('email')
            if raw_email:
                student_email = str(raw_email).strip()
            else:
                student_email = f"{student_name.lower().replace(' ', '')}@platform.live" if '@' not in student_name else student_name

            # Check if trainee is already BLOCKED by Admin
            existing = next((t for t in TRAINEES if t['name'].lower() == student_name.lower() or t['email'].lower() == student_email.lower()), None)
            if existing and (existing.get('status') == 'BLOCKED' or existing.get('isBlocked')):
                safe_print(f"[{timestamp_str}] [BLOCKED REJECTION] Trainee '{student_name}' is BLOCKED. Denying access.")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "blocked",
                    "is_blocked": True,
                    "student_name": student_name,
                    "trainee_status": "BLOCKED",
                    "message": f"ACCESS DENIED: User '{student_name}' is BLOCKED by Administrator."
                }).encode('utf-8'))
                return

            module_num = int(data.get('module_number') or data.get('module') or 1)
            video_watched = bool(data.get('video_watched', True))
            quiz_score = float(data.get('quiz_score') or data.get('score') or data.get('quiz') or data.get('marks') or 0.0)
            status_val = data.get('status')
            raw_event = str(data.get('event') or data.get('event_type') or '').upper()
            action_text = str(data.get('action') or data.get('defense_action') or data.get('details') or '')

            # Extract percentage from action text if quiz_score not explicitly given
            if quiz_score == 0.0:
                import re
                score_match = re.search(r'(\d+(?:\.\d+)?)%', action_text)
                if score_match:
                    try:
                        quiz_score = float(score_match.group(1))
                    except Exception:
                        pass

            # Detect Security Alerts: USB Inserted, Screenshot Captured, etc.
            is_usb = 'usb' in action_text.lower() or 'usb' in str(data.get('alert_type', '')).lower() or 'usb' in str(data.get('details', '')).lower()
            is_screenshot = 'screenshot' in action_text.lower() or 'screen' in action_text.lower() or 'screenshot' in str(data.get('alert_type', '')).lower() or 'screenshot' in str(data.get('details', '')).lower()
            is_security_alert = is_usb or is_screenshot or raw_event in ['SECURITY_ALERT', 'ALERT', 'USB', 'SCREENSHOT']

            is_quiz = 'quiz' in action_text.lower() or 'quiz' in raw_event.lower() or ('score' in action_text.lower() and not is_security_alert)
            is_video = ('video' in action_text.lower() or 'watched' in action_text.lower() or 'incomplete' in action_text.lower()) and not is_security_alert
            is_login_event = ('login' in action_text.lower() or 'logged in' in action_text.lower()) and not (is_quiz or is_video or is_security_alert)

            alert_type = None
            if is_security_alert:
                if is_usb:
                    alert_type = "USB_DETECTED"
                    severity = "CRITICAL"
                    event_vector = f"🚨 USB Hardware Storage Detected: {student_name}"
                    event_action = action_text or "Unauthorized USB Plugged In"
                elif is_screenshot:
                    alert_type = "SCREENSHOT_DETECTED"
                    severity = "HIGH"
                    event_vector = f"📸 Screenshot / Screen Capture Detected: {student_name}"
                    event_action = action_text or "PrintScreen Capture Triggered"
                else:
                    alert_type = data.get('alert_type', 'SECURITY_ALERT')
                    severity = "HIGH"
                    event_vector = f"⚠️ Security Alert: {action_text or 'Policy Violation'} ({student_name})"
                    event_action = action_text or "Security Violation Dispatched"
                
                if not status_val:
                    status_val = existing.get('status', 'IN_PROGRESS') if existing else 'IN_PROGRESS'
            elif is_quiz:
                if quiz_score >= 60.0:
                    status_val = "COMPLETED" if module_num >= 20 else "IN_PROGRESS"
                    severity = "LOW"
                    event_vector = f"Module {module_num} Quiz Passed: {quiz_score}% (Score >= 60%)"
                    event_action = action_text or f"Passed Quiz ({quiz_score}%)"
                else:
                    status_val = "FAILED"
                    severity = "HIGH"
                    event_vector = f"Module {module_num} Quiz Failed: {quiz_score}% (< 60% Passing Mark)"
                    event_action = action_text or f"Quiz Failed ({quiz_score}%)"
            elif is_video:
                if 'incomplete' in action_text.lower() or 'stuck' in action_text.lower() or not video_watched:
                    status_val = "STUCK_VIDEO"
                    video_watched = False
                    severity = "MEDIUM"
                    event_vector = f"Module {module_num} Video Incomplete (Gate Locked)"
                    event_action = action_text or "Video Incomplete"
                else:
                    status_val = "IN_PROGRESS"
                    video_watched = True
                    severity = "LOW"
                    event_vector = f"Module {module_num} Video 100% Watched (Gate Cleared)"
                    event_action = action_text or "Video Completed 100%"
            elif is_login_event:
                if not status_val:
                    status_val = "IN_PROGRESS"
                event_vector = f"User Login Authentication: {student_name}"
                event_action = action_text or "Session Granted"
                severity = "LOW"
            else:
                # Fallback handler
                if not status_val:
                    status_val = "IN_PROGRESS"
                severity = "LOW"
                event_vector = action_text or f"Training Activity: {student_name}"
                event_action = action_text or "Recorded"

            stuck_reason = data.get('stuck_reason')
            if not stuck_reason:
                if status_val == "STUCK_VIDEO":
                    stuck_reason = f"Video incomplete on Module {module_num}. Next module locked."
                elif status_val == "FAILED":
                    stuck_reason = f"Failed Module {module_num} Quiz (Score: {quiz_score}% < 60%)"

            # Check if trainee already exists in real list
            if existing:
                if not is_security_alert:
                    existing['currentModule'] = max(existing['currentModule'], module_num)
                    existing['videoWatched'] = video_watched
                    if quiz_score > 0:
                        existing['avgScore'] = round((existing['avgScore'] + quiz_score) / 2.0, 1) if existing['avgScore'] > 0 else quiz_score
                    existing['status'] = status_val
                    existing['stuckReason'] = stuck_reason
                existing['lastActive'] = "Just now"
            else:
                existing = {
                    "id": f"LRN-2026-{random.randint(100, 999)}",
                    "name": student_name,
                    "email": student_email,
                    "currentModule": module_num,
                    "totalModules": 20,
                    "videoWatched": video_watched,
                    "avgScore": round(quiz_score, 1),
                    "status": status_val,
                    "isBlocked": False,
                    "stuckReason": stuck_reason,
                    "lastActive": "Just now"
                }
                TRAINEES.insert(0, existing)

            event_target = data.get('target') or f"{student_name} ({status_val})"

            event = {
                "id": event_id,
                "timestamp": timestamp_str,
                "severity": severity,
                "vector": event_vector,
                "target": event_target,
                "sourceIp": data.get("source_ip", "Friend Software Client"),
                "action": event_action,
                "alert_type": alert_type,
                "username": student_name,
                "details": data.get('details', '')
            }

            TELEMETRY_FEED.insert(0, event)
            TELEMETRY_FEED = TELEMETRY_FEED[:100]

            # Save real event to SQLite
            try:
                conn = sqlite3.connect("telemetry.db")
                c = conn.cursor()
                c.execute('''
                    INSERT INTO training_logs 
                    (event_id, user_id, student_name, module_number, video_watched, quiz_score, status, stuck_reason)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (event_id, student_email, student_name, module_num, 1 if video_watched else 0, quiz_score, status_val, stuck_reason))
                conn.commit()
                conn.close()
            except Exception as e:
                pass

            safe_print(f"[{timestamp_str}] [LIVE INGEST] Name: '{student_name}' | Event: {event_vector} | Status: {status_val}")

            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "message": f"Real event for '{student_name}' recorded & live dashboard updated",
                "event_id": event_id,
                "student_name": student_name,
                "trainee_status": status_val,
                "is_blocked": False
            }).encode('utf-8'))
        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(b'{"error": "Endpoint Not Found"}')

    def log_message(self, format, *args):
        if args and "GET /api/telemetry/feed" not in str(args[0]):
            super().log_message(format, *args)


def run_server():
    server_address = ('0.0.0.0', PORT)
    httpd = ThreadedHTTPServer(server_address, SOCAPIRequestHandler)
    print("=" * 65)
    print("  SENTINEL CYBER TRAINING & SIMULATION HUB SERVER (100% LIVE DATA)")
    print("=" * 65)
    print(f"  Server listening on: http://0.0.0.0:{PORT}")
    print(f"  Dashboard Live Feed: http://localhost:{PORT}/api/telemetry/feed/")
    print(f"  Friend Ingest URL:   http://<YOUR_IP>:{PORT}/api/telemetry/ingest/")
    print(f"  Admin Block URL:     http://localhost:{PORT}/api/telemetry/block/")
    print(f"  Auth Header:         X-Sentinel-API-Key: {API_KEY}")
    print("=" * 65)
    print("  Waiting for real login, module activity & security alerts...\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        httpd.server_close()


if __name__ == '__main__':
    run_server()
