import io
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from datetime import date, datetime, timezone
from .models import ShiftRecord, DataQualityIssue
from .services.cleaner import CSVProcessor
from .services.streak_service import StreakService
from .services.efficiency_service import EfficiencyService


class ShiftRecordModelTestCase(TestCase):
    def test_create_record(self):
        record = ShiftRecord.objects.create(
            date=date(2026, 6, 24),
            start_time=datetime(2026, 6, 24, 8, 0, tzinfo=timezone.utc),
            end_time=datetime(2026, 6, 24, 16, 0, tzinfo=timezone.utc),
            duration=8.0,
            activity_reason="Maintenance",
            is_valid=True
        )
        self.assertEqual(str(record), "2026-06-24 | Maintenance | 8.0h")


class EfficiencyServiceTestCase(TestCase):
    def setUp(self):
        # Create some test records
        ShiftRecord.objects.create(
            date=date(2026, 6, 1),
            duration=8.0,
            activity_reason="Production",
            is_valid=True
        )
        ShiftRecord.objects.create(
            date=date(2026, 6, 1),
            duration=2.0,
            activity_reason="Breakdown",
            is_valid=True
        )
        ShiftRecord.objects.create(
            date=date(2026, 6, 2),
            duration=6.0,
            activity_reason="Production",
            is_valid=True
        )
        ShiftRecord.objects.create(
            date=date(2026, 6, 2),
            duration=2.0,
            activity_reason="Unknown Failure",
            is_valid=True
        )
        # Invalid record should be ignored
        ShiftRecord.objects.create(
            date=date(2026, 6, 3),
            duration=12.0,
            activity_reason="Breakdown",
            is_valid=False
        )

    def test_calculate_overall_efficiency(self):
        res = EfficiencyService.calculate_overall_efficiency()
        # Productive hours = 8.0 + 6.0 = 14.0
        # Unproductive hours = 2.0 (Breakdown) + 2.0 (Unknown Failure) = 4.0
        # Total = 18.0
        # Efficiency = 14 / 18 * 100 = 77.78%
        self.assertEqual(res["total_hours"], 18.0)
        self.assertEqual(res["productive_hours"], 14.0)
        self.assertEqual(res["unproductive_hours"], 4.0)
        self.assertEqual(res["efficiency_score"], 77.78)

    def test_calculate_efficiency_trends(self):
        trends = EfficiencyService.calculate_efficiency_trends(granularity='daily')
        self.assertEqual(len(trends), 2)
        # June 1: Prod 8.0, Total 10.0 => 80.0%
        self.assertEqual(trends[0]["period"], "2026-06-01")
        self.assertEqual(trends[0]["efficiency_score"], 80.0)
        # June 2: Prod 6.0, Total 8.0 => 75.0%
        self.assertEqual(trends[1]["period"], "2026-06-02")
        self.assertEqual(trends[1]["efficiency_score"], 75.0)


class StreakServiceTestCase(TestCase):
    def setUp(self):
        # Create consecutive breakdown days
        # June 10, 11, 12 breakdown
        for day in [10, 11, 12]:
            ShiftRecord.objects.create(
                date=date(2026, 6, day),
                duration=4.0,
                activity_reason="Breakdown",
                is_valid=True
            )
        # June 13 maintenance (not breakdown)
        ShiftRecord.objects.create(
            date=date(2026, 6, 13),
            duration=8.0,
            activity_reason="Maintenance",
            is_valid=True
        )
        # June 14, 15 breakdown (only 2 days, doesn't meet default min_length=3)
        for day in [14, 15]:
            ShiftRecord.objects.create(
                date=date(2026, 6, day),
                duration=3.0,
                activity_reason="breakdown", # check case insensitivity
                is_valid=True
            )

    def test_detect_breakdown_streaks(self):
        streaks = StreakService.detect_breakdown_streaks(min_length=3)
        self.assertEqual(len(streaks), 1)
        self.assertEqual(streaks[0]["start_date"], "2026-06-10")
        self.assertEqual(streaks[0]["end_date"], "2026-06-12")
        self.assertEqual(streaks[0]["length"], 3)
        self.assertEqual(streaks[0]["total_hours"], 12.0)
        self.assertEqual(streaks[0]["severity"], "Medium")

        # Check with lower min_length
        all_streaks = StreakService.detect_breakdown_streaks(min_length=2)
        self.assertEqual(len(all_streaks), 2)


class CSVProcessorTestCase(TestCase):
    def test_clean_and_validate_csv(self):
        csv_data = (
            "Date,Shift Start Date/Time,Shift End Date/Time,Duration,Activity Reason\n"
            "2026-06-01,2026-06-01 08:00:00,2026-06-01 16:00:00,8.0,Production\n"
            "2026-06-01,2026-06-01 16:00:00,2026-06-01 18:00:00,,Breakdown\n"  # missing duration, recalculate
            "2026-06-02,,,5.0,Maintenance\n" # missing timestamps, use listed duration
            "2026-06-03,2026-06-03 08:00:00,2026-06-03 16:00:00,-2.0,Production\n" # negative duration, recalculate
            ",,,,Production\n" # missing critical info, exclude
            "2026-06-04,2026-06-04 12:00:00,2026-06-04 08:00:00,4.0,Breakdown\n" # end < start, invalid
        )
        file_io = io.StringIO(csv_data)
        valid_count, issue_count = CSVProcessor.clean_and_validate(file_io)
        
        # Valid records:
        # 1. 2026-06-01 Production (valid)
        # 2. 2026-06-01 Breakdown (valid, duration calculated as 2.0)
        # 3. 2026-06-02 Maintenance (valid, use listed duration 5.0)
        # 4. 2026-06-03 Production (valid, duration recalculated as 8.0)
        # Excluded records:
        # 5. Row 5: Missing date (Excluded)
        # 6. Row 6: End < start (Excluded)
        self.assertEqual(valid_count, 4)
        self.assertEqual(ShiftRecord.objects.filter(is_valid=True).count(), 4)
        
        # Issues found:
        # Row 2: MISSING_VALUE for duration, status Resolved
        # Row 3: MISSING_VALUE for timestamps, status Flagged
        # Row 4: INVALID_DURATION, status Resolved
        # Row 5: MISSING_VALUE for critical fields, status Excluded
        # Row 6: INVALID_TIMESTAMP end before start, status Excluded
        self.assertEqual(issue_count, 5)


class APIEndpointsTestCase(TestCase):
    def setUp(self):
        # Create some dummy data
        ShiftRecord.objects.create(
            date=date(2026, 6, 20),
            duration=8.0,
            activity_reason="Production",
            is_valid=True
        )

    def test_dashboard_summary(self):
        url = reverse('dashboard_summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_records", response.data)
        self.assertIn("efficiency", response.data)

    def test_filters_metadata(self):
        url = reverse('filters_metadata')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["activity_reasons"], ["Production"])

    def test_efficiency(self):
        url = reverse('efficiency')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("overall", response.data)
        self.assertIn("trends", response.data)
