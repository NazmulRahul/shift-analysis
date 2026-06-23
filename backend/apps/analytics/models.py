from django.db import models

class ShiftRecord(models.Model):
    date = models.DateField()
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.FloatField(null=True, blank=True)
    activity_reason = models.CharField(max_length=255)
    is_valid = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.date} | {self.activity_reason} | {self.duration}h"


class DataQualityIssue(models.Model):
    row_index = models.IntegerField(null=True, blank=True)
    issue_type = models.CharField(max_length=50)  # e.g., MISSING_VALUE, INVALID_DURATION, TIMESTAMP_OVERLAP, DUPLICATE
    details = models.TextField()
    suggested_fix = models.TextField()
    status = models.CharField(max_length=50, default="Flagged")  # Flagged, Resolved, Excluded
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['row_index', 'issue_type']

    def __str__(self):
        return f"Row {self.row_index} | {self.issue_type} | {self.status}"
