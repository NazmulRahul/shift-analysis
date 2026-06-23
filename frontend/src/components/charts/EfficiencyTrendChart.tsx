import React from 'react';
import type { EfficiencyTrend } from '../../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { RefreshCw } from 'lucide-react';

interface EfficiencyTrendChartProps {
  trends: EfficiencyTrend[];
  granularity: 'daily' | 'weekly' | 'monthly';
  onGranularityChange: (g: 'daily' | 'weekly' | 'monthly') => void;
  isLoading: boolean;
}

export const EfficiencyTrendChart: React.FC<EfficiencyTrendChartProps> = ({ 
  trends, 
  granularity, 
  onGranularityChange,
  isLoading
}) => {

  const formatPeriodLabel = (val: any) => {
    const valStr = String(val);
    if (!valStr) return '';
    if (granularity === 'monthly') {
      const bgParts = valStr.split('-');
      if (bgParts.length >= 2) {
        const date = new Date(parseInt(bgParts[0]), parseInt(bgParts[1]) - 1, 1);
        return date.toLocaleDateString('default', { month: 'short', year: '2-digit' });
      }
    }
    return valStr;
  };

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4 text-[var(--foreground)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg">Operational Efficiency Trend</h3>
          <span className="text-xs text-[var(--muted-foreground)]">Ratio of productive uptime over time</span>
        </div>
        
        <div className="flex items-center gap-1 bg-[var(--secondary)] p-1 rounded-xl border border-[var(--border)] self-start sm:self-auto">
          <button 
            onClick={() => onGranularityChange('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              granularity === 'daily' 
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Daily
          </button>
          <button 
            onClick={() => onGranularityChange('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              granularity === 'weekly' 
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Weekly
          </button>
          <button 
            onClick={() => onGranularityChange('monthly')}
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[300px]">
          <RefreshCw size={28} className="text-violet-500 animate-spin" />
        </div>
      ) : trends.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] border border-[var(--border)] border-dashed rounded-2xl bg-[var(--card)] text-[var(--muted-foreground)]">
          <p className="text-sm font-medium">No trend data available.</p>
        </div>
      ) : (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trends}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis 
                dataKey="period" 
                stroke="var(--muted-foreground)" 
                tickFormatter={formatPeriodLabel}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis 
                domain={[0, 100]}
                unit="%"
                stroke="var(--muted-foreground)" 
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <Tooltip 
                formatter={(value: any) => [`${value}%`, 'Efficiency']}
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
              <Area 
                type="monotone" 
                dataKey="efficiency_score" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorEff)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
