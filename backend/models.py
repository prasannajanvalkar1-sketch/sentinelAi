from django.db import models

class TelemetryLog(models.Model):
    event_id = models.CharField(max_length=50, unique=True)
    user_id = models.CharField(max_length=100)
    threat_type = models.CharField(max_length=100)
    defense_action = models.CharField(max_length=100)
    severity = models.CharField(max_length=20)
    response_time_sec = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_id} - {self.threat_type} ({self.severity})"
