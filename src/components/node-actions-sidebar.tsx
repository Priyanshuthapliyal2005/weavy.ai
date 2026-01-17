'use client'

import { WorkflowNode } from '@/store/workflow-store'

interface NodeActionsSidebarProps {
  node: WorkflowNode | null
  isOpen: boolean
  onClose: () => void
  onDuplicate: () => void
  onRename: () => void
  onLock: () => void
  onDelete: () => void
  nodeType?: string
  isLocked?: boolean
  viewMode?: 'single' | 'all'
  onViewModeChange?: (mode: 'single' | 'all') => void
  onUpdateNodeData?: (data: any) => void
}

export function NodeActionsSidebar({
  node,
  isOpen,
  onClose,
  onDuplicate,
  onRename,
  onLock,
  onDelete,
  nodeType,
  isLocked = false,
  viewMode = 'single',
  onViewModeChange,
  onUpdateNodeData,
}: NodeActionsSidebarProps) {
  if (!isOpen || !node) return null

  return (
    <div className="absolute right-4 top-20 w-64 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Node Actions</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={onDuplicate}
            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2e] rounded"
          >
            Duplicate
          </button>

          <button
            onClick={onRename}
            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2e] rounded"
          >
            Rename
          </button>

          <button
            onClick={onLock}
            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a2e] rounded"
          >
            {isLocked ? 'Unlock' : 'Lock'}
          </button>

          {nodeType === 'llm' && onViewModeChange && (
            <div className="px-3 py-2">
              <label className="text-sm text-gray-300 block mb-2">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => onViewModeChange(e.target.value as 'single' | 'all')}
                className="w-full bg-[#2a2a2e] border border-[#3a3a3e] rounded px-2 py-1 text-sm text-white"
              >
                <option value="single">Single</option>
                <option value="all">All</option>
              </select>
            </div>
          )}

          <hr className="border-[#2a2a2e]" />

          <button
            onClick={onDelete}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}