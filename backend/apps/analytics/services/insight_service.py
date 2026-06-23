from datetime import datetime
from django.db.models import Sum
from ..models import ShiftRecord
from .streak_service import StreakService
from .efficiency_service import EfficiencyService

class InsightService:
    @staticmethod
    def generate_insights():
        """
        Generates data-driven operational insights based on the current valid dataset.
        Returns a list of dictionaries with title, description, recommendation, type, and severity.
        """
        insights = []
        valid_records = ShiftRecord.objects.filter(is_valid=True)
        
        if not valid_records.exists():
            return [
                {
                    "title": "No Data Available",
                    "description": "Please upload a CSV dataset to generate operational insights.",
                    "recommendation": "Upload a shift activity CSV on the upload page.",
                    "type": "info",
                    "severity": "Low"
                }
            ]

        # 1. Analyze Breakdowns by Shift Type (Night, Day, Afternoon)
        shift_insights = InsightService._analyze_shift_breakdowns(valid_records)
        if shift_insights:
            insights.append(shift_insights)

        # 2. Analyze Weekday vs Weekend Efficiency
        weekend_insights = InsightService._analyze_weekend_efficiency(valid_records)
        if weekend_insights:
            insights.append(weekend_insights)

        # 3. Analyze Breakdown Streaks
        streak_insights = InsightService._analyze_breakdown_streaks()
        if streak_insights:
            insights.append(streak_insights)
            
        # 4. General Efficiency Status
        general_insights = InsightService._analyze_general_efficiency(valid_records)
        if general_insights:
            insights.append(general_insights)

        return insights

    @staticmethod
    def _analyze_shift_breakdowns(queryset):
        # Filter breakdown records that have start_time
        breakdowns = queryset.filter(
            activity_reason__iexact='Breakdown',
            start_time__isnull=False
        )
        
        if not breakdowns.exists():
            return None

        # Classify by start hour
        night_hours = 0.0
        day_hours = 0.0
        afternoon_hours = 0.0

        for r in breakdowns:
            hour = r.start_time.hour
            dur = r.duration or 0.0
            if hour >= 22 or hour < 6:
                night_hours += dur
            elif hour >= 6 and hour < 14:
                day_hours += dur
            else:
                afternoon_hours += dur

        totals = {
            "Night Shift (22:00 - 06:00)": night_hours,
            "Day Shift (06:00 - 14:00)": day_hours,
            "Afternoon Shift (14:00 - 22:00)": afternoon_hours
        }

        max_shift = max(totals, key=totals.get)
        max_duration = totals[max_shift]

        if max_duration > 0:
            total_breakdowns = sum(totals.values())
            pct = (max_duration / total_breakdowns * 100.0) if total_breakdowns > 0 else 0.0
            
            # Check if this is the Night Shift
            if max_shift.startswith("Night"):
                return {
                    "title": "High Night-Shift Breakdowns Detected",
                    "description": f"Breakdowns are heavily concentrated during the night shift, accounting for {pct:.1f}% ({max_duration:.1f} hours) of all breakdown time.",
                    "recommendation": "Perform preventive inspection on machinery before the night shift starts and ensure experienced maintenance crews are scheduled for night coverage.",
                    "type": "warning",
                    "severity": "High" if pct > 50 else "Medium"
                }
            else:
                return {
                    "title": f"Highest Breakdowns in {max_shift.split(' ')[0]}",
                    "description": f"The {max_shift.split(' ')[0]} has the highest cumulative breakdown duration of {max_duration:.1f} hours ({pct:.1f}% of total).",
                    "recommendation": f"Schedule targeted equipment servicing during off-hours or preceding shifts to reduce failures in the {max_shift.split(' ')[0]}.",
                    "type": "warning",
                    "severity": "Medium"
                }
        return None

    @staticmethod
    def _analyze_weekend_efficiency(queryset):
        # Calculate weekday and weekend records
        weekday_records = queryset.filter(date__week_day__in=[2, 3, 4, 5, 6]) # Django week_day: 1=Sunday, 2=Monday, ..., 7=Saturday
        weekend_records = queryset.filter(date__week_day__in=[1, 7])

        if not weekday_records.exists() or not weekend_records.exists():
            return None

        weekday_eff = EfficiencyService.calculate_overall_efficiency(weekday_records)['efficiency_score']
        weekend_eff = EfficiencyService.calculate_overall_efficiency(weekend_records)['efficiency_score']

        diff = weekday_eff - weekend_eff

        if diff >= 5.0:
            return {
                "title": "Weekend Operational Efficiency Drop",
                "description": f"Operational efficiency drops significantly on weekends to {weekend_eff:.1f}%, compared to {weekday_eff:.1f}% on weekdays (a drop of {diff:.1f}%).",
                "recommendation": "Review weekend staffing levels and ensure that technical support/maintenance personnel are adequately scheduled over the weekend.",
                "type": "danger",
                "severity": "High" if diff >= 15.0 else "Medium"
            }
        elif diff < -5.0:
            return {
                "title": "Strong Weekend Efficiency Performance",
                "description": f"Weekend operational efficiency ({weekend_eff:.1f}%) exceeds weekday performance ({weekday_eff:.1f}%) by {abs(diff):.1f}%.",
                "recommendation": "Analyze weekend operating practices, smaller team dynamics, or scheduling patterns to replicate these efficiencies on weekdays.",
                "type": "success",
                "severity": "Medium"
            }
        return None

    @staticmethod
    def _analyze_breakdown_streaks():
        # Detect streaks of length >= 3
        streaks = StreakService.detect_breakdown_streaks(min_length=3)
        if not streaks:
            return None

        # Find the longest streak or highest severity
        longest_streak = max(streaks, key=lambda x: x['length'])
        
        return {
            "title": "Repeated Breakdown Streak Detected",
            "description": f"A severe breakdown streak of {longest_streak['length']} consecutive days was detected from {longest_streak['start_date']} to {longest_streak['end_date']}, totaling {longest_streak['total_hours']} breakdown hours.",
            "recommendation": "Investigate root cause of repeated daily failures during this period. Perform comprehensive preventive maintenance on affected machinery lines.",
            "type": "danger",
            "severity": "High" if longest_streak['length'] >= 5 else "Medium"
        }

    @staticmethod
    def _analyze_general_efficiency(queryset):
        eff_data = EfficiencyService.calculate_overall_efficiency(queryset)
        score = eff_data['efficiency_score']
        
        if score < 70.0:
            return {
                "title": "Critical Efficiency Alert",
                "description": f"Overall operational efficiency is currently at {score:.1f}%, which is below the standard target of 85.0%. Unproductive hours total {eff_data['unproductive_hours']:.1f} hours.",
                "recommendation": "Initiate a plant-wide operational review to audit machinery downtime reasons and identify bottlenecks.",
                "type": "danger",
                "severity": "High"
            }
        elif score >= 85.0:
            return {
                "title": "Excellent Operational Efficiency",
                "description": f"Overall operational efficiency is running at a healthy {score:.1f}%, meeting or exceeding the target threshold.",
                "recommendation": "Maintain the current preventive maintenance cycles and commend operators for efficient shift handovers.",
                "type": "success",
                "severity": "Low"
            }
        return None
