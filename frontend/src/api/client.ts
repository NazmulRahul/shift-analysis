import axios from 'axios';
import type {
  DashboardSummary,
  FilterMetadata,
  ShiftRecord,
  EfficiencyResponse,
  Streak,
  Insight,
  DataQualityResponse,
  FilterParams
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to convert FilterParams to query string correctly for django arrays
const buildQueryParams = (filters?: FilterParams) => {
  const params = new URLSearchParams();
  if (!filters) return params;

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (key === 'activity_reason' && Array.isArray(value)) {
      value.forEach(val => {
        params.append('activity_reason', val);
      });
    } else {
      params.append(key, String(value));
    }
  });

  return params;
};

export const apiService = {
  uploadCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDashboardSummary: async (filters?: FilterParams): Promise<DashboardSummary> => {
    const params = buildQueryParams(filters);
    const response = await apiClient.get<DashboardSummary>('/dashboard/summary/', { params });
    return response.data;
  },

  getFiltersMetadata: async (): Promise<FilterMetadata> => {
    const response = await apiClient.get<FilterMetadata>('/filters/');
    return response.data;
  },

  getActivities: async (filters?: FilterParams): Promise<ShiftRecord[]> => {
    const params = buildQueryParams(filters);
    const response = await apiClient.get<ShiftRecord[]>('/activities/', { params });
    return response.data;
  },

  getEfficiency: async (filters?: FilterParams, granularity: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<EfficiencyResponse> => {
    const params = buildQueryParams(filters);
    params.append('granularity', granularity);
    const response = await apiClient.get<EfficiencyResponse>('/efficiency/', { params });
    return response.data;
  },

  getBreakdownStreaks: async (minLength: number = 3, minDuration: number = 0.0): Promise<Streak[]> => {
    const params = new URLSearchParams();
    params.append('min_length', String(minLength));
    params.append('min_duration', String(minDuration));
    const response = await apiClient.get<Streak[]>('/streaks/', { params });
    return response.data;
  },

  getInsights: async (): Promise<Insight[]> => {
    const response = await apiClient.get<Insight[]>('/insights/');
    return response.data;
  },

  getDataQuality: async (): Promise<DataQualityResponse> => {
    const response = await apiClient.get<DataQualityResponse>('/data-quality/');
    return response.data;
  }
};
