'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { getHandleColor } from '@/lib/handle-colors';
import { HANDLE_COLORS } from '@/constants/colors';

interface CompatibleNode {
  type: 'text' | 'image' | 'llm';
  label: string;
  handleId: string;
}

interface CompatibleNodesMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  sourceInfo: {
    nodeId: string;
    handleId: string;
    nodeType?: 'text' | 'image' | 'llm';
    isOutput: boolean;
  } | null;
  onSelect: (nodeType: 'text' | 'image' | 'llm', handleId: string) => void;
  onClose: () => void;
}

export function CompatibleNodesMenu({
  isOpen,
  position,
  sourceInfo,
  onSelect,
  onClose,
}: CompatibleNodesMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');

  
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  
  const compatibleNodes = useMemo((): CompatibleNode[] => {
    if (!sourceInfo || !sourceInfo.nodeType) return [];

    const sourceColor = getHandleColor(
      sourceInfo.handleId,
      sourceInfo.nodeType,
      sourceInfo.isOutput
    );

    const nodes: CompatibleNode[] = [];

    
    if (sourceInfo.isOutput) {
      
      if (sourceColor === HANDLE_COLORS.image) {
        nodes.push({
          type: 'llm',
          label: 'Run Any LLM',
          handleId: 'image_1', 
        });
      }
      
      if (sourceColor === HANDLE_COLORS.text) {
        nodes.push({
          type: 'llm',
          label: 'Run Any LLM',
          handleId: 'prompt', 
        });
      }
    } else {
      
      
      if (sourceColor === HANDLE_COLORS.image) {
        nodes.push({
          type: 'image',
          label: 'Image',
          handleId: 'output', 
        });
      }
      
      if (sourceColor === HANDLE_COLORS.prompt) {
        nodes.push(
          {
            type: 'text',
            label: 'Text',
            handleId: 'output', 
          },
          {
            type: 'llm',
            label: 'Run Any LLM',
            handleId: 'output', 
          }
        );
      }
    }

    return nodes;
  }, [sourceInfo]);

  
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return compatibleNodes;
    const query = searchQuery.toLowerCase();
    return compatibleNodes.filter((node) =>
      node.label.toLowerCase().includes(query)
    );
  }, [compatibleNodes, searchQuery]);

  const handleNodeClick = useCallback(
    (nodeType: 'text' | 'image' | 'llm', handleId: string) => {
      onSelect(nodeType, handleId);
      onClose();
      setSearchQuery('');
    },
    [onSelect, onClose]
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  
  if (!isOpen || !position || !sourceInfo || compatibleNodes.length === 0) {
    return null;
  }

  return typeof window !== 'undefined'
    ? createPortal(
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={handleClose}
            style={{ cursor: 'default' }}
          />
          <div
            className="fixed z-[100] bg-panel-bg border border-panel-border rounded-lg shadow-2xl w-[180px] max-h-[300px] flex flex-col"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            <div className="p-1 border-b border-panel-border">
              <div className="relative">
                <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                  <Search
                    className="h-3 w-3 text-white/70"
                    strokeWidth={2}
                  />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  autoFocus
                  className="w-full bg-transparent border border-panel-border rounded-md py-1 pl-7 pr-2 text-[11px] text-panel-text placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors cursor-text"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="overflow-y-auto p-1">
              {filteredNodes.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {filteredNodes.map((node, index) => (
                    <button
                      key={`${node.type}-${node.handleId}-${index}`}
                      onClick={() => handleNodeClick(node.type, node.handleId)}
                      className="w-full text-left px-2 py-1.5 text-[11px] text-white hover:bg-panel-hover transition-colors rounded cursor-pointer"
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-1.5 text-[11px] text-white/50 text-center">
                  No results found
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )
    : null;
}
