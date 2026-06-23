import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../api/client';
import type { FilterParams } from '../types';
import { FilterBar } from '../components/dashboard/FilterBar';
import { KPICards } from '../components/dashboard/KPICards';
import { InsightsPanel } from '../components/dashboard/InsightsPanel';
import { ShiftTimelineChart } from '../components/charts/ShiftTimelineChart';
import { ActivityDistributionChart } from '../components/charts/ActivityDistributionChart';
import { EfficiencyTrendChart } from '../components/charts/EfficiencyTrendChart';
import { BreakdownFrequencyChart } from '../components/charts/BreakdownFrequencyChart';
import { DurationHistogram } from '../components/charts/DurationHistogram';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import { RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const defaultFilters: FilterParams = {
  is_valid: 'true',
  start_date: undefined,
  end_date: undefined,
  activity_reason: undefined,
  min_duration: undefined,
  max_duration: undefined,
  weekday: undefined,
  hour_of_day: undefined,
  month: undefined
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterParams>(defaultFilters);
  const [trendGranularity, setTrendGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Query 1: Filter Metadata
  const { data: filterMetadata, isLoading: isMetaLoading } = useQuery({
    queryKey: ['filterMetadata'],
    queryFn: () => apiService.getFiltersMetadata()
  });

  // Query 2: Dashboard Summary Stats
  const { 
    data: summary, 
    isLoading: isSummaryLoading, 
    refetch: refetchSummary,
    isFetching: isSummaryFetching
  } = useQuery({
    queryKey: ['dashboardSummary', filters],
    queryFn: () => apiService.getDashboardSummary(filters)
  });

  // Query 3: Activities list for charts
  const { 
    data: activities = [], 
    isLoading: isActivitiesLoading,
    refetch: refetchActivities 
  } = useQuery({
    queryKey: ['activities', filters],
    queryFn: () => apiService.getActivities(filters)
  });

  // Query 4: Efficiency trend data
  const { 
    data: efficiencyData, 
    isLoading: isTrendLoading,
    refetch: refetchTrends
  } = useQuery({
    queryKey: ['efficiencyTrends', filters, trendGranularity],
    queryFn: () => apiService.getEfficiency(filters, trendGranularity)
  });

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleRefreshAll = () => {
    refetchSummary();
    refetchActivities();
    refetchTrends();
  };

  const isDataLoading = isMetaLoading || isSummaryLoading || isActivitiesLoading;
  const isRefreshing = isSummaryFetching;

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3 text-[var(--muted-foreground)]">
        <RefreshCw size={40} className="text-violet-500 animate-spin" />
        <p className="font-medium text-sm">Gathering plant metrics & calculating scores...</p>
      </div>
    );
  }

  // Handle empty dataset state
  const hasData = summary && summary.total_records > 0;

  return (
    <div className="p-8 space-y-8 animate-fade-in text-[var(--foreground)]">
      {/* Overview stats header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plant Performance</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Analyze shifts duration, breakdown streak clusters, and automated manager alerts
          </p>
        </div>
        
        {hasData && (
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] transition-all cursor-pointer" 
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Recalculating...' : 'Refresh Metrics'}
          </button>
        )}
      </div>

      {!hasData ? (
        <div className="p-16 text-center bg-[var(--card)] border border-[var(--border)] border-dashed rounded-2xl flex flex-col items-center justify-center max-w-2xl mx-auto space-y-4">
          <div className="p-4 bg-violet-500/10 rounded-full text-violet-500">
            <FileSpreadsheet size={48} />
          </div>
          <h3 className="text-xl font-bold">Welcome to ShiftAnalytics</h3>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            No employee shift records found in the database. Ingest a shift CSV dataset containing timestamps and activity reasons to get started.
          </p>
          <button 
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition shadow-lg shadow-violet-500/20 cursor-pointer"
          >
            Ingest First Dataset
          </button>
        </div>
      ) : (
        <>
          {/* Filters Panel */}
          {filterMetadata && (
            <FilterBar 
              filters={filters} 
              metadata={filterMetadata} 
              onChange={handleFilterChange} 
              onReset={handleResetFilters}
            />
          )}

          {/* Key Metric Summary Cards */}
          {summary && <KPICards summary={summary} />}

          {/* Visual Analytics Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              {/* Stacked Chronological Activities */}
              <ShiftTimelineChart records={activities} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Event count frequency */}
                <BreakdownFrequencyChart records={activities} />

                {/* Duration frequency distribution */}
                <DurationHistogram records={activities} />
              </div>
              
              {/* Custom Category/Date Heatmap */}
              <ActivityHeatmap records={activities} />
            </div>

            <div className="space-y-8">
              {/* Donut distribution */}
              <ActivityDistributionChart records={activities} />

              {/* Area trend */}
              <EfficiencyTrendChart 
                trends={efficiencyData?.trends || []} 
                granularity={trendGranularity}
                onGranularityChange={setTrendGranularity}
                isLoading={isTrendLoading}
              />
            </div>
          </div>

          {/* Insights Engine */}
          <InsightsPanel />
        </>
      )}
    </div>
  );
};
