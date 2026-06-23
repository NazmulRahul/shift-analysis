import React, { useMemo } from 'react';
import type { ShiftRecord } from '../../types';

interface ActivityHeatmapProps {
  records: ShiftRecord[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ records }) => {
  
  const { heatmapData, dates, categories } = useMemo(() => {
    if (!records || records.length === 0) {
      return { heatmapData: {}, dates: [], categories: [] };
    }

    const categoriesSet = new Set<string>();
    const datesSet = new Set<string>();
    
    // Structure: { [category]: { [date]: duration } }
    const dataMap: { [cat: string]: { [date: string]: number } } = {};

    records.forEach(r => {
      if (!r.date) return;
      const cat = r.activity_reason || 'Unknown';
      const date = r.date;
      const dur = r.duration || 0;

      categoriesSet.add(cat);
      datesSet.add(date);

      if (!dataMap[cat]) {
        dataMap[cat] = {};
      }
      dataMap[cat][date] = (dataMap[cat][date] || 0) + dur;
    });

    const categoriesList = Array.from(categoriesSet).sort();
    // Show up to the last 15 days in the heatmap grid for optimal horizontal density
    const datesList = Array.from(datesSet).sort().slice(-15);

    return { 
      heatmapData: dataMap, 
      dates: datesList, 
      categories: categoriesList 
    };
  }, [records]);

  // Compute color based on duration (capping at 8 hours)
  const getCellColor = (dur: number | undefined) => {
    if (!dur || dur <= 0) return 'bg-slate-100 dark:bg-slate-800/40 text-transparent';
    const intensity = Math.min(1, dur / 8); // 8 hours cap for max intensity
    return {
      backgroundColor: `rgba(139, 92, 246, ${intensity})`,
      color: intensity > 0.5 ? '#ffffff' : 'var(--foreground)'
    };
  };

  if (dates.length === 0 || categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[250px] border border-[var(--border)] border-dashed rounded-2xl bg-[var(--card)] text-[var(--muted-foreground)]">
        <p className="text-sm font-medium">No heatmap data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm space-y-4 text-[var(--foreground)] overflow-hidden">
      <div>
        <h3 className="font-bold text-lg">Activity Reason Heatmap</h3>
        <span className="text-xs text-[var(--muted-foreground)]">Visualizing duration intensity (capped at 8h/day) for the last 15 active days</span>
      </div>

      <div className="overflow-x-auto pt-2">
        <div className="min-w-[640px] space-y-2">
          {/* Header Row (Dates) */}
          <div className="flex items-center">
            <div className="w-32 shrink-0 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] pr-4">
              Category
            </div>
            <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
              {dates.map(date => {
                // Parse date label to short form (e.g. Jun 15)
                const d = new Date(date);
                const day = d.getDate();
                const m = d.toLocaleDateString('default', { month: 'short' });
                return (
                  <div key={date} className="text-[10px] font-bold text-center text-[var(--muted-foreground)] truncate" title={date}>
                    <span>{m}</span>
                    <span className="block text-xs font-extrabold">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Rows (Categories) */}
          <div className="space-y-1.5">
            {categories.map(cat => (
              <div key={cat} className="flex items-center">
                <div className="w-32 shrink-0 text-xs font-bold text-[var(--foreground)] truncate pr-4" title={cat}>
                  {cat}
                </div>
                <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
                  {dates.map(date => {
                    const duration = heatmapData[cat]?.[date] || 0;
                    const style = getCellColor(duration);
                    const isBgString = typeof style === 'string';

                    return (
                      <div 
                        key={date}
                        className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-bold transition-all duration-200 ${isBgString ? style : ''}`}
                        style={!isBgString ? style : undefined}
                        title={`${cat} on ${date}: ${duration.toFixed(2)} hours`}
                      >
                        {duration > 0 ? `${duration.toFixed(0)}h` : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend indicator */}
          <div className="flex items-center justify-end gap-3 text-[10px] text-[var(--muted-foreground)] pt-4 border-t border-[var(--border)] mt-2">
            <span>Downtime Intensity:</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800/40 border border-[var(--border)]"></span>
              <span>0h</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-violet-500/25"></span>
              <span>&lt; 2h</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-violet-500/60"></span>
              <span>4h</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-violet-500"></span>
              <span>8h+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
