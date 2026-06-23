import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/client';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    message: string;
    total_records: number;
    valid_records: number;
    invalid_records: number;
    issues_found: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Only CSV files are supported.');
      }
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setShowConfirm(false);

    try {
      const response = await apiService.uploadCSV(file);
      setResult(response);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process dataset. Please ensure the CSV is properly formatted.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in text-[var(--foreground)]">
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight">Ingest Shift Activities</h2>
        <p className="text-[var(--muted-foreground)] mt-2">
          Upload an employee shift dataset to perform quality cleaning, calculate operational efficiency, and generate automated insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form 
            onDragEnter={handleDrag} 
            onDragOver={handleDrag} 
            onDragLeave={handleDrag} 
            onDrop={handleDrop}
            onSubmit={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[350px] ${
              dragActive 
                ? 'border-violet-500 bg-violet-500/5' 
                : 'border-[var(--border)] bg-[var(--card)] hover:border-violet-500/50'
            } ${file ? 'border-violet-500/50 bg-violet-500/5' : ''}`}
          >
            <input 
              ref={inputRef}
              type="file" 
              className="hidden" 
              accept=".csv"
              onChange={handleFileChange}
            />

            {!file && !uploading && (
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-violet-500/10 text-violet-500 mb-4">
                  <UploadCloud size={40} />
                </div>
                <p className="text-lg font-semibold">Drag & drop your CSV file here</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">or click to browse local files</p>
                <button 
                  type="button" 
                  className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-200 cursor-pointer"
                  onClick={onButtonClick}
                >
                  Browse Files
                </button>
              </div>
            )}

            {file && !uploading && (
              <div className="flex flex-col items-center w-full max-w-md">
                <div className="p-4 rounded-full bg-violet-500/10 text-violet-500 mb-4 animate-bounce">
                  <FileText size={40} />
                </div>
                <p className="text-lg font-semibold truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                
                <div className="flex gap-4 mt-8 w-full">
                  <button 
                    type="button" 
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-500 text-red-500 hover:bg-red-500/5 transition-all duration-200 cursor-pointer" 
                    onClick={() => setFile(null)}
                  >
                    Clear Selection
                  </button>
                  <button 
                    type="button" 
                    className="flex-grow-[2] px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-200 cursor-pointer" 
                    onClick={() => setShowConfirm(true)}
                  >
                    Upload and Process
                  </button>
                </div>
              </div>
            )}

            {uploading && (
              <div className="flex flex-col items-center">
                <RefreshCw size={40} className="text-violet-500 animate-spin mb-4" />
                <p className="text-lg font-semibold">Uploading and Validating Data...</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-2 max-w-sm">
                  Executing data quality pipeline, scanning for overlaps, and building models
                </p>
              </div>
            )}
          </form>

          {showConfirm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-up text-left">
                <div className="flex items-center gap-3 text-red-500 mb-4">
                  <AlertTriangle size={32} />
                  <h3 className="text-lg font-bold">Replace Current Dataset?</h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Uploading this file will <strong>permanently delete</strong> all currently loaded shift records, data quality logs, and calculated metrics. This action is irreversible.
                </p>
                <div className="flex gap-4 mt-8 justify-end">
                  <button 
                    type="button" 
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all" 
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all" 
                    onClick={handleUploadSubmit}
                  >
                    Confirm & Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 flex gap-3 items-start">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <strong className="font-semibold block">Error processing dataset:</strong>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-[var(--foreground)] space-y-6 animate-scale-up">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-emerald-500 shrink-0" size={32} />
                <div>
                  <h3 className="text-lg font-bold">Processing Complete</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{result.message}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Total Rows</span>
                  <span className="block text-2xl font-bold mt-1">{result.total_records.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center border-emerald-500/20">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-500">Valid Records</span>
                  <span className="block text-2xl font-bold mt-1 text-emerald-500">{result.valid_records.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center border-amber-500/20">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-amber-500">Flagged Issues</span>
                  <span className="block text-2xl font-bold mt-1 text-amber-500">{result.issues_found.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] hover:bg-[var(--secondary)] transition-all cursor-pointer" 
                  onClick={() => navigate('/quality')}
                >
                  View Quality Report
                </button>
                <button 
                  type="button" 
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/20 transition-all cursor-pointer" 
                  onClick={() => navigate('/')}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-6">
          <h3 className="text-lg font-bold tracking-tight">Expected Columns</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            The CSV dataset must have columns corresponding to these fields. Variants are dynamically normalized.
          </p>
          <ul className="space-y-4 text-sm">
            <li className="p-3 rounded-xl bg-[var(--secondary)]">
              <strong className="block font-semibold">Date:</strong> 
              <span className="text-xs text-[var(--muted-foreground)] block mt-0.5">The day of the shift (e.g. <code>2026-06-01</code>)</span>
            </li>
            <li className="p-3 rounded-xl bg-[var(--secondary)]">
              <strong className="block font-semibold">Shift Start Date/Time:</strong> 
              <span className="text-xs text-[var(--muted-foreground)] block mt-0.5 font-mono">2026-06-01 06:00:00</span>
            </li>
            <li className="p-3 rounded-xl bg-[var(--secondary)]">
              <strong className="block font-semibold">Shift End Date/Time:</strong> 
              <span className="text-xs text-[var(--muted-foreground)] block mt-0.5 font-mono">2026-06-01 14:00:00</span>
            </li>
            <li className="p-3 rounded-xl bg-[var(--secondary)]">
              <strong className="block font-semibold">Duration:</strong> 
              <span className="text-xs text-[var(--muted-foreground)] block mt-0.5">Duration in hours (e.g. <code>8.0</code>). If missing, it will be auto-calculated.</span>
            </li>
            <li className="p-3 rounded-xl bg-[var(--secondary)]">
              <strong className="block font-semibold">Activity Reason:</strong> 
              <span className="text-xs text-[var(--muted-foreground)] block mt-0.5">Type (e.g. <code>Breakdown</code>, <code>Maintenance</code>, <code>Production</code>)</span>
            </li>
          </ul>
          
          <div className="p-4 rounded-xl border border-violet-500/10 bg-violet-500/5">
            <h4 className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-2">Ingestion Pipeline Steps:</h4>
            <ol className="list-decimal pl-4 text-xs text-[var(--muted-foreground)] space-y-1">
              <li>Normalize casing and remove column whitespaces.</li>
              <li>Check and drop records missing date or activity values.</li>
              <li>Verify timeline logic (end time after start time).</li>
              <li>Filter duplicates and identify timestamp overlaps.</li>
              <li>Log all anomalies to the Data Quality panel.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
