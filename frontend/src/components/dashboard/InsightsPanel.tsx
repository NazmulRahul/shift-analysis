import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../api/client';
import { AlertTriangle, CheckCircle, Info, Sparkles, RefreshCw } from 'lucide-react';

export const InsightsPanel: React.FC = () => {
  const { data: insights = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['insights'],
    queryFn: () => apiService.getInsights()
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-emerald-500 shrink-0" size={24} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500 shrink-0 animate-bounce" size={24} />;
      case 'danger':
        return <AlertTriangle className="text-red-500 shrink-0 animate-pulse" size={24} />;
      default:
        return <Info className="text-sky-500 shrink-0" size={24} />;
    }
  };

  const getCardClass = (type: string) => {
    const base = "p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 ";
    switch (type) {
      case 'success': return base + 'border-emerald-500/20 bg-emerald-500/5';
      case 'warning': return base + 'border-amber-500/20 bg-amber-500/5';
      case 'danger': return base + 'border-red-500/20 bg-red-500/5';
      default: return base + 'border-sky-500/20 bg-sky-500/5';
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    const base = "px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider ";
    switch (severity) {
      case 'High': return base + 'bg-red-500/10 text-red-500';
      case 'Medium': return base + 'bg-amber-500/10 text-amber-500';
      case 'Low': return base + 'bg-emerald-500/10 text-emerald-500';
      default: return base + 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-500 animate-pulse" size={22} />
          <h3 className="font-bold text-lg">Automated Operational Insights</h3>
        </div>
        <button 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer" 
          onClick={() => refetch()} 
          disabled={isLoading || isFetching}
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          <span>{isFetching ? 'Recalculating...' : 'Recalculate'}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--muted-foreground)] gap-3">
          <RefreshCw size={24} className="text-violet-500 animate-spin" />
          <p className="text-sm font-medium">Compiling shift statistics and generating recommendations...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-center flex flex-col items-center justify-center">
          <AlertTriangle size={24} className="mb-2 animate-bounce" />
          <p className="text-sm font-semibold">Failed to generate automated insights.</p>
        </div>
      ) : insights.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center text-[var(--muted-foreground)] gap-2">
          <Info size={36} className="text-sky-500 opacity-60" />
          <p className="text-sm">No operational recommendations at this time. Ingest a valid dataset to trigger the insights engine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, idx) => (
            <div key={idx} className={getCardClass(insight.type)}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <h4 className="font-bold text-base leading-snug">{insight.title}</h4>
                      <div className="mt-1">
                        <span className={getSeverityBadgeClass(insight.severity)}>{insight.severity} Severity</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed pl-9">
                  {insight.description}
                </p>
              </div>

              <div className="mt-5 pl-9">
                <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs">
                  <strong className="text-[var(--foreground)] font-bold block mb-1">Actionable Recommendation:</strong>
                  <p className="text-[var(--muted-foreground)] leading-relaxed">{insight.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
