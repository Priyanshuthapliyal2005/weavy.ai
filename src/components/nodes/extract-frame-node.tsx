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
  const { updateNodeData, edges, nodes } = useWorkflowStore();
  const [localTimestamp, setLocalTimestamp] = useState(data.timestamp ?? '0');

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

    // Simulate processing (replace with actual Trigger.dev call)
    setTimeout(() => {
      updateNodeData(id, {
        isProcessing: false,
        outputUrl: 'https://example.com/extracted-frame.jpg', // Placeholder
      });
    }, 1500);
  }, [id, data.timestamp, hasVideoConnection, updateNodeData]);

  const inputHandles = [
    {
      id: HANDLE_IDS.VIDEO_URL,
      label: 'video',
      color: HANDLE_COLORS.VIDEO,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.TIMESTAMP,
      label: 'time',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
  ];

  const outputHandles = [
    {
      id: HANDLE_IDS.OUTPUT,
      label: 'frame',
      color: HANDLE_COLORS.IMAGE,
      position: 'right' as const,
    },
  ];

  return (
    <BaseNode
      id={id}
      label={data.label || 'Extract Frame'}
      icon={<Film size={16} />}
      color="#8b5cf6"
      selected={selected}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    >
      <div className="p-4 space-y-3">
        {/* Timestamp Input */}
        <div>
          <label className="text-xs text-gray-600 block mb-1">
            Timestamp
            <span className="text-gray-400 ml-1">(seconds or %)</span>
          </label>
          <input
            type="text"
            value={localTimestamp}
            onChange={(e) => handleTimestampChange(e.target.value)}
            disabled={hasTimestampConnection}
            placeholder="e.g., 5 or 50%"
            className={`w-full px-3 py-2 text-sm border rounded-lg ${
              hasTimestampConnection 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
            }`}
          />
          <p className="text-xs text-gray-400 mt-1">
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
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
            }
          `}
        >
          <Play size={16} />
          {data.isProcessing ? 'Extracting...' : 'Extract Frame'}
        </button>

        {/* Connection Status */}
        {!hasVideoConnection && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>Connect a video input to extract frame</span>
          </div>
        )}

        {/* Error Display */}
        {data.error && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{data.error}</span>
          </div>
        )}

        {/* Output Preview */}
        {data.outputUrl && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-green-700 font-medium mb-1">Extracted Frame:</p>
            <img 
              src={data.outputUrl} 
              alt="Extracted frame" 
              className="w-full rounded"
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const ExtractFrameNode = memo(ExtractFrameNodeComponent);
