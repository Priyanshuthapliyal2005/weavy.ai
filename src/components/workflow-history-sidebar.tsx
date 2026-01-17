'use client';

import React, { useState, useEffect } from 'react';
import { History, Clock, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface NodeExecution {
  id: string;
  nodeId: string;
  status: string;
  output: any;
  error: string | null;
  duration: number;
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  executionLogs: any[];
  nodeExecutions: NodeExecution[];
}

export function WorkflowHistorySidebar() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  useEffect(() => {
    fetchRuns();
    
    // Listen for workflow execution completion
    const handleWorkflowExecuted = () => {
      fetchRuns();
    };
    
    window.addEventListener('workflow-executed', handleWorkflowExecuted);
    return () => window.removeEventListener('workflow-executed', handleWorkflowExecuted);
  }, []);

  const fetchRuns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/workflows/runs');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflow runs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'partial':
        return <Clock className="text-yellow-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'partial':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="h-full w-80 bg-[#1a1a1f] border-l border-[#2b2b2f] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2b2b2f]">
        <div className="flex items-center gap-2 mb-2">
          <History size={20} className="text-white" />
          <h2 className="text-lg font-semibold text-white">Workflow History</h2>
        </div>
        <p className="text-xs text-gray-400">Recent workflow executions</p>
      </div>

      {/* Runs List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-400 text-sm">Loading...</div>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4">
            <History size={32} className="text-gray-600 mb-2" />
            <p className="text-gray-400 text-sm text-center">
              No workflow runs yet. Execute a workflow to see history.
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {runs.map((run) => (
              <div
                key={run.id}
                className="bg-[#0e0e12] border border-[#2b2b2f] rounded-lg overflow-hidden"
              >
                {/* Run Header */}
                <button
                  onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                  className="w-full p-3 text-left hover:bg-[#1a1a1f] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {expandedRunId === run.id ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                      {getStatusIcon(run.status)}
                      <span className="text-sm font-medium text-white">
                        Run #{run.id.slice(0, 8)}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                        run.status
                      )}`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 ml-8">
                    <span>{format(new Date(run.startedAt), 'MMM d, h:mm a')}</span>
                    <span>•</span>
                    <span>{formatDuration(run.duration)}</span>
                    <span>•</span>
                    <span>{run.nodeExecutions.length} nodes</span>
                  </div>
                </button>

                {/* Expanded Node Details */}
                {expandedRunId === run.id && (
                  <div className="border-t border-[#2b2b2f] p-3 space-y-2">
                    {run.nodeExecutions.map((nodeExec) => (
                      <div
                        key={nodeExec.id}
                        className="bg-[#1a1a1f] rounded p-2 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(nodeExec.status)}
                            <span className="text-white font-medium">
                              {nodeExec.nodeId}
                            </span>
                          </div>
                          <span className="text-gray-400">
                            {formatDuration(nodeExec.duration)}
                          </span>
                        </div>
                        {nodeExec.error && (
                          <div className="text-red-400 mt-1 text-xs">
                            Error: {nodeExec.error}
                          </div>
                        )}
                        {nodeExec.output && (
                          <div className="text-gray-400 mt-1 truncate">
                            Output: {JSON.stringify(nodeExec.output).slice(0, 50)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="p-3 border-t border-[#2b2b2f]">
        <button
          onClick={fetchRuns}
          className="w-full px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded transition-colors"
        >
          Refresh History
        </button>
      </div>
    </div>
  );
}
