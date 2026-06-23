from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Min, Max

from .models import ShiftRecord, DataQualityIssue
from .serializers import ShiftRecordSerializer, DataQualityIssueSerializer
from .services.cleaner import CSVProcessor
from .services.streak_service import StreakService
from .services.efficiency_service import EfficiencyService
from .services.insight_service import InsightService

def get_filtered_queryset(request):
    """
    Utility to apply common filters to the ShiftRecord queryset.
    """
    is_valid_param = request.query_params.get('is_valid')
    if is_valid_param == 'false':
        queryset = ShiftRecord.objects.filter(is_valid=False)
    elif is_valid_param == 'all':
        queryset = ShiftRecord.objects.all()
    else:
        queryset = ShiftRecord.objects.filter(is_valid=True)
    
    # Filter by Date range
    start_date = request.query_params.get('start_date')
    if start_date:
        queryset = queryset.filter(date__gte=start_date)
        
    end_date = request.query_params.get('end_date')
    if end_date:
        queryset = queryset.filter(date__lte=end_date)
        
    # Filter by Activity Reasons (multi-select)
    activity_reasons = request.query_params.getlist('activity_reason')
    if activity_reasons:
        queryset = queryset.filter(activity_reason__in=activity_reasons)
        
    # Filter by Duration range
    min_duration = request.query_params.get('min_duration')
    if min_duration:
        queryset = queryset.filter(duration__gte=float(min_duration))
        
    max_duration = request.query_params.get('max_duration')
    if max_duration:
        queryset = queryset.filter(duration__lte=float(max_duration))
        
    # Filter by Weekday (0-6 mapping: 0=Mon, 1=Tue... 6=Sun)
    weekday = request.query_params.get('weekday')
    if weekday is not None:
        try:
            val = int(weekday)
            django_day = (val + 1) % 7 + 1  # Map 0->2, 1->3... 5->7, 6->1
            queryset = queryset.filter(date__week_day=django_day)
        except ValueError:
            pass
            
    # Filter by Hour of Day
    hour = request.query_params.get('hour_of_day')
    if hour is not None:
        try:
            queryset = queryset.filter(start_time__hour=int(hour))
        except ValueError:
            pass

    # Filter by Month
    month = request.query_params.get('month')
    if month is not None:
        try:
            queryset = queryset.filter(date__month=int(month))
        except ValueError:
            pass

    return queryset


class UploadCSVView(APIView):
    def post(self, request, format=None):
        if 'file' not in request.FILES:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        file_obj = request.FILES['file']
        if not file_obj.name.endswith('.csv'):
            return Response({"error": "Only CSV files are supported"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            valid_count, issue_count = CSVProcessor.clean_and_validate(file_obj)
            total_records = ShiftRecord.objects.count()
            return Response({
                "message": "Dataset uploaded and processed successfully",
                "total_records": total_records,
                "valid_records": valid_count,
                "invalid_records": total_records - valid_count,
                "issues_found": issue_count
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardSummaryView(APIView):
    def get(self, request, format=None):
        queryset = get_filtered_queryset(request)
        
        # Calculate efficiency
        eff_summary = EfficiencyService.calculate_overall_efficiency(queryset)
        
        # Count records
        total_records = ShiftRecord.objects.count()
        valid_records_count = ShiftRecord.objects.filter(is_valid=True).count()
        invalid_records_count = total_records - valid_records_count
        
        # Data Quality issues count
        dq_issues_count = DataQualityIssue.objects.count()
        
        # Streak count
        min_length = int(request.query_params.get('min_length', 3))
        streaks = StreakService.detect_breakdown_streaks(min_length=min_length)
        streak_count = len(streaks)

        return Response({
            "total_records": total_records,
            "valid_records": valid_records_count,
            "invalid_records": invalid_records_count,
            "dq_issues_count": dq_issues_count,
            "streak_count": streak_count,
            "efficiency": eff_summary
        })


class FiltersMetadataView(APIView):
    def get(self, request, format=None):
        # Fetch metadata from all records to build dynamic filter inputs
        records = ShiftRecord.objects.all()
        if not records.exists():
            return Response({
                "min_date": None,
                "max_date": None,
                "activity_reasons": [],
                "min_duration": 0,
                "max_duration": 24
            })

        aggregates = records.aggregate(
            min_date=Min('date'),
            max_date=Max('date'),
            min_dur=Min('duration'),
            max_dur=Max('duration')
        )
        
        reasons = list(records.values_list('activity_reason', flat=True).distinct())

        return Response({
            "min_date": aggregates['min_date'],
            "max_date": aggregates['max_date'],
            "activity_reasons": sorted(reasons),
            "min_duration": aggregates['min_dur'] or 0.0,
            "max_duration": aggregates['max_dur'] or 24.0
        })


class ActivitiesView(APIView):
    def get(self, request, format=None):
        queryset = get_filtered_queryset(request)
        serializer = ShiftRecordSerializer(queryset, many=True)
        return Response(serializer.data)


class EfficiencyView(APIView):
    def get(self, request, format=None):
        queryset = get_filtered_queryset(request)
        granularity = request.query_params.get('granularity', 'daily')
        
        overall = EfficiencyService.calculate_overall_efficiency(queryset)
        trends = EfficiencyService.calculate_efficiency_trends(queryset, granularity=granularity)
        
        return Response({
            "overall": overall,
            "trends": trends
        })


class BreakdownStreaksView(APIView):
    def get(self, request, format=None):
        try:
            min_length = int(request.query_params.get('min_length', 3))
            min_duration = float(request.query_params.get('min_duration', 0.0))
        except ValueError:
            min_length = 3
            min_duration = 0.0
            
        streaks = StreakService.detect_breakdown_streaks(min_length=min_length, min_duration=min_duration)
        return Response(streaks)


class InsightsView(APIView):
    def get(self, request, format=None):
        insights = InsightService.generate_insights()
        return Response(insights)


class DataQualityView(APIView):
    def get(self, request, format=None):
        issues = DataQualityIssue.objects.all()
        serializer = DataQualityIssueSerializer(issues, many=True)
        
        # Summary counts
        total_records = ShiftRecord.objects.count()
        valid_records = ShiftRecord.objects.filter(is_valid=True).count()
        
        missing_count = issues.filter(issue_type="MISSING_VALUE").count()
        invalid_dur_count = issues.filter(issue_type="INVALID_DURATION").count()
        timestamp_err_count = issues.filter(issue_type="INVALID_TIMESTAMP").count()
        duplicate_count = issues.filter(issue_type="DUPLICATE").count()
        overlap_count = issues.filter(issue_type="TIMESTAMP_OVERLAP").count()

        return Response({
            "summary": {
                "total_records": total_records,
                "valid_records": valid_records,
                "invalid_records": total_records - valid_records,
                "missing_values": missing_count,
                "invalid_durations": invalid_dur_count,
                "timestamp_errors": timestamp_err_count + overlap_count,
                "duplicate_records": duplicate_count,
            },
            "issues": serializer.data
        })
