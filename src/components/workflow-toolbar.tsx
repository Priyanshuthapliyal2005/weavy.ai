'use client';

import { Play, Undo2, Redo2, ZoomIn, ZoomOut, Save, MoreVertical, Grid3x3, Loader2, Download, Upload, History } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { UserButton } from '@clerk/nextjs';
import { Breadcrumb } from './breadcrumb';
import { FileActionsToolbar } from './file-actions-toolbar';
import { useReactFlow } from '@xyflow/react';
import toast from 'react-hot-toast';

interface WorkflowToolbarProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

export function WorkflowToolbar({ showGrid, setShowGrid }: WorkflowToolbarProps) {
  const {
    projectName,
    setProjectName,
    executeWorkflow,
    nodes,
    isExecuting,
    saveWorkflow,
    loadSampleWorkflow,
    undo,
    redo,
    canUndo,
    canRedo,
    exportWorkflow,
    importWorkflow,
    openRightSidebar,
  } = useWorkflowStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);
  const moreMenuContainerRef = useRef<HTMLDivElement>(null);

  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();

  useEffect(() => {
    const onStarted = (e: Event) => {
      const ce = e as CustomEvent<{ scope?: string }>
      const scope = ce.detail?.scope || 'full'
      toast.loading(`Running workflow (${scope})…`, { id: 'workflow-run' })
    }
    const onDone = () => {
      toast.success('Workflow finished', { id: 'workflow-run' })
    }
    const onFailed = (e: Event) => {
      const ce = e as CustomEvent<{ message?: string }>
      toast.error(ce.detail?.message || 'Workflow failed', { id: 'workflow-run' })
    }
    window.addEventListener('workflow-execution-started', onStarted)
    window.addEventListener('workflow-executed', onDone)
    window.addEventListener('workflow-execution-failed', onFailed)
    return () => {
      window.removeEventListener('workflow-execution-started', onStarted)
      window.removeEventListener('workflow-executed', onDone)
      window.removeEventListener('workflow-execution-failed', onFailed)
    }
  }, [])

  useEffect(() => {
    if (!showMenu) return;

    const onMouseDown = (e: MouseEvent) => {
      const container = moreMenuContainerRef.current;
      const target = e.target as Node | null;
      if (!container || !target) return;
      if (!container.contains(target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown, true);
    return () => document.removeEventListener('mousedown', onMouseDown, true);
  }, [showMenu]);

  const handleExport = () => {
    try {
      const wf = exportWorkflow();
      const blob = new Blob([JSON.stringify(wf, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(projectName || 'workflow').replace(/[^a-z0-9\-_. ]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported workflow JSON');
    } catch {
      toast.error('Failed to export workflow');
    }
  };

  const handleImportFile = async (file: File) => {
    const toastId = toast.loading('Importing workflow…');
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      importWorkflow(json);
      toast.success('Imported workflow', { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid workflow JSON', { id: toastId });
    }
  };

  const handleSave = async () => {
    const toastId = toast.loading('Saving workflow…');
    setIsSaving(true);
    try {
      await saveWorkflow();
      toast.success('Saved', { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-12 bg-[#0a0a0f] border-b border-zinc-800 flex items-center justify-between px-4">
      {/* Left: Breadcrumb + File Actions */}
      <div className="flex items-center gap-3">
        <Breadcrumb 
          workflowName={projectName} 
          onRename={setProjectName}
          isSaved={!isSaving} 
        />
        <FileActionsToolbar />
      </div>

      {/* Center: Primary Actions */}
      <div className="flex items-center gap-1">
        {/* Run */}
        <button
          onClick={async () => {
            openRightSidebar('history');
            try {
              await executeWorkflow(nodes.map((n) => n.id));
            } catch {
              // Errors are surfaced via the global toast in the event listener.
            }
          }}
          disabled={isExecuting}
          className={cn(
            'h-8 px-3 rounded-lg flex items-center gap-2',
            'bg-purple-600 hover:bg-purple-700',
            'text-white text-sm font-medium',
            'transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {isExecuting ? 'Running…' : 'Run'}
        </button>

        {/* History */}
        <button
          onClick={() => openRightSidebar('history')}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="History"
          aria-label="Open History"
        >
          <History size={16} />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        {/* Zoom */}
        <button
          onClick={() => zoomOut({ duration: 150 })}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => zoomIn({ duration: 150 })}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        {/* Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
            showGrid
              ? "text-purple-400 bg-purple-600/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
          title="Toggle Grid"
        >
          <Grid3x3 size={16} />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="h-8 px-3 rounded-lg flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          title="Save"
        >
          <Save size={14} />
          <span className="text-sm">Save</span>
        </button>

        {/* More Options */}
        <div className="relative" ref={moreMenuContainerRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="More Options"
          >
            <MoreVertical size={16} />
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label="Import workflow JSON"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.currentTarget.value = '';
              setShowMenu(false);
            }}
          />

          {showMenu && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-[#1a1a1f] border border-zinc-800 rounded-lg shadow-xl py-1 z-50">
              <button
                onClick={async () => {
                  await loadSampleWorkflow();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Load Example Workflow
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => {
                  handleExport();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
              >
                <Download size={14} />
                Export JSON
              </button>
              <button
                onClick={() => {
                  importInputRef.current?.click();
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
              >
                <Upload size={14} />
                Import JSON
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => {
                  fitView({ padding: 0.2, duration: 200 });
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Fit to Screen
              </button>
              <button
                onClick={() => {
                  zoomTo(1, { duration: 200 });
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Reset Zoom
              </button>
              <div className="h-px bg-zinc-800 my-1" />
              <button
                onClick={() => {
                  toast('Preferences coming soon');
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Preferences
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center">
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </div>
    </div>
  );
}
