'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Clock, RefreshCw, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/store/workflow-store';

interface NodeExecution {
  id: string;
  nodeId: string;
  status: string;
  input?: any;
  output: any;
  error: string | null;
  duration: number;
}

interface WorkflowRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  nodeExecutions: NodeExecution[];
  executionLogs?: any;
}

function formatDuration(ms: number | null) {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className='text-emerald-400' size={14} />;
    case 'failed':
      return <XCircle className='text-red-400' size={14} />;
    case 'running':
      return <Loader2 className='text-yellow-400 animate-spin' size={14} />;
    case 'partial':
      return <Clock className='text-yellow-400' size={14} />;
    default:
      return <Clock className='text-white/40' size={14} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const base = 'text-[10px] px-2 py-0.5 rounded-full border';
  switch (status) {
    case 'success':
      return <span className={`${base} text-emerald-300 border-emerald-500/30 bg-emerald-500/10`}>success</span>;
    case 'failed':
      return <span className={`${base} text-red-300 border-red-500/30 bg-red-500/10`}>failed</span>;
    case 'running':
      return <span className={`${base} text-yellow-300 border-yellow-500/30 bg-yellow-500/10`}>running</span>;
    case 'partial':
      return <span className={`${base} text-yellow-300 border-yellow-500/30 bg-yellow-500/10`}>partial</span>;
    default:
      return <span className={`${base} text-white/60 border-white/10 bg-white/5`}>{status || 'unknown'}</span>;
  }
}

function getScope(run: WorkflowRun): string {
  const first = Array.isArray((run as any).executionLogs) ? (run as any).executionLogs[0] : null;
  return first?.scope || 'full';
}

function formatPreview(value: any): string {
  if (value === null || value === undefined) return '';

  const clampString = (s: string) => {
    if (s.startsWith('data:image/')) {
      return `data:image/... (${s.length} chars)`;
    }
    if (s.length <= 180) return s;
    return `${s.slice(0, 120)}…${s.slice(-40)}`;
  };

  if (typeof value === 'string') return clampString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return clampString(
      JSON.stringify(
        value,
        (_k, v) => (typeof v === 'string' ? clampString(v) : v),
        2
      )
    );
  } catch {
    return clampString(String(value));
  }
}

export function WorkflowHistoryPanel({ className }: { className?: string }) {
  const { workflowId } = useWorkflowStore();
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRuns = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const url = workflowId
        ? `/api/workflows/runs?workflowId=${encodeURIComponent(workflowId)}`
        : '/api/workflows/runs';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRuns((data?.runs as WorkflowRun[]) || []);
      } else if (response.status === 401) {
        setRuns([]);
        setErrorMessage('Sign in to view workflow history.');
      } else {
        setErrorMessage('Failed to load workflow history.');
        setRuns([]);
      }
    } catch {
      setErrorMessage('Failed to load workflow history.');
      setRuns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const handleWorkflowExecuted = () => {
      fetchRuns();
    };
    window.addEventListener('workflow-executed', handleWorkflowExecuted);
    return () => window.removeEventListener('workflow-executed', handleWorkflowExecuted);
  }, [workflowId]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className='flex items-center justify-end'>
        <button
          onClick={fetchRuns}
          className='inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs transition-colors'
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className='text-xs text-white/50 py-6 text-center'>Loading…</div>
      ) : errorMessage ? (
        <div className='text-xs text-white/50 py-6 text-center'>{errorMessage}</div>
      ) : runs.length === 0 ? (
        <div className='text-xs text-white/50 py-6 text-center'>No workflow runs yet.</div>
      ) : (
        <div className='space-y-2'>
          {runs.map((run) => (
            <div
              key={run.id}
              className='bg-[#2a2a2d] border border-[#2a2a2e] rounded-md overflow-hidden'
            >
              <button
                onClick={() =>
                  setExpandedRunId(expandedRunId === run.id ? null : run.id)
                }
                className='w-full px-3 py-2 text-left hover:bg-white/5 transition-colors'
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2 min-w-0'>
                    {expandedRunId === run.id ? (
                      <ChevronDown size={14} className='text-white/50' />
                    ) : (
                      <ChevronRight size={14} className='text-white/50' />
                    )}
                    <StatusIcon status={run.status} />
                    <div className='text-xs text-white/90 truncate'>Run {run.id.slice(0, 8)}</div>
                  </div>
                  <div className='flex items-center gap-2 whitespace-nowrap'>
                    <StatusBadge status={run.status} />
                    <div className='text-[11px] text-white/50'>{formatDuration(run.duration)}</div>
                  </div>
                </div>
                <div className='mt-1 ml-8 text-[11px] text-white/45 flex items-center gap-2'>
                  <span>{format(new Date(run.startedAt), 'MMM d, h:mm a')}</span>
                  <span>•</span>
                  <span className='uppercase'>{getScope(run)}</span>
                  <span>•</span>
                  <span>{run.nodeExecutions?.length ?? 0} nodes</span>
                </div>
              </button>

              {expandedRunId === run.id && (
                <div className='border-t border-[#2a2a2e] p-2 space-y-1.5'>
                  {(run.nodeExecutions || []).map((nodeExec) => (
                    <div
                      key={nodeExec.id}
                      className='bg-[#1e1e22] border border-[#2a2a2e] rounded px-2 py-1.5'
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <StatusIcon status={nodeExec.status} />
                          <div className='text-[11px] text-white/80 truncate'>{nodeExec.nodeId}</div>
                        </div>
                        <div className='text-[11px] text-white/45 whitespace-nowrap'>
                          {formatDuration(nodeExec.duration)}
                        </div>
                      </div>
                      {nodeExec.error ? (
                        <div className='mt-1 text-[11px] text-red-300 truncate'>Error: {nodeExec.error}</div>
                      ) : null}

                      {nodeExec.input !== undefined ? (
                        <div className='mt-1 text-[11px] text-white/60'>
                          <div className='text-[10px] text-white/40'>Input</div>
                          <pre className='mt-0.5 whitespace-pre-wrap wrap-break-word max-h-28 overflow-auto bg-black/20 border border-white/10 rounded p-1.5'>
                            {formatPreview(nodeExec.input)}
                          </pre>
                        </div>
                      ) : null}

                      {nodeExec.output !== undefined && nodeExec.output !== null ? (
                        <div className='mt-1 text-[11px] text-white/60'>
                          <div className='text-[10px] text-white/40'>Output</div>
                          <pre className='mt-0.5 whitespace-pre-wrap wrap-break-word max-h-28 overflow-auto bg-black/20 border border-white/10 rounded p-1.5'>
                            {formatPreview(nodeExec.output)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
