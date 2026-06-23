import React, { useMemo } from 'react';
import type { ShiftRecord } from '../../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ActivityDistributionChartProps {
  records: ShiftRecord[];
}

const colorPalette = [
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#14b8a6', // Teal
];

export const ActivityDistributionChart: React.FC<ActivityDistributionChartProps> = ({ records }) => {
  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];

    const distributionMap: { [reason: string]: number } = {};
    let totalDuration = 0;

    records.forEach(r => {
      const reason = r.activity_reason || 'Unknown';
      const duration = r.duration || 0;
      distributionMap[reason] = (distributionMap[reason] || 0) + duration;
      totalDuration += duration;
    });

    if (totalDuration === 0) return [];

    return Object.entries(distributionMap)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        percentage: Number(((value / totalDuration) * 100).toFixed(1))
      }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] border border-[var(--border)] border-dashed rounded-2xl bg-[var(--card)] text-[var(--muted-foreground)]">
        <p className="text-sm font-medium">No distribution data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-lg">Activity Reason Distribution</h3>
        <span className="text-xs text-[var(--muted-foreground)]">Percentage duration of each activity category</span>
      </div>

      <div className="w-full h-[300px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: any, props: any) => [
                `${value} hrs (${props.payload.percentage}%)`, 
                name
              ]}
              contentStyle={{ 
                backgroundColor: 'var(--card)', 
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow)',
                fontSize: '12px'
              }} 
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              wrapperStyle={{ fontSize: 11, color: 'var(--foreground)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
