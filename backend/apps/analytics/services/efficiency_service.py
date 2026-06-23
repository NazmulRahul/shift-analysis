from django.db.models import Sum
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from ..models import ShiftRecord

class EfficiencyService:
    @staticmethod
    def calculate_overall_efficiency(queryset=None):
        """
        Calculates the overall operational efficiency score.
        Formula: (Productive Hours / Total Hours) * 100
        Productive Hours = Duration where activity is NOT 'Breakdown' or 'Unknown Failure'
        """
        if queryset is None:
            queryset = ShiftRecord.objects.filter(is_valid=True)

        unproductive_reasons = ['breakdown', 'unknown failure', 'unknown_failure', 'unknown']

        total_hours = queryset.aggregate(total=Sum('duration'))['total'] or 0.0
        
        # Productive hours = total hours minus unproductive hours
        unproductive_hours = queryset.filter(
            activity_reason__in=[r.lower() for r in unproductive_reasons]
        ).aggregate(total=Sum('duration'))['total'] or 0.0
        
        # Or filter where activity is NOT in the unproductive reasons list (case-insensitive)
        # However, to support arbitrary case sensitivity in DB cleanly, we can do:
        # productive_hours = total_hours - unproductive_hours
        # This is very clean and simple because we don't have to write complex SQL exclusions
        # which can fail on nulls or different collations.
        productive_hours = max(0.0, total_hours - unproductive_hours)

        efficiency = (productive_hours / total_hours * 100.0) if total_hours > 0 else 0.0

        return {
            "productive_hours": round(productive_hours, 2),
            "unproductive_hours": round(unproductive_hours, 2),
            "total_hours": round(total_hours, 2),
            "efficiency_score": round(efficiency, 2)
        }

    @staticmethod
    def calculate_efficiency_trends(queryset=None, granularity='daily'):
        """
        Calculates efficiency trends over time grouped by:
        - daily (TruncDate)
        - weekly (TruncWeek)
        - monthly (TruncMonth)
        """
        if queryset is None:
            queryset = ShiftRecord.objects.filter(is_valid=True)

        unproductive_reasons = ['breakdown', 'unknown failure', 'unknown_failure', 'unknown']

        # Determine grouping field
        if granularity == 'weekly':
            trunc_func = TruncWeek('date')
        elif granularity == 'monthly':
            trunc_func = TruncMonth('date')
        else:
            trunc_func = TruncDate('date')

        # Group and aggregate total hours
        grouped_records = queryset.annotate(period=trunc_func).values('period').annotate(
            total=Sum('duration')
        ).order_by('period')

        trend_data = []

        for group in grouped_records:
            period = group['period']
            if not period:
                continue

            total_h = group['total'] or 0.0
            
            # Aggregate unproductive hours for this period
            unprod_h = queryset.filter(
                date=period if granularity == 'daily' else queryset.filter(is_valid=True), # placeholder check
                activity_reason__in=[r.lower() for r in unproductive_reasons]
            )
            
            # Better way: calculate in Python using a queryset values list to avoid N+1 queries
            # Let's write a clean and fast in-memory aggregator using pandas or pure Python
            # since the dataset is typically moderate (thousands of rows).
            # This is extremely fast and robust.
            
        # Let's fetch all records for the queryset and do grouping in memory!
        # This avoids complex database-specific date functions (SQLite vs Postgres behave differently for TruncWeek/TruncMonth)
        # By doing it in Python, we ensure 100% database-agnostic behavior!
        
        all_records = list(queryset.values('date', 'duration', 'activity_reason'))
        if not all_records:
            return []

        df = pd_dataframe_from_records(all_records)
        if df.empty:
            return []

        # Standardize date column
        df['date'] = pd_to_datetime_date(df['date'])
        
        # Set grouping key
        if granularity == 'weekly':
            # Group by start of the week (Monday)
            df['period'] = df['date'].apply(lambda d: d - timedelta(days=d.weekday()))
        elif granularity == 'monthly':
            # Group by first day of month
            df['period'] = df['date'].apply(lambda d: d.replace(day=1))
        else:
            df['period'] = df['date']

        # Group by period
        unprod_set = {r.lower() for r in unproductive_reasons}
        
        grouped = df.groupby('period')
        for period, group in grouped:
            total_h = group['duration'].sum()
            unprod_mask = group['activity_reason'].str.lower().str.strip().isin(unprod_set)
            unprod_h = group.loc[unprod_mask, 'duration'].sum()
            prod_h = max(0.0, total_h - unprod_h)
            
            eff = (prod_h / total_h * 100.0) if total_h > 0 else 0.0
            
            trend_data.append({
                "period": period.strftime("%Y-%m-%d"),
                "total_hours": round(total_h, 2),
                "productive_hours": round(prod_h, 2),
                "unproductive_hours": round(unprod_h, 2),
                "efficiency_score": round(eff, 2)
            })
            
        trend_data.sort(key=lambda x: x['period'])
        return trend_data

# Helper utilities to keep dependencies clean and safe
def pd_dataframe_from_records(records):
    import pandas as pd
    return pd.DataFrame(records)

def pd_to_datetime_date(series):
    import pandas as pd
    return pd.to_datetime(series).dt.date

from datetime import timedelta
