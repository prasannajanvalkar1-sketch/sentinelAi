"""
SentinelAI - Client Activity & Security Telemetry Bridge
========================================================
Smart Auto-Detecting Bridge:
- If testing on YOUR laptop: Connects directly to localhost:8000 (works instantly!)
- If running on FRIEND'S laptop: Routes through Ngrok tunnel automatically!

Capabilities:
1. Student Activity: Login, Video watching (Gate 100%), Quiz submission (20 Modules)
2. Security Monitoring: USB Hardware insertion, Screenshot capture detection
3. Admin Enforcement: Receives real-time BLOCKED / Quarantine signal from Dashboard

Usage:
  import sentinel_bridge
  sentinel_bridge.report_login("Rakesh")
  sentinel_bridge.report_video("Rakesh", module_num=1, percent_watched=100)
  sentinel_bridge.report_quiz("Rakesh", module_num=1, quiz_score=85)
  sentinel_bridge.report_usb("Rakesh", details="SanDisk 64GB USB plugged in")
  sentinel_bridge.report_screenshot("Rakesh")
"""

import os
import sys
import requests
import datetime

LOCAL_URL = "http://localhost:8000/api/telemetry/ingest/"
NGROK_URL = "https://disown-moonlit-septum.ngrok-free.dev/api/telemetry/ingest/"
API_KEY = "sk_sentinel_live_938aB"

HEADERS = {
    "Content-Type": "application/json",
    "X-Sentinel-API-Key": API_KEY
}

# Auto-detect whether we are running locally or on friend's laptop
def get_target_url():
    try:
        r = requests.get("http://localhost:8000/api/telemetry/feed/", timeout=0.8)
        if r.status_code == 200:
            return LOCAL_URL
    except Exception:
        pass
    return NGROK_URL

def _send(payload):
    target_url = get_target_url()
    try:
        resp = requests.post(target_url, json=payload, headers=HEADERS, timeout=6)
        if resp.status_code in [200, 201]:
            data = resp.json()
            if data.get("is_blocked"):
                username = payload.get("username", "Student")
                print(f"\n[🚨 CRITICAL LOCKOUT] USER '{username}' IS BLOCKED BY ADMIN!")
                print(f"    Message: {data.get('message')}")
                return False, {"blocked": True, "error": data.get('message')}
            return True, data
        else:
            print(f"[!] Server returned {resp.status_code}: {resp.text}")
            return False, None
    except requests.exceptions.ConnectionError:
        print(f"[x] Connection Error: Cannot connect to '{target_url}'.")
        if target_url == NGROK_URL:
            print("    -> Make sure 'ngrok http 8000' is running on the host laptop!")
        else:
            print("    -> Make sure 'python standalone_soc_server.py' is running!")
        return False, None
    except Exception as e:
        print(f"[x] Error sending to dashboard: {e}")
        return False, None


# -------------------------------------------------------------
# 1. LOGIN ACTIVITY (Jab student login kare)
# -------------------------------------------------------------
def report_login(username, is_success=True, reason=""):
    """
    Call this when a user logs in to the platform.
    """
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
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [+] SUCCESS! Live Login recorded for: '{username}'")
    return success


# -------------------------------------------------------------
# 2. VIDEO WATCH ACTIVITY (100% complete vs Stuck midway)
# -------------------------------------------------------------
def report_video(username, module_num, percent_watched=100):
    """
    Call this when a student watches a module video.
    - If percent_watched >= 100: Marks video as completed (Gate cleared).
    - If percent_watched < 100: Marks as STUCK at this module.
    """
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
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [+] SUCCESS! Video update: '{username}' | Module {module_num} -> {status_msg}")
    return success


# -------------------------------------------------------------
# 3. QUIZ / QUESTIONS ACTIVITY (Score submitted)
# -------------------------------------------------------------
def report_quiz(username, module_num, quiz_score):
    """
    Call this when a student answers the quiz questions.
    - If quiz_score >= 60: Passed, unlocks next module (or finishes course if module 20).
    - If quiz_score < 60: Failed, requires retake.
    """
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
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [+] SUCCESS! Quiz update: '{username}' | Module {module_num} Score: {quiz_score}% -> {grade}")
    return success


# -------------------------------------------------------------
# 4. SECURITY ALERTS: USB DETECTION (Physical media inserted)
# -------------------------------------------------------------
def report_usb(username, details="Unauthorized USB Storage Device Plugged In"):
    """
    Call this when a USB drive is detected on the client machine during training.
    """
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
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [🚨 ALERT DISPATCHED] USB Insertion reported for user: '{username}'")
    return success


# -------------------------------------------------------------
# 5. SECURITY ALERTS: SCREENSHOT DETECTION (Screen capture attempt)
# -------------------------------------------------------------
def report_screenshot(username, details="Screenshot / PrintScreen capture attempted"):
    """
    Call this when a screenshot / screen-snip shortcut is triggered.
    """
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
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [📸 ALERT DISPATCHED] Screenshot attempt reported for user: '{username}'")
    return success


def is_user_blocked(username):
    """
    Check whether admin has blocked this user from the SOC Dashboard.
    Returns: bool (True if blocked, False otherwise)
    """
    try:
        backend_base = "http://localhost:8000" if get_target_url() == LOCAL_URL else NGROK_URL.replace("/api/telemetry/ingest/", "")
        r = requests.get(f"{backend_base}/api/telemetry/feed/", timeout=2)
        if r.status_code == 200:
            trainees = r.json().get("data", {}).get("trainees", [])
            for t in trainees:
                if t.get("name", "").lower() == username.lower():
                    return bool(t.get("status") == "BLOCKED" or t.get("isBlocked"))
    except Exception:
        pass
    return False


# -------------------------------------------------------------
# QUICK INTERACTIVE TESTER (Run standalone to test in terminal)
# -------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("  SENTINEL CYBER LMS & SECURITY ALERT TESTER")
    print("=" * 65)
    print(f"Targeting: {get_target_url()}")
    default_user = os.getlogin() if hasattr(os, 'getlogin') else "Student"
    name = input(f"Enter Student Name (press Enter for '{default_user}'): ").strip()
    if not name:
        name = default_user

    print(f"\n[+] Active Student: '{name}'")
    print("Select an activity to test:")
    print(f"  1. '{name}' logs in")
    print(f"  2. '{name}' finishes Module 1 Video (100% Watched)")
    print(f"  3. '{name}' gets STUCK at Module 3 Video (Only 40% Watched)")
    print(f"  4. '{name}' PASSES Module 1 Quiz (Score: 85%)")
    print(f"  5. '{name}' FAILS Module 5 Quiz (Score: 45% < 60%)")
    print(f"  6. '{name}' FINISHES all 20 Modules (20/20 Completed)")
    print(f"  7. 🚨 '{name}' PLUGS IN USB (USB Detected Alert)")
    print(f"  8. 📸 '{name}' TAKES SCREENSHOT (Screenshot Detected Alert)")
    print(f"  9. 🔍 Check if '{name}' is BLOCKED by Admin")
    print("  Q. Quit")
    print("=" * 65)

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
            print(f"[*] Block Status for '{name}': {'🚫 BLOCKED (Access Denied)' if blocked else '✅ ACTIVE (Access Granted)'}")
        else:
            print("Invalid choice, select 1-9 or Q.")
