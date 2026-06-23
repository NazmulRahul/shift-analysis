import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../api/client';
import { ShieldCheck, AlertOctagon, FileSpreadsheet, RefreshCw, Layers, CheckCircle } from 'lucide-react';

export const DataQuality: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dataQuality'],
    queryFn: () => apiService.getDataQuality()
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[var(--muted-foreground)]">
        <RefreshCw size={40} className="text-violet-500 animate-spin" />
        <p className="font-medium">Analyzing dataset quality logs...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
        <AlertOctagon size={48} className="text-red-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold">Failed to Load Quality Report</h3>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm mt-1">
          Could not retrieve data quality logs from the server. Verify that the backend is active.
        </p>
        <button className="mt-6 px-4 py-2 bg-violet-500 text-white rounded-xl font-semibold text-sm hover:bg-violet-600 transition" onClick={() => refetch()}>
          Retry Request
        </button>
      </div>
    );
  }

  const { summary, issues } = data;

  // Filter issues based on issue_type
  const filteredIssues = issues.filter(issue => {
    if (filterType === 'all') return true;
    return issue.issue_type === filterType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage) || 1;
  const paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getIssueBadgeClass = (type: string) => {
    const base = "px-2.5 py-1 text-xs font-semibold rounded-full inline-block uppercase tracking-wider ";
    switch (type) {
      case 'MISSING_VALUE': return base + 'bg-red-500/10 text-red-500';
      case 'INVALID_DURATION': return base + 'bg-amber-500/10 text-amber-500';
      case 'TIMESTAMP_OVERLAP': return base + 'bg-amber-500/10 text-amber-500';
      case 'DUPLICATE': return base + 'bg-sky-500/10 text-sky-500';
      case 'INVALID_TIMESTAMP': return base + 'bg-red-500/10 text-red-500';
      default: return base + 'bg-slate-500/10 text-slate-500';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const base = "px-2.5 py-1 text-xs font-semibold rounded-lg inline-block ";
    switch (status) {
      case 'Excluded': return base + 'bg-red-500/10 text-red-500';
      case 'Resolved': return base + 'bg-emerald-500/10 text-emerald-500';
      case 'Flagged': return base + 'bg-amber-500/10 text-amber-500';
      default: return base + 'bg-slate-500/10 text-slate-500';
    }
  };

  const uniqueIssueTypes = Array.from(new Set(issues.map(i => i.issue_type)));

  return (
    <div className="p-8 space-y-8 animate-fade-in text-[var(--foreground)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Integrity Audit</h2>
          <p className="text-[var(--muted-foreground)] mt-2">
            An overview of structural consistency, value omissions, timing conflicts, and duplicate records discovered during CSV ingestion.
          </p>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] transition-all cursor-pointer select-none" 
          onClick={() => { refetch(); setCurrentPage(1); }}
          disabled={isFetching}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Refreshing...' : 'Refresh Audit'}
        </button>
      </div>

      {summary.total_records === 0 ? (
        <div className="p-12 text-center bg-[var(--card)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center">
          <FileSpreadsheet size={64} className="text-[var(--muted-foreground)] opacity-40 mb-4" />
          <h3 className="text-lg font-bold">No Records Processed</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm mt-1">
            The database is currently empty. Upload a CSV file on the ingestion page to review quality statistics.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="flex items-center gap-3 text-violet-500 mb-4">
                <FileSpreadsheet size={24} />
                <h3 className="font-bold text-sm text-[var(--muted-foreground)] uppercase tracking-wider">Total Records</h3>
              </div>
              <span className="text-3xl font-extrabold">{summary.total_records.toLocaleString()}</span>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">Total uploaded CSV rows</p>
            </div>
            
            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
              <div className="flex items-center gap-3 text-emerald-500 mb-4">
                <ShieldCheck size={24} />
                <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Valid Records</h3>
              </div>
              <span className="text-3xl font-extrabold text-emerald-500">{summary.valid_records.toLocaleString()}</span>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">Active in operations analytics</p>
            </div>
            
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 shadow-sm">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <AlertOctagon size={24} />
                <h3 className="font-bold text-sm text-red-600 dark:text-red-400 uppercase tracking-wider">Flagged Issues</h3>
              </div>
              <span className="text-3xl font-extrabold text-red-500">{summary.invalid_records.toLocaleString()}</span>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">Excluded or modified records</p>
            </div>

            <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-sm">
              <div className="flex items-center gap-3 text-amber-500 mb-4">
                <Layers size={24} />
                <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wider">Duplicates & Overlaps</h3>
              </div>
              <span className="text-3xl font-extrabold text-amber-500">
                {(summary.duplicate_records + (summary.timestamp_errors || 0)).toLocaleString()}
              </span>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">Identified timing redundancies</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <h3 className="font-bold text-lg">Anomaly Logs</h3>
                <span className="text-xs text-[var(--muted-foreground)] font-semibold">({filteredIssues.length} found)</span>
              </div>
              
              <div className="flex items-center gap-3">
                <label htmlFor="issue-type-filter" className="text-sm font-semibold text-[var(--muted-foreground)]">Filter Issue Type:</label>
                <select 
                  id="issue-type-filter"
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none"
                  value={filterType} 
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Issues</option>
                  {uniqueIssueTypes.map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <CheckCircle className="text-emerald-500 mb-4" size={48} />
                <p className="text-sm text-[var(--muted-foreground)]">Excellent! No issues found matching the selected type.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--secondary)]">
                      <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] w-24">Row ID</th>
                      <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] w-48">Issue Type</th>
                      <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Anomalous Description</th>
                      <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Corrective Operation</th>
                      <th className="py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedIssues.map((issue) => (
                      <tr key={issue.id} className="border-b border-[var(--border)] hover:bg-[var(--secondary)]/40 transition-colors">
                        <td className="py-4.5 px-6 text-sm font-semibold font-mono text-[var(--muted-foreground)]">#{issue.row_index}</td>
                        <td className="py-4.5 px-6">
                          <span className={getIssueBadgeClass(issue.issue_type)}>
                            {issue.issue_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-sm leading-relaxed">{issue.details}</td>
                        <td className="py-4.5 px-6 text-sm text-[var(--muted-foreground)]">{issue.suggested_fix}</td>
                        <td className="py-4.5 px-6">
                          <span className={getStatusBadgeClass(issue.status)}>
                            {issue.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
                <button 
                  className="px-4 py-2 border border-[var(--border)] text-sm font-semibold rounded-xl hover:bg-[var(--secondary)] transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-sm text-[var(--muted-foreground)] font-medium">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                <button 
                  className="px-4 py-2 border border-[var(--border)] text-sm font-semibold rounded-xl hover:bg-[var(--secondary)] transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
