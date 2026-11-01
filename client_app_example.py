"""
Example Client Software with Sentinel Real-Time Telemetry & Security Integration
================================================================================
This file shows how to plug `sentinel_bridge` into your existing Python application.
Replace `actual_logged_in_username` with the real student username/email from your login screen.
"""

import time
import sentinel_bridge

def main_application():
    print("=" * 60)
    print("  CYBER LEARNING APPLICATION (CLIENT SIDE)")
    print("=" * 60)

    # -----------------------------------------------------------------
    # STEP 1: REAL USER LOGIN
    # Get the actual username from your GUI / input / database / session
    # -----------------------------------------------------------------
    real_user = input("Enter Real Logged-in Student Name / ID: ").strip()
    if not real_user:
        real_user = "Priya"  # Fallback if empty

    print(f"\n[+] User '{real_user}' authenticating...")
    # Report live login to admin dashboard
    sentinel_bridge.report_login(username=real_user)

    # -----------------------------------------------------------------
    # STEP 2: CHECK IF THIS USER WAS BLOCKED BY ADMIN
    # Call this before starting training or module
    # -----------------------------------------------------------------
    if sentinel_bridge.is_user_blocked(real_user):
        print("\n[🚫 ACCESS DENIED] You have been BLOCKED by the Administrator!")
        print("Please contact support to unblock your account.")
        return

    # -----------------------------------------------------------------
    # STEP 3: VIDEO WATCHING ACTIVITY
    # Call this when video finishes 100% or stops midway
    # -----------------------------------------------------------------
    print(f"\n[+] Student '{real_user}' watching Module 1 Training Video...")
    time.sleep(1)
    # 100% completed video
    sentinel_bridge.report_video(username=real_user, module_num=1, percent_watched=100)

    # -----------------------------------------------------------------
    # STEP 4: QUIZ COMPLETION
    # Call this when user submits quiz score (e.g. 88%)
    # -----------------------------------------------------------------
    print(f"[+] Student '{real_user}' submitting Module 1 Quiz...")
    time.sleep(1)
    sentinel_bridge.report_quiz(username=real_user, module_num=1, quiz_score=88.0)

    # -----------------------------------------------------------------
    # STEP 5: SECURITY ALERT: USB INSERTION
    # Call this inside your USB detection thread / listener
    # -----------------------------------------------------------------
    trigger_usb = input("\nSimulate USB Insertion for this user? (y/n): ").strip().lower()
    if trigger_usb == 'y':
        print("[!] USB Drive detected! Dispatching security alert...")
        sentinel_bridge.report_usb(username=real_user, details="Kingston 32GB USB Flash Drive Inserted")

    # -----------------------------------------------------------------
    # STEP 6: SECURITY ALERT: SCREENSHOT CAPTURE
    # Call this inside your screenshot / keyboard hotkey listener
    # -----------------------------------------------------------------
    trigger_ss = input("\nSimulate Screenshot Capture for this user? (y/n): ").strip().lower()
    if trigger_ss == 'y':
        print("[!] Screenshot detected! Dispatching security alert...")
        sentinel_bridge.report_screenshot(username=real_user, details="PrintScreen captured on Module Screen")

    # -----------------------------------------------------------------
    # STEP 7: POST-ALERT LOCKOUT CHECK
    # Check if admin blocked the user after the alert
    # -----------------------------------------------------------------
    print("\n[*] Checking if Admin has locked this account from Dashboard...")
    if sentinel_bridge.is_user_blocked(real_user):
        print(f"[🚫 LOCKED] User '{real_user}' was BLOCKED by Admin on Dashboard!")
    else:
        print(f"[✅ ACTIVE] User '{real_user}' is currently in good standing.")

    print("\n[+] Done!")

if __name__ == "__main__":
    main_application()

