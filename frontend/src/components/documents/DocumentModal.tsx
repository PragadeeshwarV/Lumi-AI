import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';
import { DocumentItem } from '../../types';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploaded?: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onDocumentUploaded,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<any[]>([]);
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await api.uploadDocument(files[i]);
      }
      await loadDocuments();
      onDocumentUploaded?.();
    } catch (err: any) {
      alert(`Error uploading document: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this document and remove its chunks from the RAG index?')) {
      await api.deleteDocument(id);
      loadDocuments();
      onDocumentUploaded?.();
    }
  };

  const handleTestRagQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    setIsSearchingRag(true);
    try {
      const data = await api.queryRag(ragQuery.trim(), 3);
      setRagResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingRag(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#292638]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#FAF9FF] border border-[#E9E4F0] rounded-3xl shadow-card p-6 flex flex-col max-h-[85vh] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9E4F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EDE5FF] text-[#7654B8] flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#292638]">Knowledge & Document Ingestion</h2>
              <p className="text-xs text-[#777386]">Upload files for RAG contextual grounding in chats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#777386] hover:text-[#292638] hover:bg-[#EDE5FF] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Upload Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#D8C8F5] hover:border-[#7654B8] rounded-2xl p-6 text-center bg-white cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-[#EDE5FF] text-[#7654B8] flex items-center justify-center mx-auto mb-2">
              <Upload size={20} />
            </div>
            <p className="text-xs font-medium text-[#292638]">
              {isUploading ? 'Ingesting and vectorizing...' : 'Click or drop files here to upload'}
            </p>
            <p className="text-[11px] text-[#777386] mt-1">
              Supports PDF, DOCX, TXT, Markdown, CSV, and JSON (up to 25MB)
            </p>
          </div>

          {/* Document Inventory Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#777386]">
              Indexed Documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#777386] bg-white rounded-2xl border border-[#E9E4F0]">
                No documents uploaded yet. Upload a document to start using RAG!
              </div>
            ) : (
              <div className="bg-white border border-[#E9E4F0] rounded-2xl overflow-hidden divide-y divide-[#E9E4F0]">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-[#FAF9FF] transition-colors">
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <FileText size={16} className="text-[#7654B8] flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium text-[#292638] truncate">{doc.filename}</p>
                        <p className="text-[10px] text-[#777386]">
                          {(doc.file_size / 1024).toFixed(1)} KB • {doc.chunk_count} chunks indexed • {doc.file_type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-[#777386] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RAG Query Simulator */}
          <div className="p-4 bg-white border border-[#E9E4F0] rounded-2xl space-y-3">
            <h3 className="text-xs font-semibold text-[#292638] flex items-center gap-1.5">
              <Search size={14} className="text-[#7654B8]" />
              <span>Test Knowledge Retrieval Engine</span>
            </h3>
            <form onSubmit={handleTestRagQuery} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a question about your uploaded documents..."
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                className="flex-1 text-xs px-3 py-2 bg-[#FAF9FF] border border-[#E9E4F0] rounded-xl focus:outline-none focus:border-[#7654B8]"
              />
              <button
                type="submit"
                disabled={isSearchingRag || !ragQuery.trim()}
                className="px-3 py-2 bg-[#7654B8] text-white text-xs font-medium rounded-xl hover:bg-[#6543A0] disabled:opacity-40"
              >
                {isSearchingRag ? 'Searching...' : 'Search'}
              </button>
            </form>

            {ragResults.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-medium text-[#777386]">Top Matched Passages:</p>
                {ragResults.map((r, i) => (
                  <div key={i} className="p-2.5 bg-[#FAF9FF] border border-[#E9E4F0] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#7654B8]">
                      <span>{r.filename}</span>
                      <span className="text-[10px] text-[#777386]">BM25 Score: {r.score}</span>
                    </div>
                    <p className="text-[#292638] text-[12px]">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E9E4F0] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#EDE5FF] text-[#49356F] text-xs font-medium rounded-xl hover:bg-[#D8C8F5]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
