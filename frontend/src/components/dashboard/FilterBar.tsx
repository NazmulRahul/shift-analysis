import React, { useState } from 'react';
import type { FilterParams, FilterMetadata } from '../../types';
import { SlidersHorizontal, RotateCcw, Calendar, Clock, Activity } from 'lucide-react';

interface FilterBarProps {
  filters: FilterParams;
  metadata: FilterMetadata;
  onChange: (filters: FilterParams) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, metadata, onChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleDateChange = (type: 'start_date' | 'end_date', value: string) => {
    onChange({ ...filters, [type]: value || undefined });
  };

  const handleReasonToggle = (reason: string) => {
    const activeReasons = filters.activity_reason || [];
    let newReasons: string[];
    if (activeReasons.includes(reason)) {
      newReasons = activeReasons.filter(r => r !== reason);
    } else {
      newReasons = [...activeReasons, reason];
    }
    onChange({ ...filters, activity_reason: newReasons.length > 0 ? newReasons : undefined });
  };

  const handleSelectAllReasons = () => {
    if (filters.activity_reason && filters.activity_reason.length === metadata.activity_reasons.length) {
      onChange({ ...filters, activity_reason: undefined });
    } else {
      onChange({ ...filters, activity_reason: [...metadata.activity_reasons] });
    }
  };

  const handleNumberChange = (field: keyof FilterParams, value: string) => {
    const num = value === '' ? undefined : parseFloat(value);
    onChange({ ...filters, [field]: num });
  };

  const handleSelectChange = (field: keyof FilterParams, value: string) => {
    const val = value === '' ? undefined : parseInt(value);
    onChange({ ...filters, [field]: val });
  };

  const handleValidityToggle = (type: 'true' | 'false' | 'all') => {
    onChange({ ...filters, is_valid: type });
  };

  const weekdays = [
    { label: 'Monday', value: 0 },
    { label: 'Tuesday', value: 1 },
    { label: 'Wednesday', value: 2 },
    { label: 'Thursday', value: 3 },
    { label: 'Friday', value: 4 },
    { label: 'Saturday', value: 5 },
    { label: 'Sunday', value: 6 }
  ];

  const months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
  ];

  return (
    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div 
        className="flex items-center justify-between cursor-pointer select-none" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal size={18} className="text-violet-500" />
          <h3 className="font-bold text-lg">Interactive Query Filters</h3>
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] transition-all cursor-pointer" 
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            title="Reset all filters"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
          <span className={`text-[var(--muted-foreground)] text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-[var(--border)] mt-4 animate-slide-down">
          {/* Section 1: Dates */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <Calendar size={14} className="text-violet-500" />
              <span>Date Range</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="filter-start-date" className="text-xs font-semibold text-[var(--muted-foreground)]">Start Date</label>
                <input 
                  id="filter-start-date"
                  type="date" 
                  value={filters.start_date || ''} 
                  min={metadata.min_date || undefined}
                  max={metadata.max_date || undefined}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="filter-end-date" className="text-xs font-semibold text-[var(--muted-foreground)]">End Date</label>
                <input 
                  id="filter-end-date"
                  type="date" 
                  value={filters.end_date || ''} 
                  min={metadata.min_date || undefined}
                  max={metadata.max_date || undefined}
                  onChange={(e) => handleDateChange('end_date', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Duration & Timing */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <Clock size={14} className="text-violet-500" />
              <span>Duration & Timing</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="filter-min-duration" className="text-xs font-semibold text-[var(--muted-foreground)] truncate block">Min (hrs)</label>
                <input 
                  id="filter-min-duration"
                  type="number" 
                  step="0.5"
                  min={metadata.min_duration}
                  max={metadata.max_duration}
                  placeholder={String(metadata.min_duration)}
                  value={filters.min_duration !== undefined ? filters.min_duration : ''}
                  onChange={(e) => handleNumberChange('min_duration', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="filter-max-duration" className="text-xs font-semibold text-[var(--muted-foreground)] truncate block">Max (hrs)</label>
                <input 
                  id="filter-max-duration"
                  type="number" 
                  step="0.5"
                  min={metadata.min_duration}
                  max={metadata.max_duration}
                  placeholder={String(metadata.max_duration)}
                  value={filters.max_duration !== undefined ? filters.max_duration : ''}
                  onChange={(e) => handleNumberChange('max_duration', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="filter-hour-of-day" className="text-xs font-semibold text-[var(--muted-foreground)] truncate block">Hour (0-23)</label>
                <input 
                  id="filter-hour-of-day"
                  type="number" 
                  min="0" 
                  max="23"
                  placeholder="Hour"
                  value={filters.hour_of_day !== undefined ? filters.hour_of_day : ''}
                  onChange={(e) => handleNumberChange('hour_of_day', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="filter-weekday" className="text-xs font-semibold text-[var(--muted-foreground)] block">Weekday</label>
                <select 
                  id="filter-weekday"
                  value={filters.weekday !== undefined ? filters.weekday : ''} 
                  onChange={(e) => handleSelectChange('weekday', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <option value="">Any</option>
                  {weekdays.map(d => (
                    <option key={d.value} value={d.value}>{d.label.slice(0, 3)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <label htmlFor="filter-month" className="text-xs font-semibold text-[var(--muted-foreground)] block">Month</label>
                <select 
                  id="filter-month"
                  value={filters.month !== undefined ? filters.month : ''} 
                  onChange={(e) => handleSelectChange('month', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  <option value="">Any</option>
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label.slice(0, 3)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Data Quality segmented controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <span>Record Integrity</span>
            </div>
            <div className="flex flex-col gap-2 h-full justify-center">
              <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] p-1 bg-[var(--secondary)] w-full">
                <button 
                  type="button" 
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                    filters.is_valid === 'true' || !filters.is_valid
                      ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' 
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                  onClick={() => handleValidityToggle('true')}
                >
                  Valid Records Only (Clean)
                </button>
                <button 
                  type="button" 
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                    filters.is_valid === 'false' 
                      ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' 
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                  onClick={() => handleValidityToggle('false')}
                >
                  Invalid Records Only
                </button>
                <button 
                  type="button" 
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                    filters.is_valid === 'all' 
                      ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' 
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                  onClick={() => handleValidityToggle('all')}
                >
                  All Records (Merged)
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Activity Categories (Full width) */}
          <div className="md:col-span-2 lg:col-span-4 space-y-4 border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                <Activity size={14} className="text-violet-500" />
                <span>Activity Reason Filter</span>
              </div>
              <button 
                type="button" 
                className="text-xs font-semibold text-violet-500 hover:text-violet-600 transition cursor-pointer"
                onClick={handleSelectAllReasons}
              >
                {filters.activity_reason?.length === metadata.activity_reasons.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {metadata.activity_reasons.map((reason) => {
                const isChecked = filters.activity_reason?.includes(reason) || false;
                return (
                  <label 
                    key={reason} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition select-none ${
                      isChecked 
                        ? 'bg-violet-500 border-violet-500 text-white shadow-sm shadow-violet-500/10' 
                        : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)]'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isChecked}
                      onChange={() => handleReasonToggle(reason)}
                    />
                    <span>{reason}</span>
                  </label>
                );
              })}
              {metadata.activity_reasons.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] italic">No categories loaded. Ingest a dataset first.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
