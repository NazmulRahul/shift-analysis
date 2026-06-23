import React, { useMemo } from 'react';
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

interface DurationHistogramProps {
  records: ShiftRecord[];
}

export const DurationHistogram: React.FC<DurationHistogramProps> = ({ records }) => {
  const chartData = useMemo(() => {
    const bins = [
      { name: '< 2h', min: 0, max: 2, count: 0 },
      { name: '2-4h', min: 2, max: 4, count: 0 },
      { name: '4-6h', min: 4, max: 6, count: 0 },
      { name: '6-8h', min: 6, max: 8, count: 0 },
      { name: '8-10h', min: 8, max: 10, count: 0 },
      { name: '10-12h', min: 10, max: 12, count: 0 },
      { name: '12h+', min: 12, max: 9999, count: 0 },
    ];

    records.forEach(r => {
      const dur = r.duration;
      if (dur === null || dur === undefined || !r.is_valid) return;
      
      for (const bin of bins) {
        if (dur >= bin.min && dur < bin.max) {
          bin.count++;
          break;
        }
      }
    });

    return bins;
  }, [records]);

  const totalFilteredCount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.count, 0);
  }, [chartData]);

  if (totalFilteredCount === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] border border-[var(--border)] border-dashed rounded-2xl bg-[var(--card)] text-[var(--muted-foreground)]">
        <p className="text-sm font-medium">No duration distribution data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4 text-[var(--foreground)]">
      <div>
        <h3 className="font-bold text-lg">Duration Distribution</h3>
        <span className="text-xs text-[var(--muted-foreground)]">Frequency count of shift durations in hours</span>
      </div>

      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="var(--muted-foreground)" 
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
              formatter={(value: any) => [value, 'Shifts']}
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
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
