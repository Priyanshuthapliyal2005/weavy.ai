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
  const { updateNodeData, edges, executionResults, executeWorkflow } = useWorkflowStore();
  const [localValues, setLocalValues] = useState({
    xPercent: data.xPercent ?? 0,
    yPercent: data.yPercent ?? 0,
    widthPercent: data.widthPercent ?? 100,
    heightPercent: data.heightPercent ?? 100,
  });
  
  // Get execution result for this node
  const executionOutput = executionResults.get(id);

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
      
      // Calculate new values with bounds validation
      let newValues = { ...localValues, [field]: clampedValue };
      
      // If x + width > 100, adjust width
      if (newValues.xPercent + newValues.widthPercent > 100) {
        if (field === 'xPercent') {
          newValues.widthPercent = Math.max(1, 100 - newValues.xPercent);
        } else if (field === 'widthPercent') {
          newValues.widthPercent = Math.max(1, 100 - newValues.xPercent);
        }
      }
      
      // If y + height > 100, adjust height
      if (newValues.yPercent + newValues.heightPercent > 100) {
        if (field === 'yPercent') {
          newValues.heightPercent = Math.max(1, 100 - newValues.yPercent);
        } else if (field === 'heightPercent') {
          newValues.heightPercent = Math.max(1, 100 - newValues.yPercent);
        }
      }

      setLocalValues(newValues);
      updateNodeData(id, newValues);
    },
    [id, localValues, updateNodeData]
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

    try {
      await executeWorkflow([id]);
    } catch (e) {
      updateNodeData(id, {
        error: e instanceof Error ? e.message : 'Failed to crop image',
      });
    } finally {
      updateNodeData(id, {
        isProcessing: false,
      });
    }
  }, [id, hasImageConnection, updateNodeData, executeWorkflow]);

  const inputHandles = [
    {
      id: HANDLE_IDS.IMAGE_URL,
      title: 'image',
      color: HANDLE_COLORS.IMAGE,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.X_PERCENT,
      title: 'x%',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.Y_PERCENT,
      title: 'y%',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.WIDTH_PERCENT,
      title: 'width%',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
    {
      id: HANDLE_IDS.HEIGHT_PERCENT,
      title: 'height%',
      color: HANDLE_COLORS.NUMBER,
      position: 'left' as const,
    },
  ];

  const outputHandles = [
    {
      id: HANDLE_IDS.OUTPUT,
      title: 'cropped',
      color: HANDLE_COLORS.IMAGE,
      position: 'right' as const,
    },
  ];

  return (
    <BaseNode
      id={id}
      title="Crop Image"
      titleIcon={Crop}
      nodeType="crop"
      data={data as any}
      selected={selected}
      executing={!!data.isProcessing}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    >
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* X Position */}
          <div>
            <label htmlFor={`${id}-crop-x`} className="text-xs text-white/60 block mb-1">X Position (%)</label>
            <input
              id={`${id}-crop-x`}
              type="number"
              min="0"
              max="100"
              value={localValues.xPercent}
              onChange={(e) => handleValueChange('xPercent', Number(e.target.value))}
              disabled={hasXConnection}
              className={`w-full px-2 py-1 text-sm border rounded ${
                hasXConnection 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border-white/10' 
                  : 'bg-[#2a2a2d] border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20'
              }`}
            />
          </div>

          {/* Y Position */}
          <div>
            <label htmlFor={`${id}-crop-y`} className="text-xs text-white/60 block mb-1">Y Position (%)</label>
            <input
              id={`${id}-crop-y`}
              type="number"
              min="0"
              max="100"
              value={localValues.yPercent}
              onChange={(e) => handleValueChange('yPercent', Number(e.target.value))}
              disabled={hasYConnection}
              className={`w-full px-2 py-1 text-sm border rounded ${
                hasYConnection 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border-white/10' 
                  : 'bg-[#2a2a2d] border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20'
              }`}
            />
          </div>

          {/* Width */}
          <div>
            <label htmlFor={`${id}-crop-width`} className="text-xs text-white/60 block mb-1">Width (%)</label>
            <input
              id={`${id}-crop-width`}
              type="number"
              min="0"
              max="100"
              value={localValues.widthPercent}
              onChange={(e) => handleValueChange('widthPercent', Number(e.target.value))}
              disabled={hasWidthConnection}
              className={`w-full px-2 py-1 text-sm border rounded ${
                hasWidthConnection 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border-white/10' 
                  : 'bg-[#2a2a2d] border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20'
              }`}
            />
          </div>

          {/* Height */}
          <div>
            <label htmlFor={`${id}-crop-height`} className="text-xs text-white/60 block mb-1">Height (%)</label>
            <input
              id={`${id}-crop-height`}
              type="number"
              min="0"
              max="100"
              value={localValues.heightPercent}
              onChange={(e) => handleValueChange('heightPercent', Number(e.target.value))}
              disabled={hasHeightConnection}
              className={`w-full px-2 py-1 text-sm border rounded ${
                hasHeightConnection 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border-white/10' 
                  : 'bg-[#2a2a2d] border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20'
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
              ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
            }
          `}
        >
          <Play size={16} />
          {data.isProcessing ? 'Processing...' : 'Crop Image'}
        </button>

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
            <p className="text-xs text-emerald-300 font-medium mb-1">Cropped Image:</p>
            <img 
              src={executionOutput || data.outputUrl} 
              alt="Cropped" 
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

export const CropImageNode = memo(CropImageNodeComponent);
