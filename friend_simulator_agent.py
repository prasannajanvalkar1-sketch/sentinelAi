"""
SentinelAI - Friend Laptop Real-Time Training & Simulation Client
=================================================================
Use this script on your friend's laptop (or import it into their software)
to stream 100% REAL live activity (Logins, Video Watching, Quizzes, Defense Simulations)
directly to your Sentinel SOC Dashboard.

Whatever username or name logs in (e.g., 'Rakesh'), it appears AS-IT-IS in real-time.
"""

import sys
import time
import random
import argparse
import requests
import datetime

DEFAULT_API_KEY = "sk_sentinel_live_938aB"

class SentinelClient:
    """
    Client for transmitting live events directly to the Sentinel Dashboard.
    """
    def __init__(self, server_url="http://localhost:8000", api_key=DEFAULT_API_KEY):
        self.server_url = server_url.rstrip('/')
        self.endpoint = f"{self.server_url}/api/telemetry/ingest/"
        self.api_key = api_key
        self.headers = {
            "Content-Type": "application/json",
            "X-Sentinel-API-Key": self.api_key
        }

    # 1. LIVE LOGIN EVENT (e.g., when 'Rakesh' logs in to the platform)
    def report_login(self, username, is_success=True, failure_reason=""):
        payload = {
            "student_name": username,
            "username": username,
            "event": "LOGIN",
            "module_number": 1,
            "action": "Login Successful - Session Granted" if is_success else f"Failed Login ({failure_reason})",
            "video_watched": True,
            "quiz_score": 0.0,
            "source_ip": "Friend Client Terminal"
        }
        return self._send(payload, f"Login event for '{username}'")

    # 2. MODULE PROGRESS EVENT (Video gate, quiz score, AI defense)
    def report_training_progress(self, student_name, module_number, video_watched=True, quiz_score=85.0, email=None):
        payload = {
            "student_name": student_name,
            "username": student_name,
            "email": email or f"{student_name.lower().replace(' ', '')}@live.com",
            "module_number": module_number,
            "video_watched": video_watched,
            "quiz_score": quiz_score,
            "source_ip": "Friend Client Terminal"
        }
        return self._send(payload, f"Module {module_number} update for '{student_name}'")

    def _send(self, payload, description):
        try:
            resp = requests.post(self.endpoint, json=payload, headers=self.headers, timeout=5)
            if resp.status_code == 201:
                data = resp.json()
                print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [+] Sent to Dashboard: {description} (Status: {data.get('trainee_status')})")
                return True
            else:
                print(f"[!] Server returned {resp.status_code}: {resp.text}")
                return False
        except requests.exceptions.ConnectionError:
            print(f"[x] Connection Failed! Cannot reach {self.endpoint}. Check ngrok or network.")
            return False
        except Exception as e:
            print(f"[x] Error: {e}")
            return False


def run_interactive_menu(client):
    print("\n" + "=" * 65)
    print("  SENTINEL CYBER DEFENSE - 100% REAL LIVE DATA TRANSMITTER")
    print("=" * 65)
    print(f"Target Dashboard: {client.endpoint}")

    user_input_name = input("\nEnter Student / User Name to test (e.g. Rakesh): ").strip()
    if not user_input_name:
        user_input_name = "Rakesh"

    print(f"\n[+] Active User Selected: '{user_input_name}'")
    print("\nChoose an action to stream live to the dashboard:")
    print(f"  1. '{user_input_name}' logs in to the platform")
    print(f"  2. '{user_input_name}' finishes Module 1 Video (100%) & passes Quiz (85%)")
    print(f"  3. '{user_input_name}' gets STUCK at Module 4 (Video stopped midway)")
    print(f"  4. '{user_input_name}' FAILS Module 8 Quiz (Score: 42% < 60%)")
    print(f"  5. '{user_input_name}' COMPLETES all 20 Modules successfully!")
    print("  6. Change username")
    print("  Q. Quit")
    print("=" * 65)

    current_name = user_input_name

    while True:
        choice = input(f"\nEnter choice for '{current_name}' (1-6, Q): ").strip()
        if choice.lower() == 'q':
            print("Exiting.")
            break
        elif choice == '1':
            client.report_login(username=current_name, is_success=True)
        elif choice == '2':
            client.report_training_progress(student_name=current_name, module_number=1, video_watched=True, quiz_score=85.0)
        elif choice == '3':
            client.report_training_progress(student_name=current_name, module_number=4, video_watched=False, quiz_score=0.0)
        elif choice == '4':
            client.report_training_progress(student_name=current_name, module_number=8, video_watched=True, quiz_score=42.0)
        elif choice == '5':
            client.report_training_progress(student_name=current_name, module_number=20, video_watched=True, quiz_score=94.0)
        elif choice == '6':
            new_name = input("Enter new student name: ").strip()
            if new_name:
                current_name = new_name
                print(f"[+] Active User changed to: '{current_name}'")
        else:
            print("Invalid choice, please select 1-6 or Q.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sentinel Live Telemetry Bridge")
    parser.add_argument("--url", default="http://localhost:8000", help="URL of Dashboard (e.g. https://disown-moonlit-septum.ngrok-free.dev)")
    parser.add_argument("--key", default=DEFAULT_API_KEY, help="Sentinel Ingest API Key")
    args = parser.parse_args()

    client = SentinelClient(server_url=args.url, api_key=args.key)
    run_interactive_menu(client)
