"""
SentinelAI - 100% Autonomous Client Security & Telemetry Agent
==============================================================
Triple-Engine USB Detection + Screenshot Watcher + Lockout Enforcer

USB Engines:
1. Native Windows Win32 WM_DEVICECHANGE (Intercepts hardware plug-in with 0ms delay)
2. Drive Letter Delta Watcher (Catches any E:, F:, G: drive whether Removable or Fixed)
3. Startup Baseline Scan (Detects pre-existing USB sticks already in the laptop)
"""

import os
import sys
import time
import ctypes
import threading
from ctypes import wintypes
import sentinel_bridge

# Win32 Constants
WM_DEVICECHANGE = 0x0219
DBT_DEVICEARRIVAL = 0x8000
DBT_DEVNODES_CHANGED = 0x0007
DBT_DEVICEREMOVECOMPLETE = 0x8004

DRIVE_REMOVABLE = 2
DRIVE_FIXED = 3
VK_SNAPSHOT = 0x2C
CF_BITMAP = 2

# 64-bit safe DefWindowProcW setup
LRESULT = ctypes.c_int64
try:
    ctypes.windll.user32.DefWindowProcW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
    ctypes.windll.user32.DefWindowProcW.restype = LRESULT
except Exception:
    pass

WNDPROCTYPE = ctypes.WINFUNCTYPE(LRESULT, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)


def get_current_student():
    """Auto-detects real logged-in Windows user"""
    try:
        user = os.getlogin()
        if user and user.strip():
            return user.strip()
    except Exception:
        pass
    return os.environ.get('USERNAME') or os.environ.get('USER') or 'CyberStudent'


def get_active_drives():
    """Returns set of all currently active drive letters"""
    drives = set()
    try:
        mask = ctypes.windll.kernel32.GetLogicalDrives()
        for i in range(26):
            if (mask >> i) & 1:
                drives.add(f"{chr(65 + i)}:\\")
    except Exception:
        pass
    return drives


def get_volume_label(drive_letter):
    """Gets volume label of drive (e.g. SanDisk, Kingston)"""
    try:
        vol_buf = ctypes.create_unicode_buffer(260)
        res = ctypes.windll.kernel32.GetVolumeInformationW(drive_letter, vol_buf, 260, None, None, None, None, 0)
        if res and vol_buf.value.strip():
            return vol_buf.value.strip()
    except Exception:
        pass
    return "USB Drive"


class AutonomousSentinelAgent:
    def __init__(self, username=None):
        self.username = username or get_current_student()
        self.running = True
        self.baseline_drives = set()
        self.reported_drives = set()
        self.last_clipboard_seq = 0
        self.is_blocked_locally = False
        self.last_usb_alert_time = 0

    def trigger_usb_alert(self, details):
        """Debounced USB alert dispatch (prevents duplicate spam within 2 seconds)"""
        now = time.time()
        if (now - self.last_usb_alert_time) > 2.0:
            self.last_usb_alert_time = now
            print(f"\n[🚨 CRITICAL ALERT] USB HARDWARE DETECTED: {details}")
            sentinel_bridge.report_usb(self.username, details=details)

    # -------------------------------------------------------------
    # ENGINE 1: NATIVE WINDOWS WM_DEVICECHANGE MESSAGE SINK
    # -------------------------------------------------------------
    def _wm_devicechange_loop(self):
        """Listens directly to Windows kernel hardware plug-in messages"""
        def py_wndproc(hwnd, msg, wparam, lparam):
            if msg == WM_DEVICECHANGE:
                if wparam == DBT_DEVICEARRIVAL or wparam == DBT_DEVNODES_CHANGED:
                    # Give Windows 0.5s to mount volume if storage
                    time.sleep(0.3)
                    drives_now = get_active_drives()
                    new = drives_now - self.baseline_drives
                    if new:
                        d = list(new)[0]
                        lbl = get_volume_label(d)
                        self.trigger_usb_alert(f"Hardware USB Device Plugged In: Drive {d} [{lbl}]")
                    else:
                        self.trigger_usb_alert("Physical USB Hardware Device Plugged In (Hardware Event)")
            return ctypes.windll.user32.DefWindowProcW(hwnd, msg, wparam, lparam)

        try:
            proto = WNDPROCTYPE(py_wndproc)
            
            class WNDCLASSEXW(ctypes.Structure):
                _fields_ = [
                    ('cbSize', wintypes.UINT),
                    ('style', wintypes.UINT),
                    ('lpfnWndProc', WNDPROCTYPE),
                    ('cbClsExtra', ctypes.c_int),
                    ('cbWndExtra', ctypes.c_int),
                    ('hInstance', wintypes.HINSTANCE),
                    ('hIcon', wintypes.HICON),
                    ('hCursor', wintypes.HICON),
                    ('hbrBackground', wintypes.HBRUSH),
                    ('lpszMenuName', wintypes.LPCWSTR),
                    ('lpszClassName', wintypes.LPCWSTR),
                    ('hIconSm', wintypes.HICON)
                ]

            wcls = WNDCLASSEXW()
            wcls.cbSize = ctypes.sizeof(WNDCLASSEXW)
            wcls.lpfnWndProc = proto
            wcls.lpszClassName = f"SentinelUSBSink_{os.getpid()}"
            wcls.hInstance = ctypes.windll.kernel32.GetModuleHandleW(None)
            ctypes.windll.user32.RegisterClassExW(ctypes.byref(wcls))

            hwnd = ctypes.windll.user32.CreateWindowExW(
                0, wcls.lpszClassName, 'SentinelEventSink',
                0, 0, 0, 0, 0, 0, 0, wcls.hInstance, None
            )

            msg = wintypes.MSG()
            while self.running and ctypes.windll.user32.GetMessageW(ctypes.byref(msg), 0, 0, 0) > 0:
                ctypes.windll.user32.TranslateMessage(ctypes.byref(msg))
                ctypes.windll.user32.DispatchMessageW(ctypes.byref(msg))
        except Exception as e:
            pass

    # -------------------------------------------------------------
    # ENGINE 2: DRIVE POLLING (High-speed 0.5s delta scan)
    # -------------------------------------------------------------
    def _drive_delta_loop(self):
        # Baseline snapshot
        self.baseline_drives = get_active_drives()
        
        # Check if USB drive was already inserted on startup
        sys_drive = os.environ.get('SystemDrive', 'C:') + '\\'
        for d in self.baseline_drives:
            dtype = ctypes.windll.kernel32.GetDriveTypeW(d)
            if dtype == DRIVE_REMOVABLE or (d.upper() != sys_drive.upper() and d.upper() != 'C:\\' and d.upper() != 'D:\\'):
                lbl = get_volume_label(d)
                self.trigger_usb_alert(f"Active USB Storage Drive Connected on Launch ({d} - {lbl})")

        while self.running:
            try:
                time.sleep(0.5)
                current_drives = get_active_drives()

                # Any new drive letter added?
                new_drives = current_drives - self.baseline_drives
                if new_drives:
                    for d in new_drives:
                        lbl = get_volume_label(d)
                        self.trigger_usb_alert(f"USB Flash Drive Plugged In: {d} [{lbl}]")

                # If drive was unplugged, reset baseline so re-plugging triggers again
                if current_drives != self.baseline_drives:
                    self.baseline_drives = current_drives
            except Exception:
                pass

    # -------------------------------------------------------------
    # SCREENSHOT WATCHER LOOP
    # -------------------------------------------------------------
    def _screenshot_watcher_loop(self):
        try:
            self.last_clipboard_seq = ctypes.windll.user32.GetClipboardSequenceNumber()
        except Exception:
            self.last_clipboard_seq = 0

        last_key_state = 0
        while self.running:
            try:
                time.sleep(0.25)
                # PrintScreen Key
                key_state = ctypes.windll.user32.GetAsyncKeyState(VK_SNAPSHOT) & 0x8000
                if key_state and not last_key_state:
                    print(f"\n[📸 ALERT] PrintScreen Pressed by {self.username}!")
                    sentinel_bridge.report_screenshot(self.username, details="PrintScreen Shortcut Key Pressed")
                last_key_state = key_state

                # Snipping Tool Clipboard
                try:
                    curr_seq = ctypes.windll.user32.GetClipboardSequenceNumber()
                    if curr_seq != self.last_clipboard_seq:
                        self.last_clipboard_seq = curr_seq
                        if ctypes.windll.user32.IsClipboardFormatAvailable(CF_BITMAP):
                            print(f"\n[📸 ALERT] Snipping Tool Screenshot Captured by {self.username}!")
                            sentinel_bridge.report_screenshot(self.username, details="Screen Snipping Tool Capture Saved to Clipboard")
                except Exception:
                    pass
            except Exception:
                pass

    # -------------------------------------------------------------
    # ADMIN LOCKOUT CHECK
    # -------------------------------------------------------------
    def _admin_block_enforcer_loop(self):
        while self.running:
            try:
                time.sleep(2.5)
                if sentinel_bridge.is_user_blocked(self.username):
                    self.is_blocked_locally = True
                    self.running = False
                    print(f"\n[🚫 ACCESS DENIED] User '{self.username}' has been BLOCKED by Administrator!")
                    ctypes.windll.user32.MessageBoxW(
                        0,
                        f"CRITICAL SECURITY LOCKOUT:\n\nStudent '{self.username}' has been BLOCKED by the Cyber Administrator due to security policy violations.\n\nAll learning sessions have been terminated.",
                        "SentinelAI - Access Denied",
                        0x10 | 0x0
                    )
                    os._exit(1)
            except Exception:
                pass

    def start(self):
        print(f"[*] Sentinel Autonomous Security Agent Active for: '{self.username}'")
        try:
            sentinel_bridge.report_login(self.username)
        except Exception:
            pass

        # 1. Native Windows Hardware Device Change Event Thread
        t_wm = threading.Thread(target=self._wm_devicechange_loop, daemon=True, name="Sentinel-WMDev")
        t_wm.start()

        # 2. Drive Letter Delta Thread
        t_drv = threading.Thread(target=self._drive_delta_loop, daemon=True, name="Sentinel-DriveDelta")
        t_drv.start()

        # 3. Screenshot Thread
        t_ss = threading.Thread(target=self._screenshot_watcher_loop, daemon=True, name="Sentinel-SS")
        t_ss.start()

        # 4. Admin Block Lockout Thread
        t_blk = threading.Thread(target=self._admin_block_enforcer_loop, daemon=True, name="Sentinel-Lockout")
        t_blk.start()

        print("[+] All Security Watchers Running (Hardware WM_DEVICECHANGE, Drive Delta, Screenshot, Lockout)...")


_agent_instance = None

def init_agent(username=None):
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = AutonomousSentinelAgent(username=username)
        _agent_instance.start()
    return _agent_instance

init_agent()

if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("  SENTINEL AUTOMATIC BACKGROUND AGENT RUNNING (ZERO-TERMINAL)")
    print("=" * 65)
    print(f"Active User: {get_current_student()}")
    print("Watching for USB insertion & Screenshots in real time.")
    print("Press Ctrl+C to stop...\n")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nAgent stopped.")
