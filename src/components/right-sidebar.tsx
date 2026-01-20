'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/store/workflow-store';
import { WorkflowHistoryPanel } from './workflow-history-panel';
import { TaskPanelContent } from './task-panel';

export function RightSidebar() {
  const {
    rightSidebarOpen,
    rightSidebarTab,
    setRightSidebarTab,
    closeRightSidebar,
    nodes,
  } = useWorkflowStore();

  const selectedNode = nodes.find((n) => n.selected);

  return (
    <aside
      className={cn(
        'h-full bg-[#1e1e22] border-l border-[#2a2a2e] overflow-hidden transition-[width] duration-200 ease-out',
        rightSidebarOpen ? 'w-85' : 'w-0'
      )}
    >
      <div className='w-85 h-full flex flex-col'>
        <div className='flex items-center justify-between px-3 h-12 border-b border-[#2a2a2e]'>
          <div className='flex items-center gap-1 rounded-md bg-white/5 p-1'>
            <button
              type='button'
              onClick={() => setRightSidebarTab('tasks')}
              className={cn(
                'px-2.5 py-1 text-xs rounded transition-colors',
                rightSidebarTab === 'tasks'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              Tasks
            </button>
            <button
              type='button'
              onClick={() => setRightSidebarTab('history')}
              className={cn(
                'px-2.5 py-1 text-xs rounded transition-colors',
                rightSidebarTab === 'history'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              History
            </button>
          </div>

          <button
            type='button'
            onClick={closeRightSidebar}
            className='p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors'
            aria-label='Close right sidebar'
          >
            <X className='h-4 w-4' strokeWidth={1.5} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-3'>
          {rightSidebarTab === 'tasks' ? (
            <TaskPanelContent selectedNode={selectedNode} />
          ) : (
            <WorkflowHistoryPanel />
          )}
        </div>
      </div>
    </aside>
  );
}
