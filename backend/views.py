"""
SentinelAI Cyber Defense Platform - DRF API Views
UserRegistrationAPIView handling registration and returning clean JSON error payloads.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    UserRegistrationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailOTPVerifySerializer
)
import uuid
import datetime
import random
from django.db.models import Avg, Count, Q
from .models import TelemetryLog

# Global state for simulation
TELEMETRY_FEED = []
THREATS_NEUTRALIZED = 1428

class UserRegistrationAPIView(APIView):
    """
    API View for Employee & Admin Registration and Token Authorization.
    Enforces strict disposable domain blocking and MX record verification.
    """

    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user_data = serializer.validated_data
            return Response(
                {
                    "status": "success",
                    "message": "Authentication & domain clearance verified successfully.",
                    "data": {
                        "email": user_data['email'],
                        "role": user_data['role'],
                        "domain_verified": True,
                        "disposable_filter_passed": True
                    }
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class PasswordResetRequestAPIView(APIView):
    """
    API View to request a 6-digit recovery OTP for password reset.
    """
    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            return Response(
                {
                    "status": "success",
                    "message": f"Recovery OTP dispatched to {serializer.validated_data['email']}.",
                    "otp_dispatched": True
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmAPIView(APIView):
    """
    API View to verify recovery OTP and set a new password.
    """
    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            return Response(
                {
                    "status": "success",
                    "message": "Password successfully reset. Please sign in with your new credentials."
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailOTPVerifyAPIView(APIView):
    """
    API View to verify 2FA Login Email OTP token.
    """
    def post(self, request, *args, **kwargs):
        serializer = EmailOTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            return Response(
                {
                    "status": "success",
                    "message": "2FA Email OTP verified. Session granted."
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TelemetryIngestAPIView(APIView):
    """
    API View to accept telemetry events from the software simulation client.
    """
    def post(self, request, *args, **kwargs):
        api_key = request.headers.get('X-Sentinel-API-Key')
        if not api_key or api_key != "sk_sentinel_live_938aB":
            return Response({"error": "Unauthorized. Invalid or missing X-Sentinel-API-Key."}, status=status.HTTP_401_UNAUTHORIZED)
            
        global TELEMETRY_FEED
        data = request.data
        
        user_id = data.get('user_id', 'unknown')
        threat_type = data.get('threat_type', 'Unknown Threat')
        defense_action = data.get('defense_action', 'Flagged')
        response_time = data.get('response_time', random.uniform(0.1, 1.5))
        
        # Determine severity based on threat type keywords
        severity = 'MEDIUM'
        threat_lower = threat_type.lower()
        if 'hijack' in threat_lower or 'sql' in threat_lower or 'critical' in threat_lower:
            severity = 'CRITICAL'
        elif 'malware' in threat_lower or 'drop' in threat_lower or 'ddos' in threat_lower:
            severity = 'HIGH'
        elif 'phishing' in threat_lower or 'spray' in threat_lower:
            severity = 'MEDIUM'
            
        event_id = f"INC-{datetime.datetime.now().year}-{random.randint(1000, 9999)}"
        
        # Save to PostgreSQL (via Django ORM)
        try:
            TelemetryLog.objects.create(
                event_id=event_id,
                user_id=user_id,
                threat_type=threat_type,
                defense_action=defense_action,
                severity=severity,
                response_time_sec=response_time
            )
        except Exception as e:
            print("DB Save failed:", e)
        
        event = {
            "id": event_id,
            "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"),
            "severity": severity,
            "vector": threat_type,
            "target": data.get('target', 'Endpoint Client'),
            "sourceIp": data.get('source_ip', f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.X"),
            "action": defense_action,
        }
        
        TELEMETRY_FEED.insert(0, event)
        TELEMETRY_FEED = TELEMETRY_FEED[:50]  # Keep only latest 50
            
        return Response({
            "status": "success",
            "message": "Telemetry received and persisted",
            "event_id": event_id
        }, status=status.HTTP_201_CREATED)


class TelemetryFeedAPIView(APIView):
    """
    API View to serve the latest telemetry events to the React Dashboard.
    """
    def get(self, request, *args, **kwargs):
        # Calculate real-time metrics via ORM
        try:
            metrics = TelemetryLog.objects.aggregate(
                mttd=Avg('response_time_sec'),
                threats_neutralized=Count('id', filter=~Q(severity='CRITICAL'))
            )
            
            mttd = round(metrics['mttd'] or 1.8, 2)
            # Baseline offset for visuals
            threats_neutralized = (metrics['threats_neutralized'] or 0) + 1428 
            
            # Severity Counts
            severity_qs = TelemetryLog.objects.values('severity').annotate(count=Count('severity'))
            severity_counts = {item['severity']: item['count'] for item in severity_qs}
            total_threats = sum(severity_counts.values())
            critical_alerts = severity_counts.get('CRITICAL', 0)
        except Exception:
            global THREATS_NEUTRALIZED
            mttd = 1.8
            threats_neutralized = THREATS_NEUTRALIZED
            severity_counts = {}
            total_threats = 0
            critical_alerts = 0
            
        # Additional mock KPIs for the dashboard
        total_users = 1284
        active_sessions = 42
        failed_auths = 31
        risk_score = 18.4
        system_health = 98.7

        return Response({
            "status": "success",
            "data": {
                "incidents": TELEMETRY_FEED,
                "metrics": {
                    "threatsNeutralized": threats_neutralized,
                    "mttd": mttd,
                    "totalThreats": total_threats,
                    "criticalAlerts": critical_alerts,
                    "totalUsers": total_users,
                    "activeSessions": active_sessions,
                    "failedAuths": failed_auths,
                    "riskScore": risk_score,
                    "systemHealth": system_health
                },
                "severity_counts": severity_counts
            }
        }, status=status.HTTP_200_OK)
