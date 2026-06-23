export interface ShiftRecord {
  id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration: number | null;
  activity_reason: string;
  is_valid: boolean;
}

export interface DataQualityIssue {
  id: number;
  row_index: number | null;
  issue_type: string;
  details: string;
  suggested_fix: string;
  status: string;
  created_at: string;
}

export interface DataQualitySummary {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  missing_values: number;
  invalid_durations: number;
  timestamp_errors: number;
  duplicate_records: number;
}

export interface DataQualityResponse {
  summary: DataQualitySummary;
  issues: DataQualityIssue[];
}

export interface EfficiencySummary {
  productive_hours: number;
  unproductive_hours: number;
  total_hours: number;
  efficiency_score: number;
}

export interface DashboardSummary {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  dq_issues_count: number;
  streak_count: number;
  efficiency: EfficiencySummary;
}

export interface EfficiencyTrend {
  period: string;
  total_hours: number;
  productive_hours: number;
  unproductive_hours: number;
  efficiency_score: number;
}

export interface EfficiencyResponse {
  overall: EfficiencySummary;
  trends: EfficiencyTrend[];
}

export interface Streak {
  start_date: string;
  end_date: string;
  length: number;
  total_hours: number;
  average_hours: number;
  severity: 'Low' | 'Medium' | 'High';
}

export interface Insight {
  title: string;
  description: string;
  recommendation: string;
  type: 'success' | 'info' | 'warning' | 'danger' | string;
  severity: 'Low' | 'Medium' | 'High' | string;
}

export interface FilterMetadata {
  min_date: string | null;
  max_date: string | null;
  activity_reasons: string[];
  min_duration: number;
  max_duration: number;
}

export interface FilterParams {
  is_valid?: 'true' | 'false' | 'all';
  start_date?: string;
  end_date?: string;
  activity_reason?: string[];
  min_duration?: number;
  max_duration?: number;
  weekday?: number;
  hour_of_day?: number;
  month?: number;
}
