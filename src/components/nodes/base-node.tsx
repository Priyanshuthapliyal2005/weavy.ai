'use client';

import React, { memo, useCallback, useRef, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MoreHorizontal, Lock } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import { NODE_COLORS, HANDLE_COLORS } from '@/constants/colors';
import { cn } from '@/lib/utils';

interface HandleConfig {
  id: string;
  position?: 'left' | 'right';
  color?: string;
  title?: string;
  top?: string;
}

interface BaseNodeProps {
  id: string;
  selected: boolean;
  title: string;
  titleIcon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  nodeType: 'text' | 'image' | 'llm';
  data: Record<string, unknown>;
  children: React.ReactNode;
  inputHandles?: HandleConfig[];
  outputHandles?: HandleConfig[];
  onDuplicate?: (nodeId: string, nodeType: 'text' | 'image' | 'llm', data: Record<string, unknown>) => void;
  minWidth?: string;
  maxWidth?: string;
  errorHandleId?: string | null;
  viewMode?: 'single' | 'all';
  onViewModeChange?: (mode: 'single' | 'all') => void;
}

function BaseNodeComponent({
  id,
  selected,
  title,
  titleIcon: TitleIcon,
  nodeType,
  data,
  children,
  inputHandles = [],
  outputHandles = [{ id: 'output', color: NODE_COLORS.text }],
  minWidth = '383px',
  maxWidth = '383px',
}: BaseNodeProps) {
  const { deleteNode, updateNodeData, addNode } = useWorkflowStore();
  const { getNode } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayTitle = (data?.label as string) || title;
  const isLocked = (data?.locked as boolean) || false;

  const getNodeColor = () => {
    return NODE_COLORS[nodeType] || '#d3d3d4';
  };

  const handleDuplicate = useCallback(() => {
    const currentNode = getNode(id);
    if (currentNode) {
      addNode(nodeType, {
        x: currentNode.position.x + 20,
        y: currentNode.position.y + 20,
      });
    }
    setIsMenuOpen(false);
  }, [id, nodeType, addNode, getNode]);

  const handleDelete = useCallback(() => {
    deleteNode(id);
    setIsMenuOpen(false);
  }, [id, deleteNode]);

  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-lg transition-all duration-200',
          selected ? 'ring-2 ring-white/30' : '',
          isLocked ? 'opacity-80' : ''
        )}
        style={{
          backgroundColor: '#212126',
          border: `1px solid ${selected ? getNodeColor() : '#302e33'}`,
          minWidth,
          maxWidth,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-[#302e33]"
          style={{ borderBottomColor: '#302e33' }}
        >
          <div className="flex items-center gap-2">
            {TitleIcon && (
              <TitleIcon
                className="w-4 h-4"
                style={{ color: getNodeColor() }}
              />
            )}
            <span
              className="text-sm font-medium"
              style={{ color: getNodeColor() }}
            >
              {displayTitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isLocked && (
              <Lock className="w-4 h-4 text-white/50" />
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Node options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {isMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-[#2b2b2f] border border-[#302e33] rounded-md shadow-lg z-50">
                  <button
                    onClick={handleDuplicate}
                    className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      updateNodeData(id, { locked: !isLocked });
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-white/10 transition-colors"
                  >
                    {isLocked ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-white/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {children}
        </div>

        {/* Input Handles */}
        {inputHandles.map((handle) => {
          const handleColor = handle.color || HANDLE_COLORS.default;
          const handleTop = handle.top || '50%';
          const handlePosition = handle.position === 'right' ? Position.Right : Position.Left;

          return (
            <Handle
              key={`input-${handle.id}`}
              type="target"
              position={handlePosition}
              id={handle.id}
              style={{
                top: handleTop,
                backgroundColor: handleColor,
                width: 12,
                height: 12,
                border: '2px solid #212126',
              }}
            />
          );
        })}

        {/* Output Handles */}
        {outputHandles.map((handle) => {
          const handleColor = handle.color || NODE_COLORS[nodeType] || HANDLE_COLORS.default;
          const handlePosition = handle.position === 'left' ? Position.Left : Position.Right;

          return (
            <Handle
              key={`output-${handle.id}`}
              type="source"
              position={handlePosition}
              id={handle.id}
              style={{
                top: '50%',
                backgroundColor: handleColor,
                width: 12,
                height: 12,
                border: '2px solid #212126',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
