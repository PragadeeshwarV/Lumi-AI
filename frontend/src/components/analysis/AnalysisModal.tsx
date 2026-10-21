import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart2,
  Table,
  Layers,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { DocumentItem, DatasetProfile } from '../../types';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose }) => {
  const [csvDocs, setCsvDocs] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Aggregation controls
  const [groupCol, setGroupCol] = useState('');
  const [aggCol, setAggCol] = useState('');
  const [aggFunc, setAggFunc] = useState('mean');
  const [aggResults, setAggResults] = useState<any[]>([]);
  const [isAggregating, setIsAggregating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCsvFiles();
    }
  }, [isOpen]);

  const loadCsvFiles = async () => {
    try {
      const docs = await api.getDocuments();
      const csvs = docs.filter((d) => d.file_type === 'csv');
      setCsvDocs(csvs);
      if (csvs.length > 0 && !selectedDocId) {
        handleSelectCsv(csvs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCsv = async (docId: string) => {
    setSelectedDocId(docId);
    setIsLoading(true);
    setErrorMsg(null);
    setProfile(null);
    setAggResults([]);

    try {
      const prof = await api.getDatasetProfile(docId);
      setProfile(prof);
      // Auto-set default group and agg columns
      if (prof.columns.length >= 2) {
        const catCol = prof.columns.find((c) => c.dtype === 'string') || prof.columns[0];
        const numCol = prof.columns.find((c) => c.dtype.includes('int') || c.dtype.includes('float')) || prof.columns[1];
        setGroupCol(catCol.name);
        setAggCol(numCol.name);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to profile dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAggregation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !groupCol || !aggCol) return;

    setIsAggregating(true);
    try {
      const res = await api.executeAggregation(selectedDocId, groupCol, aggCol, aggFunc);
      setAggResults(res);
    } catch (err: any) {
      alert(`Aggregation failed: ${err.message}`);
    } finally {
      setIsAggregating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#292638]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#FAF9FF] border border-[#E9E4F0] rounded-3xl shadow-card p-6 flex flex-col max-h-[90vh] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9E4F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EDE5FF] text-[#7654B8] flex items-center justify-center">
              <BarChart2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#292638]">CSV Data Analysis Workspace</h2>
              <p className="text-xs text-[#777386]">Safe statistical profiling and descriptive aggregations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#777386] hover:text-[#292638] hover:bg-[#EDE5FF] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* File Picker */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-[#292638] flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-[#7654B8]" />
              <span>Select CSV Dataset:</span>
            </label>
            {csvDocs.length === 0 ? (
              <span className="text-xs text-[#777386]">
                No CSV files uploaded yet. Upload a CSV via the composer or Documents menu.
              </span>
            ) : (
              <select
                value={selectedDocId || ''}
                onChange={(e) => handleSelectCsv(e.target.value)}
                className="text-xs px-3 py-1.5 bg-white border border-[#E9E4F0] rounded-xl focus:outline-none focus:border-[#7654B8]"
              >
                {csvDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename} ({(doc.file_size / 1024).toFixed(1)} KB)
                  </option>
                ))}
              </select>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading && (
            <div className="p-12 text-center text-xs text-[#7654B8] animate-pulse">
              Profiling dataset structure and computing descriptive statistics...
            </div>
          )}

          {profile && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-white border border-[#E9E4F0] rounded-2xl">
                  <span className="text-[10px] uppercase font-semibold text-[#777386]">Total Rows</span>
                  <p className="text-xl font-bold text-[#292638] mt-0.5">{profile.total_rows.toLocaleString()}</p>
                </div>
                <div className="p-3.5 bg-white border border-[#E9E4F0] rounded-2xl">
                  <span className="text-[10px] uppercase font-semibold text-[#777386]">Total Columns</span>
                  <p className="text-xl font-bold text-[#292638] mt-0.5">{profile.total_columns}</p>
                </div>
                <div className="p-3.5 bg-white border border-[#E9E4F0] rounded-2xl">
                  <span className="text-[10px] uppercase font-semibold text-[#777386]">Duplicate Rows</span>
                  <p className="text-xl font-bold text-[#292638] mt-0.5">{profile.duplicate_rows}</p>
                </div>
              </div>

              {/* Column Metrics Table */}
              <div className="bg-white border border-[#E9E4F0] rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-[#FAF9FF] border-b border-[#E9E4F0] font-semibold text-xs text-[#292638]">
                  Column Types & Summary Statistics
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF9FF] text-[#777386] border-b border-[#E9E4F0]">
                      <tr>
                        <th className="px-4 py-2">Column</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Missing</th>
                        <th className="px-4 py-2">Unique</th>
                        <th className="px-4 py-2">Descriptive Stats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E4F0]">
                      {profile.columns.map((c, i) => (
                        <tr key={i} className="hover:bg-[#FAF9FF]">
                          <td className="px-4 py-2.5 font-medium text-[#292638]">{c.name}</td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-[#7654B8]">{c.dtype}</td>
                          <td className="px-4 py-2.5 text-[#777386]">{c.null_count} ({c.null_percentage}%)</td>
                          <td className="px-4 py-2.5 text-[#777386]">{c.unique_count}</td>
                          <td className="px-4 py-2.5 text-[#292638]">
                            {c.stats?.mean !== undefined ? (
                              <span className="font-mono text-[11px]">
                                mean: {c.stats.mean} | min: {c.stats.min} | max: {c.stats.max} | std: {c.stats.std}
                              </span>
                            ) : c.stats?.top_categories ? (
                              <span className="text-[11px] text-[#777386]">
                                Top: {Object.keys(c.stats.top_categories).slice(0, 3).join(', ')}
                              </span>
                            ) : (
                              <span className="text-[#777386]">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Safe Aggregation Engine */}
              <div className="p-4 bg-white border border-[#E9E4F0] rounded-2xl space-y-4">
                <h3 className="text-xs font-semibold text-[#292638] flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-[#7654B8]" />
                  <span>Execute Safe Aggregation</span>
                </h3>
                <form onSubmit={handleRunAggregation} className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#777386]">Group by:</span>
                    <select
                      value={groupCol}
                      onChange={(e) => setGroupCol(e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-[#FAF9FF] border border-[#E9E4F0] rounded-xl focus:outline-none"
                    >
                      {profile.columns.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#777386]">Aggregate:</span>
                    <select
                      value={aggCol}
                      onChange={(e) => setAggCol(e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-[#FAF9FF] border border-[#E9E4F0] rounded-xl focus:outline-none"
                    >
                      {profile.columns.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#777386]">Function:</span>
                    <select
                      value={aggFunc}
                      onChange={(e) => setAggFunc(e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-[#FAF9FF] border border-[#E9E4F0] rounded-xl focus:outline-none"
                    >
                      <option value="mean">Mean (Average)</option>
                      <option value="sum">Sum</option>
                      <option value="count">Count</option>
                      <option value="min">Min</option>
                      <option value="max">Max</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isAggregating}
                    className="px-3.5 py-1.5 bg-[#7654B8] text-white text-xs font-medium rounded-xl hover:bg-[#6543A0] transition-colors disabled:opacity-40"
                  >
                    {isAggregating ? 'Calculating...' : 'Run Aggregation'}
                  </button>
                </form>

                {/* Aggregation Results Table */}
                {aggResults.length > 0 && (
                  <div className="mt-3 border border-[#E9E4F0] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF9FF] text-[#777386] border-b border-[#E9E4F0]">
                        <tr>
                          <th className="px-4 py-2">{groupCol}</th>
                          <th className="px-4 py-2">{aggCol} ({aggFunc})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9E4F0]">
                        {aggResults.map((r, i) => (
                          <tr key={i} className="hover:bg-[#FAF9FF]">
                            <td className="px-4 py-2 font-medium text-[#292638]">{r[groupCol]}</td>
                            <td className="px-4 py-2 font-mono text-[#7654B8]">{r[`${aggCol}_${aggFunc}`]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E9E4F0] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#EDE5FF] text-[#49356F] text-xs font-medium rounded-xl hover:bg-[#D8C8F5]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
