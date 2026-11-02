import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// SentinelAI - Mobile Telemetry & Security Client for Flutter Apps
/// =================================================================
/// Connects your Flutter Android/iOS App to the Sentinel SOC Incident Command Center.
class SentinelService {
  static const String backendUrl = "https://sentinelai-backend-33dw.onrender.com/api/telemetry/ingest/";
  static const String apiKey = "sk_sentinel_live_938aB";

  /// 1. Report Live Login
  static Future<bool> reportLogin(String username) async {
    return _send({
      "username": username,
      "student_name": username,
      "event": "LOGIN",
      "action": "Logged in to Mobile Training App",
      "module_number": 1,
      "video_watched": true,
      "quiz_score": 0.0,
    });
  }

  /// 2. Report Video Watch Progress
  static Future<bool> reportVideo({
    required String username,
    required int moduleNum,
    required int percentWatched,
  }) async {
    final bool isCompleted = percentWatched >= 100;
    return _send({
      "username": username,
      "student_name": username,
      "module_number": moduleNum,
      "video_watched": isCompleted,
      "status": isCompleted ? "IN_PROGRESS" : "STUCK_VIDEO",
      "stuck_reason": isCompleted ? null : "Video incomplete ($percentWatched% watched). Module ${moduleNum + 1} locked.",
      "action": isCompleted ? "Video Completed 100% (M-$moduleNum)" : "Video Incomplete ($percentWatched%)",
    });
  }

  /// 3. Report Quiz Score
  static Future<bool> reportQuiz({
    required String username,
    required int moduleNum,
    required double score,
  }) async {
    final bool isPass = score >= 60.0;
    final bool isDone = moduleNum >= 20 && isPass;
    final String status = isDone ? "COMPLETED" : (isPass ? "IN_PROGRESS" : "FAILED");

    return _send({
      "username": username,
      "student_name": username,
      "module_number": moduleNum,
      "video_watched": true,
      "quiz_score": score,
      "status": status,
      "stuck_reason": isPass ? null : "Failed Module $moduleNum Quiz ($score% < 60%)",
      "action": isPass ? "Quiz Passed ($score%)" : "Quiz Failed ($score%)",
    });
  }

  /// 4. Report Security Alert (Screenshot attempt or OTG/USB connected)
  static Future<bool> reportSecurityAlert({
    required String username,
    required String alertType, // 'SCREENSHOT_DETECTED' or 'USB_DETECTED'
    required String details,
  }) async {
    return _send({
      "username": username,
      "student_name": username,
      "event": "SECURITY_ALERT",
      "alert_type": alertType,
      "details": details,
      "severity": "CRITICAL",
    });
  }

  /// 5. Autonomous Background USB Hardware Watcher (Pure Dart - Windows Desktop)
  /// Call this once after user logs in:
  /// `SentinelService.startUsbWatcher("username");`
  static Timer? _usbWatcherTimer;

  static void startUsbWatcher(String username) {
    if (!Platform.isWindows) return;
    _usbWatcherTimer?.cancel();

    Set<String> baseline = _getConnectedDrives();

    _usbWatcherTimer = Timer.periodic(const Duration(milliseconds: 700), (timer) async {
      try {
        final current = _getConnectedDrives();
        final newDrives = current.difference(baseline);

        if (newDrives.isNotEmpty) {
          for (final drive in newDrives) {
            print("[🚨 Sentinel] Physical USB Insertion Detected: $drive");
            await reportSecurityAlert(
              username: username,
              alertType: "USB_DETECTED",
              details: "Physical USB Flash Storage Inserted: $drive",
            );
          }
          baseline = current;
        } else if (current.length != baseline.length) {
          baseline = current;
        }
      } catch (_) {}
    });
  }

  static void stopUsbWatcher() {
    _usbWatcherTimer?.cancel();
    _usbWatcherTimer = null;
  }

  static Set<String> _getConnectedDrives() {
    final drives = <String>{};
    for (int i = 67; i <= 90; i++) { // C: to Z:
      final letter = '${String.fromCharCode(i)}:\\';
      try {
        if (Directory(letter).existsSync()) {
          drives.add(letter);
        }
      } catch (_) {}
    }
    return drives;
  }

  /// Check if user has been blocked by Admin from SOC Dashboard
  static Future<bool> isUserBlocked(String username) async {
    try {
      final res = await http.get(
        Uri.parse("https://sentinelai-backend-33dw.onrender.com/api/telemetry/feed/"),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final List trainees = data['data']?['trainees'] ?? [];
        for (var t in trainees) {
          if (t['name'].toString().toLowerCase() == username.toLowerCase()) {
            return t['status'] == 'BLOCKED' || t['isBlocked'] == true;
          }
        }
      }
    } catch (e) {
      print("[Sentinel] Block check error: $e");
    }
    return false;
  }

  /// Internal Send Helper
  static Future<bool> _send(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse(backendUrl),
        headers: {
          "Content-Type": "application/json",
          "X-Sentinel-API-Key": apiKey,
        },
        body: jsonEncode(payload),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print("[Sentinel] Failed to dispatch telemetry: $e");
      return false;
    }
  }
}

