import React, { useMemo } from 'react';
import type { ShiftRecord } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Brush
} from 'recharts';

interface ShiftTimelineChartProps {
  records: ShiftRecord[];
}

const colorPalette = [
  '#8b5cf6', // Violet/Purple
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber/Yellow
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#14b8a6', // Teal
];

export const ShiftTimelineChart: React.FC<ShiftTimelineChartProps> = ({ records }) => {
  
  // Format data for the stacked bar chart: group by Date
  const { chartData, categories } = useMemo(() => {
    if (!records || records.length === 0) {
      return { chartData: [], categories: [] };
    }

    const groupMap: { [date: string]: { [reason: string]: number } } = {};
    const reasonSet = new Set<string>();

    records.forEach(r => {
      if (!r.date) return;
      
      const reason = r.activity_reason || 'Unknown';
      reasonSet.add(reason);

      if (!groupMap[r.date]) {
        groupMap[r.date] = {};
      }
      
      groupMap[r.date][reason] = (groupMap[r.date][reason] || 0) + (r.duration || 0);
    });

    const categoriesList = Array.from(reasonSet).sort();

    const formattedData = Object.entries(groupMap)
      .map(([date, reasons]) => {
        const item: any = { date };
        categoriesList.forEach(reason => {
          item[reason] = Number(reasons[reason]?.toFixed(2) || 0);
        });
        return item;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return { chartData: formattedData, categories: categoriesList };
  }, [records]);

  // Map category reasons to stable colors
  const categoryColorMap = useMemo(() => {
    const mapping: { [reason: string]: string } = {};
    categories.forEach((cat, idx) => {
      mapping[cat] = colorPalette[idx % colorPalette.length];
    });
    return mapping;
  }, [categories]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] border border-[var(--border)] border-dashed rounded-2xl bg-[var(--card)] text-[var(--muted-foreground)]">
        <p className="text-sm font-medium">No shift activity data matches current query criteria.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-lg">Shift Activity Cumulative Timeline</h3>
        <span className="text-xs text-[var(--muted-foreground)]">Stacking activity hours chronologically per day</span>
      </div>
      
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="var(--muted-foreground)" 
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              stroke="var(--muted-foreground)" 
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <Tooltip 
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
              verticalAlign="top" 
              height={36} 
              wrapperStyle={{ fontSize: 12, color: 'var(--foreground)' }}
            />
            
            {/* Render stacked bars dynamically based on categories */}
            {categories.map((cat) => (
              <Bar 
                key={cat} 
                dataKey={cat} 
                stackId="a" 
                fill={categoryColorMap[cat]} 
                radius={[0, 0, 0, 0]}
              />
            ))}

            {/* Brush adds scroll and zoom capabilities to timeline */}
            {chartData.length > 7 && (
              <Brush 
                dataKey="date" 
                height={20} 
                stroke="#8b5cf6"
                fill="var(--card)"
                tickFormatter={() => ''}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
