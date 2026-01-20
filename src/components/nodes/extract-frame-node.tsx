'use client';

import React, { memo, useCallback, useState } from 'react';
import { type Node, type NodeProps } from '@xyflow/react';
import { Film, Play, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import { BaseNode } from './base-node';
import { HANDLE_COLORS } from '@/constants/colors';
import { HANDLE_IDS } from '@/constants/node-ids';

type ExtractFrameNode = Node<
  {
    label: string;
    timestamp: string;
    isProcessing: boolean;
    outputUrl: string | null;
    error: string | null;
  },
  'extract'
>;

function ExtractFrameNodeComponent({ id, data, selected }: NodeProps<ExtractFrameNode>) {
  const { updateNodeData, edges, executionResults, executeWorkflow } = useWorkflowStore();
  const [localTimestamp, setLocalTimestamp] = useState(data.timestamp ?? '0');
  
  // Get execution result for this node
  const executionOutput = executionResults.get(id);

  // Check if inputs are connected
  const incomingEdges = edges.filter((e) => e.target === id);
  const hasVideoConnection = incomingEdges.some(e => e.targetHandle === HANDLE_IDS.VIDEO_URL);
  const hasTimestampConnection = incomingEdges.some(e => e.targetHandle === HANDLE_IDS.TIMESTAMP);

  const handleTimestampChange = useCallback(
    (value: string) => {
      setLocalTimestamp(value);
      updateNodeData(id, { timestamp: value });
    },
    [id, updateNodeData]
  );

  const handleExtract = useCallback(async () => {
    // Check if video input is connected
    if (!hasVideoConnection) {
      updateNodeData(id, {
        error: 'No video input connected',
        isProcessing: false,
      });
      return;
    }

    // Validate timestamp format
    const timestampValue = data.timestamp || '0';
    const isPercentage = timestampValue.endsWith('%');
    const numericValue = parseFloat(timestampValue);
    
    if (isNaN(numericValue) || numericValue < 0) {
      updateNodeData(id, {
        error: 'Invalid timestamp format. Use seconds (e.g., "5") or percentage (e.g., "50%")',
        isProcessing: false,
      });
      return;
    }

    if (isPercentage && (numericValue < 0 || numericValue > 100)) {
      updateNodeData(id, {
        error: 'Percentage must be between 0 and 100',
        isProcessing: false,
      });
      return;
    }

    updateNodeData(id, {
      isProcessing: true,
      error: null,
      outputUrl: null,
    });

    try {
      await executeWorkflow([id]);
    } catch (e) {
      updateNodeData(id, {
        error: e instanceof Error ? e.message : 'Failed to extract frame',
        isProcessing: false,
      });
    }
  }, [id, hasVideoConnection, data.timestamp, updateNodeData, executeWorkflow]);

  const inputHandles = [
    {
      id: HANDLE_IDS.VIDEO_URL,
      title: 'video',
      color: HANDLE_COLORS.VIDEO,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.TIMESTAMP,
      title: 'time',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
  ];

  const outputHandles = [
    {
      id: HANDLE_IDS.OUTPUT,
      title: 'frame',
      color: HANDLE_COLORS.IMAGE,
      position: 'right' as const,
    },
  ];

  return (
    <BaseNode
      id={id}
      title="Extract Frame"
      titleIcon={Film}
      nodeType="extract"
      data={data as any}
      selected={selected}
      executing={!!data.isProcessing}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    >
      <div className="p-4 space-y-3">
        {/* Timestamp Input */}
        <div>
          <label htmlFor={`${id}-extract-timestamp`} className="text-xs text-white/60 block mb-1">
            Timestamp
            <span className="text-white/30 ml-1">(seconds or %)</span>
          </label>
          <input
            id={`${id}-extract-timestamp`}
            type="text"
            value={localTimestamp}
            onChange={(e) => handleTimestampChange(e.target.value)}
            disabled={hasTimestampConnection}
            placeholder="e.g., 5 or 50%"
            className={`w-full px-3 py-2 text-sm border rounded-lg ${
              hasTimestampConnection 
                ? 'bg-white/5 text-white/30 cursor-not-allowed border-white/10' 
                : 'bg-[#2a2a2d] border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20'
            }`}
          />
          <p className="text-xs text-white/35 mt-1">
            Use "5" for 5 seconds or "50%" for middle
          </p>
        </div>

        {/* Extract Button */}
        <button
          onClick={handleExtract}
          disabled={data.isProcessing || !hasVideoConnection}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            font-medium text-sm transition-all
            ${data.isProcessing || !hasVideoConnection
              ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
            }
          `}
        >
          <Play size={16} />
          {data.isProcessing ? 'Extracting...' : 'Extract Frame'}
        </button>

        {/* Connection Status */}
        {!hasVideoConnection && (
          <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>Connect a video input to extract frame</span>
          </div>
        )}

        {/* Error Display */}
        {data.error && (
          <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{data.error}</span>
          </div>
        )}

        {/* Output Preview */}
        {(executionOutput || data.outputUrl) && (
          <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded">
            <p className="text-xs text-emerald-300 font-medium mb-1">Extracted Frame:</p>
            <img 
              src={executionOutput || data.outputUrl} 
              alt="Extracted frame" 
              className="w-full rounded border border-white/10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const ExtractFrameNode = memo(ExtractFrameNodeComponent);
