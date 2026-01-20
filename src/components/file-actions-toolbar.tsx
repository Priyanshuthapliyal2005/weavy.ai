'use client';

import { Plus, Copy, Share2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tooltip } from './tooltip';
import { useWorkflowStore } from '@/store/workflow-store';
import toast from 'react-hot-toast';

export function FileActionsToolbar() {
  const router = useRouter();
  const { createNewWorkflow, exportWorkflow, projectName } = useWorkflowStore();

  const handleCreateNew = async () => {
    const toastId = toast.loading('Creating workflow…');
    try {
      const id = await createNewWorkflow();
      toast.success('Workflow created', { id: toastId });
      router.push(`/flow/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create workflow', { id: toastId });
    }
  };

  const handleDuplicate = async () => {
    const toastId = toast.loading('Duplicating…');
    try {
      const wf = exportWorkflow();
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${projectName || 'untitled'} copy`,
          nodes: wf.nodes,
          edges: wf.edges,
          version: wf.version,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      toast.success('Duplicated', { id: toastId });
      router.push(`/flow/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Duplicate failed', { id: toastId });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const actions = [
    { icon: Plus, label: 'Create New', onClick: handleCreateNew },
    { icon: Copy, label: 'Duplicate', onClick: handleDuplicate },
    { icon: Share2, label: 'Share', onClick: handleShare },
    { icon: Settings, label: 'Preferences', onClick: () => toast('Preferences coming soon') },
  ];

  return (
    <div className="flex items-center gap-1 ml-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Tooltip key={action.label} text={action.label} position="bottom">
            <button
              onClick={action.onClick}
              aria-label={action.label}
              title={action.label}
              className="w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Icon size={14} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
