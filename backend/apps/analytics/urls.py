from django.urls import path
from .views import (
    UploadCSVView,
    DashboardSummaryView,
    FiltersMetadataView,
    ActivitiesView,
    EfficiencyView,
    BreakdownStreaksView,
    InsightsView,
    DataQualityView
)

urlpatterns = [
    path('upload/', UploadCSVView.as_view(), name='upload_csv'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('filters/', FiltersMetadataView.as_view(), name='filters_metadata'),
    path('activities/', ActivitiesView.as_view(), name='activities'),
    path('efficiency/', EfficiencyView.as_view(), name='efficiency'),
    path('streaks/', BreakdownStreaksView.as_view(), name='streaks'),
    path('insights/', InsightsView.as_view(), name='insights'),
    path('data-quality/', DataQualityView.as_view(), name='data_quality'),
]
