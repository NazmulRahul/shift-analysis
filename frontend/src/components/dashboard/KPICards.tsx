import React from 'react';
import type { DashboardSummary } from '../../types';
import { FileSpreadsheet, CheckCircle, ShieldAlert, Flame, Clock } from 'lucide-react';

interface KPICardsProps {
  summary: DashboardSummary;
}

export const KPICards: React.FC<KPICardsProps> = ({ summary }) => {
  const { efficiency } = summary;
  
  // Circle progress calculations for circular gauge
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (efficiency.efficiency_score / 100) * circumference;

  const getEfficiencyColor = (score: number) => {
    if (score >= 85) return '#10b981'; // Green
    if (score >= 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 text-[var(--foreground)]">
      {/* 1. Operational Efficiency Gauge Card */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col md:flex-row items-center gap-4 overflow-hidden">
        <div className="relative shrink-0 w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform" viewBox="0 0 120 120">
            {/* Background Circle */}
            <circle 
              className="text-slate-200 dark:text-slate-700"
              cx="60" 
              cy="60" 
              r={radius} 
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Foreground Progress */}
            <circle 
              className="transition-all duration-500 ease-out"
              cx="60" 
              cy="60" 
              r={radius} 
              strokeWidth="10"
              stroke={getEfficiencyColor(efficiency.efficiency_score)}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-extrabold">{efficiency.efficiency_score}%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted-foreground)]">Score</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 space-y-1.5 text-center md:text-left">
          <h3 className="font-bold text-sm text-[var(--muted-foreground)] uppercase tracking-wider leading-tight">Efficiency Score</h3>
          <div className="flex flex-col gap-1 items-center md:items-start text-xs pt-1">
            <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <Clock size={12} className="shrink-0" />
              <span>Prod: <strong>{efficiency.productive_hours}h</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-red-500 font-semibold">
              <Clock size={12} className="shrink-0" />
              <span>Downtime: <strong>{efficiency.unproductive_hours}h</strong></span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] pt-1 leading-snug">Ratio of productive hours to total shift hours</p>
        </div>
      </div>

      {/* 2. Total Records */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
            <FileSpreadsheet size={24} />
          </div>
          <span className="text-3xl font-extrabold">{summary.total_records.toLocaleString()}</span>
        </div>
        <div className="mt-4">
          <h3 className="font-bold text-sm text-[var(--muted-foreground)] uppercase tracking-wider">Total Shift Records</h3>
          <div className="flex gap-2 text-xs font-semibold mt-1">
            <span className="text-emerald-500">{summary.valid_records.toLocaleString()} Valid</span>
            <span className="text-[var(--border)]">|</span>
            <span className="text-red-500">{summary.invalid_records.toLocaleString()} Flagged</span>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-2">Parsed lines from ingested dataset</p>
        </div>
      </div>

      {/* 3. Data Quality Issues */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${summary.dq_issues_count > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            {summary.dq_issues_count > 0 ? (
              <ShieldAlert size={24} />
            ) : (
              <CheckCircle size={24} />
            )}
          </div>
          <span className="text-3xl font-extrabold">{summary.dq_issues_count.toLocaleString()}</span>
        </div>
        <div className="mt-4">
          <h3 className="font-bold text-sm text-[var(--muted-foreground)] uppercase tracking-wider">Integrity Flags</h3>
          <p className="text-xs font-semibold mt-1">
            {summary.dq_issues_count > 0 
              ? `${summary.dq_issues_count} rows containing inconsistencies` 
              : 'Zero formatting issues detected'}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-2">Overlaps, duplicates, or empty fields</p>
        </div>
      </div>

      {/* 4. Active Streaks */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${summary.streak_count > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Flame className={summary.streak_count > 0 ? 'animate-pulse' : ''} size={24} />
          </div>
          <span className="text-3xl font-extrabold">{summary.streak_count.toLocaleString()}</span>
        </div>
        <div className="mt-4">
          <h3 className="font-bold text-sm text-[var(--muted-foreground)] uppercase tracking-wider">Breakdown Streaks</h3>
          <p className="text-xs font-semibold text-red-500 mt-1">
            {summary.streak_count > 0 
              ? `${summary.streak_count} consecutive periods active` 
              : 'No prolonged breakdown streak active'}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-2">Recurring breakdown day clusters</p>
        </div>
      </div>
    </div>
  );
};
