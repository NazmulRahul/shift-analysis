from datetime import timedelta
from django.db.models import Sum
from ..models import ShiftRecord

class StreakService:
    @staticmethod
    def detect_breakdown_streaks(min_length=3, min_duration=0.0):
        """
        Detects consecutive days containing Breakdown activities.
        Returns a list of streaks with start date, end date, length, total hours, average daily hours, and severity.
        """
        # Fetch valid records with 'Breakdown' activity
        records = ShiftRecord.objects.filter(
            is_valid=True,
            activity_reason__iexact='Breakdown'
        ).order_by('date')

        if not records.exists():
            return []

        # Group records by date and sum durations
        daily_breakdowns = {}
        for r in records:
            daily_breakdowns[r.date] = daily_breakdowns.get(r.date, 0.0) + (r.duration or 0.0)

        # Sort dates
        sorted_dates = sorted(daily_breakdowns.keys())
        
        streaks = []
        current_streak_dates = []

        for d in sorted_dates:
            if not current_streak_dates:
                current_streak_dates.append(d)
            else:
                last_date = current_streak_dates[-1]
                # Check if this date is consecutive
                if d == last_date + timedelta(days=1):
                    current_streak_dates.append(d)
                else:
                    # End of current streak, save if it meets criteria
                    streak_data = StreakService._compile_streak_data(current_streak_dates, daily_breakdowns)
                    if streak_data:
                        streaks.append(streak_data)
                    # Start new streak
                    current_streak_dates = [d]

        # Handle the last streak
        if current_streak_dates:
            streak_data = StreakService._compile_streak_data(current_streak_dates, daily_breakdowns)
            if streak_data:
                streaks.append(streak_data)

        # Filter by configurable thresholds
        filtered_streaks = [
            s for s in streaks 
            if s['length'] >= min_length and s['total_hours'] >= min_duration
        ]

        return filtered_streaks

    @staticmethod
    def _compile_streak_data(dates, daily_breakdowns):
        length = len(dates)
        if length == 0:
            return None

        start_date = dates[0]
        end_date = dates[-1]
        
        # Calculate total hours for these days
        total_hours = sum(daily_breakdowns[d] for d in dates)
        avg_hours = total_hours / length if length > 0 else 0.0

        # Severity classification
        if length <= 2:
            severity = "Low"
        elif length <= 5:
            severity = "Medium"
        else:
            severity = "High"

        return {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "length": length,
            "total_hours": round(total_hours, 2),
            "average_hours": round(avg_hours, 2),
            "severity": severity
        }
