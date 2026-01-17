'use client';

import React, { memo, useCallback, useState } from 'react';
import { type Node, type NodeProps } from '@xyflow/react';
import { Crop, Play, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import { BaseNode } from './base-node';
import { HANDLE_COLORS } from '@/constants/colors';
import { HANDLE_IDS } from '@/constants/node-ids';

type CropImageNode = Node<
  {
    label: string;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    isProcessing: boolean;
    outputUrl: string | null;
    error: string | null;
  },
  'crop'
>;

function CropImageNodeComponent({ id, data, selected }: NodeProps<CropImageNode>) {
  const { updateNodeData, edges, nodes } = useWorkflowStore();
  const [localValues, setLocalValues] = useState({
    xPercent: data.xPercent ?? 0,
    yPercent: data.yPercent ?? 0,
    widthPercent: data.widthPercent ?? 100,
    heightPercent: data.heightPercent ?? 100,
  });

  // Check if inputs are connected
  const incomingEdges = edges.filter((e) => e.target === id);
  const hasImageConnection = incomingEdges.some(e => e.targetHandle === HANDLE_IDS.IMAGE_URL);
  const hasXConnection = incomingEdges.some(e => e.targetHandle === HANDLE_IDS.X_PERCENT);
  const hasYConnection = incomingEdges.some(e => e.targetHandle === HANDLE_IDS.Y_PERCENT);
  const hasWidthConnection = incomingEdges.some(e => e.targetHandle === HANDLE_IDS.WIDTH_PERCENT);
  const hasHeightConnection = incomingEdges.some(e => e.targetHandle === HANDLE_IDS.HEIGHT_PERCENT);

  const handleValueChange = useCallback(
    (field: string, value: number) => {
      const clampedValue = Math.max(0, Math.min(100, value));
      setLocalValues(prev => ({ ...prev, [field]: clampedValue }));
      updateNodeData(id, { [field]: clampedValue });
    },
    [id, updateNodeData]
  );

  const handleProcess = useCallback(async () => {
    // Check if image input is connected
    if (!hasImageConnection) {
      updateNodeData(id, {
        error: 'No image input connected',
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
        outputUrl: 'https://example.com/cropped-image.jpg', // Placeholder
      });
    }, 2000);
  }, [id, hasImageConnection, updateNodeData]);

  const inputHandles = [
    {
      id: HANDLE_IDS.IMAGE_URL,
      label: 'image',
      color: HANDLE_COLORS.IMAGE,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.X_PERCENT,
      label: 'x%',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.Y_PERCENT,
      label: 'y%',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.WIDTH_PERCENT,
      label: 'width%',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.HEIGHT_PERCENT,
      label: 'height%',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
  ];

  const outputHandles = [
    {
      id: HANDLE_IDS.OUTPUT,
      label: 'cropped',
      color: HANDLE_COLORS.IMAGE,
      position: 'right' as const,
    },
  ];

  return (
    <BaseNode
      id={id}
      label={data.label || 'Crop Image'}
      icon={<Crop size={16} />}
      color="#f59e0b"
      selected={selected}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    >
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* X Position */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">X Position (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={localValues.xPercent}
              onChange={(e) => handleValueChange('xPercent', Number(e.target.value))}
              disabled={hasXConnection}
              className={`w-full px-2 py-1 text-sm border rounded ${
                hasXConnection 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Y Position */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">Y Position (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={localValues.yPercent}
              onChange={(e) => handleValueChange('yPercent', Number(e.target.value))}
              disabled={hasYConnection}
              className={`w-full px-2 py-1 text-sm border rounded ${
                hasYConnection 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Width */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">Width (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={localValues.widthPercent}
              onChange={(e) => handleValueChange('widthPercent', Number(e.target.value))}
              disabled={hasWidthConnection}
              className={`w-full px-2 py-1 text-sm border rounded ${
                hasWidthConnection 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>

          {/* Height */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">Height (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={localValues.heightPercent}
              onChange={(e) => handleValueChange('heightPercent', Number(e.target.value))}
              disabled={hasHeightConnection}
              className={`w-full px-2 py-1 text-sm border rounded ${
                hasHeightConnection 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={handleProcess}
          disabled={data.isProcessing || !hasImageConnection}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            font-medium text-sm transition-all
            ${data.isProcessing || !hasImageConnection
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
            }
          `}
        >
          <Play size={16} />
          {data.isProcessing ? 'Processing...' : 'Crop Image'}
        </button>

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
            <p className="text-xs text-green-700 font-medium mb-1">Cropped Image:</p>
            <img 
              src={data.outputUrl} 
              alt="Cropped" 
              className="w-full rounded"
            />
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const CropImageNode = memo(CropImageNodeComponent);
