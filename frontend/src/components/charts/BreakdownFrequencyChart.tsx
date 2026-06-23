import React, { useMemo, useState } from 'react';
import type { ShiftRecord } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface BreakdownFrequencyChartProps {
  records: ShiftRecord[];
}

export const BreakdownFrequencyChart: React.FC<BreakdownFrequencyChartProps> = ({ records }) => {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const chartData = useMemo(() => {
    // Filter breakdown records
    const breakdowns = records.filter(
      r => r.is_valid && r.activity_reason.toLowerCase().trim() === 'breakdown'
    );

    if (breakdowns.length === 0) return [];

    const countMap: { [period: string]: number } = {};

    breakdowns.forEach(r => {
      const dateStr = r.date;
      if (!dateStr) return;

      let key = dateStr;
      
      if (granularity === 'weekly') {
        // Group by week (start of week: Monday)
        const date = new Date(dateStr);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(date.setDate(diff));
        key = monday.toISOString().split('T')[0];
      } else if (granularity === 'monthly') {
        // Group by month: YYYY-MM
        key = dateStr.slice(0, 7);
      }

      countMap[key] = (countMap[key] || 0) + 1;
    });

    return Object.entries(countMap)
      .map(([period, count]) => ({
        period,
        count
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [records, granularity]);

  const formatPeriodLabel = (val: any) => {
    const valStr = String(val);
    if (!valStr) return '';
    if (granularity === 'monthly') {
      const parts = valStr.split('-');
      if (parts.length >= 2) {
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        return date.toLocaleDateString('default', { month: 'short', year: '2-digit' });
      }
    }
    return valStr;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] border border-[var(--border)] border-dashed rounded-2xl bg-[var(--card)] text-[var(--muted-foreground)]">
        <p className="text-sm font-medium">No breakdown occurrences recorded.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4 text-[var(--foreground)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg">Breakdown Event Frequency</h3>
          <span className="text-xs text-[var(--muted-foreground)]">Number of separate breakdown events over time</span>
        </div>

        <div className="flex items-center gap-1 bg-[var(--secondary)] p-1 rounded-xl border border-[var(--border)] self-start sm:self-auto">
          <button 
            onClick={() => setGranularity('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              granularity === 'daily' 
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Daily
          </button>
          <button 
            onClick={() => setGranularity('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              granularity === 'weekly' 
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setGranularity('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              granularity === 'monthly' 
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis 
              dataKey="period" 
              stroke="var(--muted-foreground)" 
              tickFormatter={formatPeriodLabel}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              allowDecimals={false}
              stroke="var(--muted-foreground)" 
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip 
              formatter={(value: any) => [value, 'Events']}
              labelFormatter={(label) => formatPeriodLabel(label)}
              contentStyle={{ 
                backgroundColor: 'var(--card)', 
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow)',
                fontSize: '12px'
              }} 
            />
            <Bar 
              dataKey="count" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
