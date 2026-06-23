import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../api/client';
import { Flame, AlertTriangle, RefreshCw, Sliders, Calendar } from 'lucide-react';

export const BreakdownStreaks: React.FC = () => {
  const [minLength, setMinLength] = useState<number>(3);
  const [minDuration, setMinDuration] = useState<number>(0);

  const { data: streaks = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['breakdownStreaks', minLength, minDuration],
    queryFn: () => apiService.getBreakdownStreaks(minLength, minDuration)
  });

  const getSeverityBadgeClass = (severity: 'Low' | 'Medium' | 'High') => {
    const base = "px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ";
    switch (severity) {
      case 'High': return base + 'bg-red-500/10 text-red-500';
      case 'Medium': return base + 'bg-amber-500/10 text-amber-500';
      case 'Low': return base + 'bg-emerald-500/10 text-emerald-500';
      default: return base + 'bg-slate-500/10 text-slate-500';
    }
  };

  const getSeverityCardBorder = (severity: 'Low' | 'Medium' | 'High') => {
    switch (severity) {
      case 'High': return 'border-red-500/30 bg-red-500/5';
      case 'Medium': return 'border-amber-500/30 bg-amber-500/5';
      case 'Low': return 'border-emerald-500/30 bg-emerald-500/5';
      default: return 'border-[var(--border)] bg-[var(--card)]';
    }
  };

  const getSeverityIconColor = (severity: 'Low' | 'Medium' | 'High') => {
    switch (severity) {
      case 'High': return 'text-red-500 animate-pulse';
      case 'Medium': return 'text-amber-500';
      case 'Low': return 'text-emerald-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in text-[var(--foreground)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Breakdown Streak Analysis</h2>
          <p className="text-[var(--muted-foreground)] mt-2">
            Track and identify consecutive days of machine breakdowns. Systemic breakdown streaks indicate recurring issues requiring scheduled plant maintenance.
          </p>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] transition-all cursor-pointer" 
          onClick={() => refetch()} 
          disabled={isFetching}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Refreshing...' : 'Refresh Streaks'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Control Column */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
              <Sliders size={20} className="text-violet-500" />
              <h3 className="font-bold text-lg">Threshold Settings</h3>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="min-streak-days" className="flex justify-between text-sm font-semibold">
                <span className="text-[var(--muted-foreground)]">Minimum Streak Length:</span>
                <span className="text-violet-500">{minLength} Days</span>
              </label>
              <input 
                id="min-streak-days"
                type="range" 
                min="1" 
                max="10" 
                value={minLength} 
                onChange={(e) => setMinLength(parseInt(e.target.value))}
                className="w-full h-2 bg-[var(--secondary)] rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-xs text-[var(--muted-foreground)] block">Consecutive days with Breakdown events</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="min-streak-hours" className="flex justify-between text-sm font-semibold">
                <span className="text-[var(--muted-foreground)]">Minimum Cumulative Duration:</span>
                <span className="text-violet-500">{minDuration} Hours</span>
              </label>
              <input 
                id="min-streak-hours"
                type="range" 
                min="0" 
                max="48" 
                step="2"
                value={minDuration} 
                onChange={(e) => setMinDuration(parseFloat(e.target.value))}
                className="w-full h-2 bg-[var(--secondary)] rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-xs text-[var(--muted-foreground)] block">Ignore streaks below this cumulative breakdown hour count</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-4 shadow-sm text-center">
            <h3 className="font-bold text-sm text-[var(--muted-foreground)] uppercase tracking-wider">Active Streaks Filtered</h3>
            <div className="py-4">
              <span className="text-5xl font-extrabold text-violet-500">{streaks.length}</span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              {streaks.length > 0 
                ? `Identified ${streaks.length} separate periods of prolonged daily failures matching the current filters.` 
                : 'No recurring breakdown periods matching the current criteria were detected.'}
            </p>
          </div>
        </div>

        {/* Right Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--muted-foreground)] gap-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
              <RefreshCw size={36} className="text-violet-500 animate-spin" />
              <p className="font-medium">Analyzing timeline for breakdown patterns...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-[var(--card)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center">
              <AlertTriangle size={36} className="text-red-500 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold">Failed to Query Streaks</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">An error occurred when retrieving breakdown streaks from the service.</p>
            </div>
          ) : streaks.length === 0 ? (
            <div className="p-12 text-center bg-[var(--card)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center">
              <Flame size={48} className="text-[var(--muted-foreground)] opacity-40 mb-4" />
              <h3 className="text-lg font-bold">No Breakdown Streaks Detected</h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-sm mt-1">
                No sequences of consecutive days meet your current settings threshold. Adjust settings to look for shorter sequences.
              </p>
            </div>
          ) : (
            <>
              {/* Visual Timeline cards */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg tracking-tight">Detected Streak Chronology</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {streaks.map((streak, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${getSeverityCardBorder(streak.severity)}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <Flame className={getSeverityIconColor(streak.severity)} size={20} />
                          <span>Streak #{idx + 1}</span>
                        </div>
                        <span className={getSeverityBadgeClass(streak.severity)}>{streak.severity} Severity</span>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={15} className="text-[var(--muted-foreground)]" />
                          <span className="font-medium">{streak.start_date}</span>
                          <span className="text-[var(--muted-foreground)]">to</span>
                          <span className="font-medium">{streak.end_date}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                          <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]/50">
                            <span className="text-[var(--muted-foreground)] block">Streak Length</span>
                            <strong className="text-sm block mt-0.5">{streak.length} consecutive days</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]/50">
                            <span className="text-[var(--muted-foreground)] block">Total Downtime</span>
                            <strong className="text-sm block mt-0.5">{streak.total_hours} hrs ({streak.average_hours}h/day)</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border)]">
                  <h3 className="font-bold text-lg">Detailed Streak Log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--secondary)] border-b border-[var(--border)]">
                        <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Start Date</th>
                        <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">End Date</th>
                        <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Duration (Days)</th>
                        <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Cumulative Downtime</th>
                        <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Daily Average</th>
                        <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] w-32">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {streaks.map((streak, idx) => (
                        <tr key={idx} className="border-b border-[var(--border)] hover:bg-[var(--secondary)]/40 transition-colors">
                          <td className="py-4.5 px-6 text-sm font-semibold">{streak.start_date}</td>
                          <td className="py-4.5 px-6 text-sm font-semibold">{streak.end_date}</td>
                          <td className="py-4.5 px-6 text-sm">{streak.length} Days</td>
                          <td className="py-4.5 px-6 text-sm">{streak.total_hours} Hours</td>
                          <td className="py-4.5 px-6 text-sm">{streak.average_hours} Hours</td>
                          <td className="py-4.5 px-6">
                            <span className={getSeverityBadgeClass(streak.severity)}>
                              {streak.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
