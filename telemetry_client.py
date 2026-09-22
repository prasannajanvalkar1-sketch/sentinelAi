import requests
import time
import random

# Configuration
API_URL = "http://localhost:8000/api/telemetry/ingest/"
USER_ID = "sim_client_001"

def send_telemetry_event(threat_type, defense_action, target):
    """
    Sends a telemetry event to the SentinelSOC Backend.
    """
    payload = {
        "user_id": USER_ID,
        "threat_type": threat_type,
        "defense_action": defense_action,
        "target": target,
        "response_time": random.uniform(0.1, 1.5)
    }

    try:
        print(f"Sending telemetry: {threat_type} -> {defense_action}")
        headers = {
            "X-Sentinel-API-Key": "sk_sentinel_live_938aB",
            "Content-Type": "application/json"
        }
        response = requests.post(API_URL, json=payload, headers=headers, timeout=5)
        
        if response.status_code == 201:
            data = response.json()
            print(f"[SUCCESS] Event logged: {data.get('event_id')}")
        else:
            print(f"[FAILED] Server responded with {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Connection failed: {e}")

if __name__ == "__main__":
    print("SentinelAI Telemetry Client Started.")
    print("Simulating threat events every few seconds. Press Ctrl+C to stop.\n")
    
    threat_vectors = [
        ("Phishing Attack", "Quarantined Email", "Exec Mailbox"),
        ("DDoS Attempt", "Rate Limited IP", "API Gateway"),
        ("Session Hijack", "Terminated Session", "Admin Portal"),
        ("Malware Drop", "File Quarantined", "Node-alpha"),
        ("Credential Spray", "IP Blocked", "Login Endpoint")
    ]

    try:
        while True:
            # Pick a random threat simulation
            threat, action, target = random.choice(threat_vectors)
            send_telemetry_event(threat, action, target)
            
            # Wait before sending the next one
            time.sleep(random.uniform(2, 6))
            
    except KeyboardInterrupt:
        print("\nTelemetry Client Stopped.")
