"""
SentinelAI - Instant USB Live Detection Tester
===============================================
Run this on your friend's laptop to test USB insertion with live console feedback!
"""

import os
import sys
import time
import ctypes
import sentinel_bridge

print("=" * 65)
print("  SENTINEL USB HARDWARE LIVE DETECTION TESTER")
print("=" * 65)

# Detect current user
user = os.getlogin() if hasattr(os, 'getlogin') else 'CyberStudent'
print(f"[*] Trainee Name: '{user}'")

def get_drives():
    mask = ctypes.windll.kernel32.GetLogicalDrives()
    return {f"{chr(65+i)}:\\" for i in range(26) if (mask >> i) & 1}

baseline = get_drives()
print(f"[*] Currently connected drives: {', '.join(sorted(baseline))}")
print("\n👉👉👉 NOW PLUG IN YOUR USB DRIVE INTO THE LAPTOP! 👈👈👈")
print("Listening for changes (Ctrl+C to cancel)...\n")

try:
    while True:
        time.sleep(0.4)
        current = get_drives()
        new = current - baseline
        if new:
            for d in new:
                print("\n" + "!" * 55)
                print(f"  🚨🚨🚨 USB DRIVE DETECTED: {d} 🚨🚨🚨")
                print("!" * 55)
                print("[*] Sending Alert directly to Admin SOC Dashboard...")
                sentinel_bridge.report_usb(user, details=f"USB Storage Flash Drive Plugged In: {d}")
                print("[+] SUCCESS! Alert reached Dashboard!\n")
            baseline = current
        elif current != baseline:
            # USB was unplugged
            removed = baseline - current
            for r in removed:
                print(f"[*] USB Unplugged: {r}. Ready for next insertion...")
            baseline = current
except KeyboardInterrupt:
    print("\nExiting tester.")

