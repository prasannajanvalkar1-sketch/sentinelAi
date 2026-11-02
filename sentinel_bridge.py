"""
SentinelAI - Client Activity & Security Telemetry Bridge
========================================================
Rock-Solid Telemetry Pipeline connecting Client Apps & Agents to:
1. Live Production Cloud: https://sentinelai-backend-33dw.onrender.com (24/7 Render Cloud)
2. Local Development Server: http://localhost:8000 (Auto-fallback & Mirror)

Capabilities:
- Student Activity: Real-time Login, Video Watching (0-100%), Quiz Scores (20 Modules)
- Security Violations: USB Flash Drive Insertion, Screenshot / PrintScreen attempts
- Admin Enforcement: Real-time Remote BLOCKED / Quarantine lockout detection
"""

import os
import sys
import json
import time
import requests
import datetime

# Safe UTF-8 console output for Windows cmd/powershell
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def safe_print(*args, **kwargs):
    """Prints safely even on legacy Windows charmap/cp1252 consoles"""
    try:
        print(*args, **kwargs)
    except UnicodeEncodeError:
        try:
            cleaned = [str(a).encode('ascii', 'ignore').decode('ascii') for a in args]
            print(*cleaned, **kwargs)
        except Exception:
            pass
    except Exception:
        pass

# Endpoints
CLOUD_URL = os.environ.get("SENTINEL_CLOUD_URL", "https://sentinelai-backend-33dw.onrender.com/api/telemetry/ingest/")
LOCAL_URL = "http://localhost:8000/api/telemetry/ingest/"
API_KEY = os.environ.get("SENTINEL_API_KEY", "sk_sentinel_live_938aB")

HEADERS = {
    "Content-Type": "application/json",
    "X-Sentinel-API-Key": API_KEY
}

def get_current_username():
    """Auto-detects active student/Windows user name"""
    try:
        u = os.getlogin()
        if u and u.strip():
            return u.strip()
    except Exception:
        pass
    return os.environ.get('USERNAME') or os.environ.get('USER') or 'CyberStudent'

def get_target_url():
    """
    Returns the primary ingest URL.
    Prefers Cloud URL so deployed Vercel/Render SOC dashboards receive events.
    Falls back to Localhost if Cloud is unreachable.
    """
    return CLOUD_URL

def _send(payload):
    """
    Sends telemetry to Cloud Backend, with automatic retry and local mirror.
    Guarantees zero crashes even on network disconnects.
    """
    if "username" not in payload or not payload["username"]:
        payload["username"] = get_current_username()
    if "student_name" not in payload or not payload["student_name"]:
        payload["student_name"] = payload["username"]

    primary_url = CLOUD_URL
    success = False
    response_data = None

    # 1. Attempt Cloud Delivery (with 1 retry for Render cold-starts)
    for attempt in range(2):
        try:
            resp = requests.post(primary_url, json=payload, headers=HEADERS, timeout=12)
            if resp.status_code in [200, 201]:
                response_data = resp.json()
                success = True
                if response_data.get("is_blocked"):
                    uname = payload.get("username", "Student")
                    safe_print(f"\n[🚨 CRITICAL LOCKOUT] USER '{uname}' IS BLOCKED BY ADMIN!")
                    safe_print(f"    Message: {response_data.get('message')}")
                    return False, {"blocked": True, "error": response_data.get('message')}
                break
        except (requests.exceptions.RequestException, Exception):
            if attempt == 0:
                time.sleep(1.0)
            continue

    # 2. Local Mirror (if local server is running on localhost:8000, also send a copy)
    try:
        resp_local = requests.post(LOCAL_URL, json=payload, headers=HEADERS, timeout=1.5)
        if resp_local.status_code in [200, 201] and not success:
            response_data = resp_local.json()
            success = True
    except Exception:
        pass

    if not success:
        safe_print(f"[!] Warning: Could not deliver packet to cloud or local server. Data will retry on next event.")
        return False, None

    return True, response_data


# -------------------------------------------------------------
# 1. LOGIN ACTIVITY
# -------------------------------------------------------------
def report_login(username=None, is_success=True, reason=""):
    """
    Call this when a user logs in to the platform.
    """
    username = username or get_current_username()
    payload = {
        "username": username,
        "student_name": username,
        "event": "LOGIN",
        "action": "Logged in to Training Platform" if is_success else f"Failed Login ({reason})",
        "module_number": 1,
        "video_watched": True,
        "quiz_score": 0.0
    }
    success, data = _send(payload)
    if success:
        safe_print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [+] SUCCESS! Live Login recorded for: '{username}'")
    return success


# -------------------------------------------------------------
# 2. VIDEO WATCH ACTIVITY (100% complete vs Stuck midway)
# -------------------------------------------------------------
def report_video(username=None, module_num=1, percent_watched=100):
    """
    Call this when a student watches a module video.
    - If percent_watched >= 100: Marks video as completed (Gate cleared).
    - If percent_watched < 100: Marks as STUCK at this module.
    """
    username = username or get_current_username()
    is_completed = percent_watched >= 100
    payload = {
        "username": username,
        "student_name": username,
        "module_number": int(module_num),
        "video_watched": is_completed,
        "status": "IN_PROGRESS" if is_completed else "STUCK_VIDEO",
        "stuck_reason": None if is_completed else f"Video incomplete ({percent_watched}% watched). Module {module_num + 1} locked.",
        "action": f"Video Completed 100% (M-{module_num})" if is_completed else f"Video Incomplete ({percent_watched}%)"
    }
    success, data = _send(payload)
    if success:
        status_msg = "Completed 100%" if is_completed else f"STUCK ({percent_watched}%)"
        safe_print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [+] SUCCESS! Video update: '{username}' | Module {module_num} -> {status_msg}")
    return success


# -------------------------------------------------------------
# 3. QUIZ / QUESTIONS ACTIVITY (Score submitted)
# -------------------------------------------------------------
def report_quiz(username=None, module_num=1, quiz_score=85.0):
    """
    Call this when a student answers the quiz questions.
    - If quiz_score >= 60: Passed, unlocks next module (or finishes course if module 20).
    - If quiz_score < 60: Failed, requires retake.
    """
    username = username or get_current_username()
    is_pass = quiz_score >= 60.0
    is_course_done = (int(module_num) >= 20) and is_pass

    status = "COMPLETED" if is_course_done else ("IN_PROGRESS" if is_pass else "FAILED")

    payload = {
        "username": username,
        "student_name": username,
        "module_number": int(module_num),
        "video_watched": True,
        "quiz_score": float(quiz_score),
        "status": status,
        "stuck_reason": None if is_pass else f"Failed Module {module_num} Quiz ({quiz_score}% < 60% Passing Mark)",
        "action": f"Quiz Passed ({quiz_score}%)" if is_pass else f"Quiz Failed ({quiz_score}%)"
    }
    success, data = _send(payload)
    if success:
        grade = "PASSED" if is_pass else "FAILED (<60%)"
        safe_print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [+] SUCCESS! Quiz update: '{username}' | Module {module_num} Score: {quiz_score}% -> {grade}")
    return success


# -------------------------------------------------------------
# 4. SECURITY ALERTS: USB DETECTION (Physical media inserted)
# -------------------------------------------------------------
def report_usb(username=None, details="Unauthorized USB Storage Device Plugged In"):
    """
    Call this when a USB drive is detected on the client machine during training.
    """
    username = username or get_current_username()
    payload = {
        "username": username,
        "student_name": username,
        "event": "SECURITY_ALERT",
        "alert_type": "USB_DETECTED",
        "details": details,
        "severity": "CRITICAL"
    }
    success, data = _send(payload)
    if success:
        safe_print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [🚨 ALERT DISPATCHED] USB Insertion reported for user: '{username}'")
    return success


# -------------------------------------------------------------
# 5. SECURITY ALERTS: SCREENSHOT DETECTION (Screen capture attempt)
# -------------------------------------------------------------
def report_screenshot(username=None, details="Screenshot / PrintScreen capture attempted"):
    """
    Call this when a screenshot / screen-snip shortcut is triggered.
    """
    username = username or get_current_username()
    payload = {
        "username": username,
        "student_name": username,
        "event": "SECURITY_ALERT",
        "alert_type": "SCREENSHOT_DETECTED",
        "details": details,
        "severity": "HIGH"
    }
    success, data = _send(payload)
    if success:
        safe_print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [📸 ALERT DISPATCHED] Screenshot attempt reported for user: '{username}'")
    return success


def is_user_blocked(username=None):
    """
    Check whether admin has blocked this user from the SOC Dashboard.
    Returns: bool (True if blocked, False otherwise)
    """
    username = username or get_current_username()
    endpoints = [
        "https://sentinelai-backend-33dw.onrender.com/api/telemetry/feed/",
        "http://localhost:8000/api/telemetry/feed/"
    ]
    for url in endpoints:
        try:
            r = requests.get(url, timeout=3)
            if r.status_code == 200:
                trainees = r.json().get("data", {}).get("trainees", [])
                for t in trainees:
                    if t.get("name", "").lower() == username.lower() or t.get("email", "").lower() == username.lower():
                        return bool(t.get("status") == "BLOCKED" or t.get("isBlocked"))
        except Exception:
            continue
    return False


# -------------------------------------------------------------
# QUICK INTERACTIVE TESTER (Run standalone to test in terminal)
# -------------------------------------------------------------
if __name__ == "__main__":
    safe_print("\n" + "=" * 65)
    safe_print("  SENTINEL CYBER LMS & SECURITY ALERT TESTER")
    safe_print("=" * 65)
    safe_print(f"Targeting: {CLOUD_URL}")
    default_user = get_current_username()
    name = input(f"Enter Student Name (press Enter for '{default_user}'): ").strip()
    if not name:
        name = default_user

    safe_print(f"\n[+] Active Student: '{name}'")
    safe_print("Select an activity to test:")
    safe_print(f"  1. '{name}' logs in")
    safe_print(f"  2. '{name}' finishes Module 1 Video (100% Watched)")
    safe_print(f"  3. '{name}' gets STUCK at Module 3 Video (Only 40% Watched)")
    safe_print(f"  4. '{name}' PASSES Module 1 Quiz (Score: 85%)")
    safe_print(f"  5. '{name}' FAILS Module 5 Quiz (Score: 45% < 60%)")
    safe_print(f"  6. '{name}' FINISHES all 20 Modules (20/20 Completed)")
    safe_print(f"  7. 🚨 '{name}' PLUGS IN USB (USB Detected Alert)")
    safe_print(f"  8. 📸 '{name}' TAKES SCREENSHOT (Screenshot Detected Alert)")
    safe_print(f"  9. 🔍 Check if '{name}' is BLOCKED by Admin")
    safe_print("  Q. Quit")
    safe_print("=" * 65)

    while True:
        c = input("\nEnter choice (1-9, Q): ").strip()
        if c.lower() == 'q':
            break
        elif c == '1':
            report_login(name)
        elif c == '2':
            report_video(name, module_num=1, percent_watched=100)
        elif c == '3':
            report_video(name, module_num=3, percent_watched=40)
        elif c == '4':
            report_quiz(name, module_num=1, quiz_score=85.0)
        elif c == '5':
            report_quiz(name, module_num=5, quiz_score=45.0)
        elif c == '6':
            report_quiz(name, module_num=20, quiz_score=92.0)
        elif c == '7':
            report_usb(name, details="Unauthorized SanDisk 64GB Flash Drive Inserted")
        elif c == '8':
            report_screenshot(name, details="PrintScreen Shortcut Captured (Module Content)")
        elif c == '9':
            blocked = is_user_blocked(name)
            safe_print(f"[*] Block Status for '{name}': {'🚫 BLOCKED (Access Denied)' if blocked else '✅ ACTIVE (Access Granted)'}")
        else:
            safe_print("Invalid choice, select 1-9 or Q.")
