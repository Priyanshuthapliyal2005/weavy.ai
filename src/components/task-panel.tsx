'use client';

import { X, ChevronDown, Play, Info } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/store/workflow-store';

interface TaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode?: any;
}

export function TaskPanelContent({ selectedNode }: { selectedNode?: any }) {
  const { updateNodeData, executeWorkflow, isExecuting } = useWorkflowStore();

  if (!selectedNode) {
    return (
      <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
        <Info className='h-8 w-8 text-white/30 mb-2' strokeWidth={1.5} />
        <p className='text-xs text-white/50'>Select a node to configure</p>
      </div>
    );
  }

  const isRunnableNode =
    selectedNode.type === 'llm' || selectedNode.type === 'crop' || selectedNode.type === 'extract';

  return (
    <div className='space-y-4'>
      {isRunnableNode ? (
        <div className='space-y-4'>
          <div>
            <h3 className='text-white font-medium text-sm'>
              {selectedNode.data?.label || selectedNode.type}
            </h3>
          </div>

          {selectedNode.type === 'llm' && (
            <>
              <div className='space-y-2'>
                <label
                  htmlFor={`llm-model-${selectedNode.id}`}
                  className='flex items-center gap-1 text-xs text-white/70'
                >
                  Model Name
                  <Info className='h-3 w-3' strokeWidth={1.5} />
                </label>
                <div className='relative'>
                  <select
                    id={`llm-model-${selectedNode.id}`}
                    value={selectedNode.data?.model || 'gemini-3-flash-preview'}
                    onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
                    className='w-full bg-[#2a2a2d] border border-[#3a3a3e] rounded px-3 py-2 text-sm text-white appearance-none cursor-pointer hover:border-white/20 transition-colors'
                  >
                    <option value='gemini-3-pro-preview'>google/gemini-3-pro-preview</option>
                    <option value='gemini-3-flash-preview'>google/gemini-3-flash-preview</option>
                    <option value='gemini-2.5-flash'>google/gemini-2.5-flash</option>
                    <option value='gemini-2.5-pro'>google/gemini-2.5-pro</option>
                    <option value='gemini-2.0-flash'>google/gemini-2.0-flash</option>
                  </select>
                  <ChevronDown
                    className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none'
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor={`llm-system-${selectedNode.id}`}
                  className='flex items-center gap-1 text-xs text-white/70'
                >
                  Model instructions
                  <Info className='h-3 w-3' strokeWidth={1.5} />
                </label>
                <div className='relative'>
                  <textarea
                    id={`llm-system-${selectedNode.id}`}
                    value={selectedNode.data?.systemPrompt || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { systemPrompt: e.target.value })}
                    placeholder='Enter system prompt...'
                    className='w-full bg-[#2a2a2d] border border-[#3a3a3e] rounded px-3 py-2 text-sm text-white/90 resize-none h-32 hover:border-white/20 focus:border-white/30 focus:outline-none transition-colors'
                  />
                </div>
              </div>
            </>
          )}

          {selectedNode.type === 'crop' && (
            <div className='space-y-2'>
              <label className='text-xs text-white/70'>Crop Parameters</label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label htmlFor={`crop-x-${selectedNode.id}`} className='text-xs text-white/50'>
                    X %
                  </label>
                  <input
                    id={`crop-x-${selectedNode.id}`}
                    type='number'
                    min='0'
                    max='100'
                    value={selectedNode.data?.xPercent || 0}
                    onChange={(e) => updateNodeData(selectedNode.id, { xPercent: e.target.value })}
                    className='w-full bg-[#2a2a2d] border border-[#3a3a3e] rounded px-2 py-1.5 text-sm text-white mt-1'
                  />
                </div>
                <div>
                  <label htmlFor={`crop-y-${selectedNode.id}`} className='text-xs text-white/50'>
                    Y %
                  </label>
                  <input
                    id={`crop-y-${selectedNode.id}`}
                    type='number'
                    min='0'
                    max='100'
                    value={selectedNode.data?.yPercent || 0}
                    onChange={(e) => updateNodeData(selectedNode.id, { yPercent: e.target.value })}
                    className='w-full bg-[#2a2a2d] border border-[#3a3a3e] rounded px-2 py-1.5 text-sm text-white mt-1'
                  />
                </div>
                <div>
                  <label htmlFor={`crop-w-${selectedNode.id}`} className='text-xs text-white/50'>
                    Width %
                  </label>
                  <input
                    id={`crop-w-${selectedNode.id}`}
                    type='number'
                    min='0'
                    max='100'
                    value={selectedNode.data?.widthPercent || 100}
                    onChange={(e) => updateNodeData(selectedNode.id, { widthPercent: e.target.value })}
                    className='w-full bg-[#2a2a2d] border border-[#3a3a3e] rounded px-2 py-1.5 text-sm text-white mt-1'
                  />
                </div>
                <div>
                  <label htmlFor={`crop-h-${selectedNode.id}`} className='text-xs text-white/50'>
                    Height %
                  </label>
                  <input
                    id={`crop-h-${selectedNode.id}`}
                    type='number'
                    min='0'
                    max='100'
                    value={selectedNode.data?.heightPercent || 100}
                    onChange={(e) => updateNodeData(selectedNode.id, { heightPercent: e.target.value })}
                    className='w-full bg-[#2a2a2d] border border-[#3a3a3e] rounded px-2 py-1.5 text-sm text-white mt-1'
                  />
                </div>
              </div>
            </div>
          )}

          {selectedNode.type === 'extract' && (
            <div className='space-y-2'>
              <label htmlFor={`extract-ts-${selectedNode.id}`} className='text-xs text-white/70'>
                Timestamp (seconds or %)
              </label>
              <input
                id={`extract-ts-${selectedNode.id}`}
                type='text'
                value={selectedNode.data?.timestamp || '0'}
                onChange={(e) => updateNodeData(selectedNode.id, { timestamp: e.target.value })}
                placeholder='e.g., 5 or 50%'
                className='w-full bg-[#2a2a2d] border border-[#3a3a3e] rounded px-3 py-2 text-sm text-white'
              />
            </div>
          )}

          <div className='pt-2 border-t border-[#2a2a2e]'>
            <button
              onClick={() => executeWorkflow()}
              disabled={isExecuting}
              className='w-full bg-[#4a5a3a] hover:bg-[#5a6a4a] disabled:bg-[#3a3a3a] disabled:cursor-not-allowed text-white py-2.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2'
            >
              <Play className='h-4 w-4' strokeWidth={1.5} fill='currentColor' />
              Run selected
            </button>
          </div>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
          <Info className='h-8 w-8 text-white/30 mb-2' strokeWidth={1.5} />
          <p className='text-xs text-white/50'>Select a runnable node to configure</p>
        </div>
      )}
    </div>
  );
}

export function TaskPanel({ isOpen, onClose, selectedNode }: TaskPanelProps) {
  if (!isOpen || !selectedNode) return null;

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full bg-[#1e1e22] border-l border-[#2a2a2e] transition-all duration-300 ease-in-out z-30 shadow-2xl shadow-black/40',
        isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'
      )}
    >
      <div className='w-80 h-full flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-4 h-14 border-b border-[#2a2a2e]'>
          <h2 className='text-white/90 text-sm font-medium'>Tasks</h2>
          <button
            onClick={onClose}
            className='p-1 rounded hover:bg-white/5 text-white/60 hover:text-white transition-colors'
            aria-label='Close panel'
          >
            <X className='h-4 w-4' strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4'>
          <TaskPanelContent selectedNode={selectedNode} />
        </div>
      </div>
    </div>
  );
}
