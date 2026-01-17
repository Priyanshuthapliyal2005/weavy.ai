'use client';

import {
  Undo2,
  Redo2,
  MousePointer2,
  Hand,
  ChevronDown,
  Download,
  Upload,
  Save,
  FolderOpen,
  Trash2,
  Loader2,
  Play,
  PlayCircle,
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import { useReactFlow, useStore, type ReactFlowState } from '@xyflow/react';
import { useEffect, useState, useRef } from 'react';
import type { WorkflowJSON } from '@/types/workflow';
import { useUser } from '@clerk/nextjs';
import { AuthButton } from './auth-button';
import { Tooltip } from './tooltip';
import { Modal } from '@/shared/components/Modal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const zoomSelector = (s: ReactFlowState) => s.transform[2];

export function Toolbar() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    interactionMode,
    setInteractionMode,
    exportWorkflow,
    importWorkflow,
    projectName,
    nodes,
    edges,
    saveWorkflowToDB,
    loadWorkflowFromDB,
    workflowId,
    clearWorkflowId,
    clearWorkflow,
    isExecuting,
    executeWorkflow,
  } = useWorkflowStore();
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const zoom = useStore(zoomSelector);
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isWorkflowMenuOpen, setIsWorkflowMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingWorkflowId, setLoadingWorkflowId] = useState<string | null>(
    null
  );
  const [isFetchingWorkflows, setIsFetchingWorkflows] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const workflowMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleModalOpen = () => setIsModalOpen(true);
    const handleModalClose = () => setIsModalOpen(false);
    const handleActionsMenuOpen = () => setIsActionsMenuOpen(true);
    const handleActionsMenuClose = () => setIsActionsMenuOpen(false);

    window.addEventListener('modal-open', handleModalOpen);
    window.addEventListener('modal-close', handleModalClose);
    window.addEventListener('actions-menu-open', handleActionsMenuOpen);
    window.addEventListener('actions-menu-close', handleActionsMenuClose);

    return () => {
      window.removeEventListener('modal-open', handleModalOpen);
      window.removeEventListener('modal-close', handleModalClose);
      window.removeEventListener('actions-menu-open', handleActionsMenuOpen);
      window.removeEventListener('actions-menu-close', handleActionsMenuClose);
    };
  }, []);

  useEffect(() => {
    setZoomPercent(Math.round(zoom * 100));
  }, [zoom]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsZoomMenuOpen(false);
      }
      if (
        workflowMenuRef.current &&
        !workflowMenuRef.current.contains(event.target as Node)
      ) {
        setIsWorkflowMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchWorkflows();
    }
  }, [isSignedIn]);

  const fetchWorkflows = async () => {
    setIsFetchingWorkflows(true);
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setIsFetchingWorkflows(false);
    }
  };

  const handleSave = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to save workflows');
      return;
    }

    setIsSaving(true);
    try {
      const workflow = exportWorkflow();
      const wasNewWorkflow = !workflowId;

      const savedWorkflowId = await saveWorkflowToDB(
        projectName || 'Untitled Workflow',
        workflow
      );

      if (wasNewWorkflow && savedWorkflowId && typeof window !== 'undefined') {
        window.location.href = `/flow/${savedWorkflowId}`;
      } else {
        toast.success('Workflow saved successfully');
        if (isWorkflowMenuOpen) {
          await fetchWorkflows();
        }
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (workflowId: string) => {
    setLoadingWorkflowId(workflowId);
    try {
      await loadWorkflowFromDB(workflowId);
      setIsWorkflowMenuOpen(false);
      if (typeof window !== 'undefined') {
        window.location.href = `/flow/${workflowId}`;
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      toast.error('Failed to load workflow');
      setLoadingWorkflowId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, workflow: any) => {
    e.stopPropagation();
    setWorkflowToDelete({ id: workflow._id, name: workflow.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workflowToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workflows/${workflowToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete workflow');
      }

      if (workflowId === workflowToDelete.id) {
        clearWorkflow();
        clearWorkflowId();

        const deletedIndex = workflows.findIndex(
          (w) => w._id === workflowToDelete.id
        );
        let previousWorkflowId = null;

        if (deletedIndex > 0) {
          previousWorkflowId = workflows[deletedIndex - 1]._id;
        } else if (workflows.length > 1) {
          previousWorkflowId = workflows[1]._id;
        }

        await fetchWorkflows();

        if (previousWorkflowId) {
          const updatedResponse = await fetch('/api/workflows');
          if (updatedResponse.ok) {
            const data = await updatedResponse.json();
            const updatedWorkflows = data.workflows || [];
            const workflowExists = updatedWorkflows.some(
              (w: any) => w._id === previousWorkflowId
            );

            if (workflowExists) {
              router.push(`/flow/${previousWorkflowId}`);
            } else if (updatedWorkflows.length > 0) {
              router.push(`/flow/${updatedWorkflows[0]._id}`);
            } else {
              router.push('/');
            }
          } else {
            router.push('/');
          }
        } else {
          const updatedResponse = await fetch('/api/workflows');
          if (updatedResponse.ok) {
            const data = await updatedResponse.json();
            const updatedWorkflows = data.workflows || [];
            if (updatedWorkflows.length > 0) {
              router.push(`/flow/${updatedWorkflows[0]._id}`);
            } else {
              router.push('/');
            }
          } else {
            router.push('/');
          }
        }
      } else {
        await fetchWorkflows();
      }

      toast.success('Workflow deleted successfully');
      setDeleteModalOpen(false);
      setWorkflowToDelete(null);
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast.error('Failed to delete workflow');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    const workflow = exportWorkflow();
    const jsonString = JSON.stringify(workflow, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'workflow'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const workflow: WorkflowJSON = JSON.parse(content);

        if (!workflow.nodes || !workflow.edges) {
          throw new Error('Invalid workflow format');
        }

        importWorkflow(workflow);
        toast.success('Workflow imported successfully');
      } catch (error) {
        console.error('Failed to import workflow:', error);
        toast.error('Failed to import workflow. Please check the file format.');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRunWorkflow = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to run workflows');
      return;
    }

    if (nodes.length === 0) {
      toast.error('No nodes to execute');
      return;
    }

    try {
      toast.loading('Executing workflow...', { id: 'workflow-execution' });
      await executeWorkflow();
      toast.success('Workflow executed successfully', { id: 'workflow-execution' });
    } catch (error) {
      console.error('Workflow execution error:', error);
      toast.error('Workflow execution failed', { id: 'workflow-execution' });
    }
  };

  const handleRunSelectedNodes = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to run workflows');
      return;
    }

    const selectedNodes = nodes.filter(node => node.selected);
    if (selectedNodes.length === 0) {
      toast.error('No nodes selected');
      return;
    }

    try {
      toast.loading(`Executing ${selectedNodes.length} node(s)...`, { id: 'workflow-execution' });
      await executeWorkflow(selectedNodes.map(n => n.id));
      toast.success('Selected nodes executed successfully', { id: 'workflow-execution' });
    } catch (error) {
      console.error('Workflow execution error:', error);
      toast.error('Execution failed', { id: 'workflow-execution' });
    }
  };

  return (
    <div className='flex items-center gap-0.5 rounded-md border border-panel-border bg-panel-bg p-1 shadow-lg ring-1 ring-inset ring-white/5'>
      <Tooltip text='Select mode' position='top'>
        <button
          onClick={() => setInteractionMode('select')}
          className={`rounded-sm p-1.5 transition-colors cursor-pointer ${
            interactionMode === 'select'
              ? 'bg-button-active hover:bg-button-active-hover text-black'
              : 'text-panel-text enabled:hover:bg-panel-hover'
          }`}
        >
          <MousePointer2 className='h-5 w-5' strokeWidth={1.5} />
        </button>
      </Tooltip>

      <Tooltip text='Pan mode' position='top'>
        <button
          onClick={() => setInteractionMode('pan')}
          className={`rounded-sm p-1.5 transition-colors cursor-pointer ${
            interactionMode === 'pan'
              ? 'bg-button-active hover:bg-button-active-hover text-black'
              : 'text-panel-text enabled:hover:bg-panel-hover'
          }`}
        >
          <Hand className='h-5 w-5' strokeWidth={1.5} />
        </button>
      </Tooltip>

      <div className='mx-1 h-5 w-px bg-panel-text-muted/30' />

      <Tooltip text='Undo last action' position='top'>
        <button
          onClick={undo}
          disabled={!canUndo()}
          className='rounded-sm p-1.5 text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted'
        >
          <Undo2 className='h-5 w-5' strokeWidth={1.5} />
        </button>
      </Tooltip>

      <Tooltip text='Redo last undone action' position='top'>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className='rounded-sm p-1.5 text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted'
        >
          <Redo2 className='h-5 w-5' strokeWidth={1.5} />
        </button>
      </Tooltip>

      <div className='mx-1 h-5 w-px bg-panel-text-muted/30' />

      <Tooltip text='Run entire workflow' position='top'>
        <button
          onClick={handleRunWorkflow}
          disabled={!isSignedIn || isExecuting || nodes.length === 0}
          className='rounded-sm p-1.5 text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted'
        >
          {isExecuting ? (
            <Loader2 className='h-5 w-5 animate-spin' strokeWidth={1.5} />
          ) : (
            <Play className='h-5 w-5' strokeWidth={1.5} />
          )}
        </button>
      </Tooltip>

      <Tooltip text='Run selected nodes only' position='top'>
        <button
          onClick={handleRunSelectedNodes}
          disabled={!isSignedIn || isExecuting || nodes.filter(n => n.selected).length === 0}
          className='rounded-sm p-1.5 text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted'
        >
          <PlayCircle className='h-5 w-5' strokeWidth={1.5} />
        </button>
      </Tooltip>

      <div className='mx-1 h-5 w-px bg-panel-text-muted/30' />

      <Tooltip text='Export workflow to JSON file' position='top'>
        <button
          onClick={handleExport}
          className='rounded-sm p-1.5 text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover'
        >
          <Download className='h-5 w-5' strokeWidth={1.5} />
        </button>
      </Tooltip>

      <Tooltip text='Import workflow from JSON file' position='top'>
        <button
          onClick={handleImport}
          className='rounded-sm p-1.5 text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover'
        >
          <Upload className='h-5 w-5' strokeWidth={1.5} />
        </button>
      </Tooltip>
      <input
        ref={fileInputRef}
        type='file'
        accept='.json,application/json'
        onChange={handleFileChange}
        className='hidden'
      />

      <div className='mx-1 h-5 w-px bg-panel-text-muted/30' />

      {isSignedIn && (
        <>
          <Tooltip text='Save workflow to cloud' position='top'>
            <button
              onClick={handleSave}
              disabled={isSaving || nodes.length === 0}
              className='rounded-sm p-1.5 text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted'
            >
              {isSaving ? (
                <Loader2 className='h-5 w-5 animate-spin' strokeWidth={1.5} />
              ) : (
                <Save className='h-5 w-5' strokeWidth={1.5} />
              )}
            </button>
          </Tooltip>

          <div className='relative' ref={workflowMenuRef}>
            <Tooltip text='Load saved workflow from cloud' position='top'>
              <button
                onClick={() => {
                  if (isSignedIn) {
                    const willOpen = !isWorkflowMenuOpen;
                    setIsWorkflowMenuOpen(willOpen);
                    if (willOpen) {
                      fetchWorkflows();
                    }
                  }
                }}
                disabled={!isSignedIn}
                className='rounded-sm p-1.5 text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted'
              >
                <FolderOpen className='h-5 w-5' strokeWidth={1.5} />
              </button>
            </Tooltip>
            {isWorkflowMenuOpen && (
              <div className='absolute bottom-full left-0 mb-2 w-64 max-h-96 overflow-y-auto rounded-md border border-panel-border bg-panel-bg p-1 shadow-xl'>
                {isFetchingWorkflows ? (
                  <div className='flex items-center justify-center py-8 text-xs text-panel-text-muted'>
                    <Loader2
                      className='h-4 w-4 animate-spin mr-2'
                      strokeWidth={1.5}
                    />
                    <span>Loading workflows...</span>
                  </div>
                ) : workflows.length === 0 ? (
                  <div className='px-3 py-4 text-xs text-panel-text-muted text-center'>
                    No saved workflows
                  </div>
                ) : (
                  workflows.map((workflow) => {
                    const isThisWorkflowLoading =
                      loadingWorkflowId === workflow._id;
                    return (
                      <div
                        key={workflow._id}
                        className='flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs font-normal text-panel-text hover:bg-panel-hover group'
                      >
                        <button
                          onClick={() => handleLoad(workflow._id)}
                          disabled={!!loadingWorkflowId}
                          className='flex-1 flex items-center justify-between text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <span className='truncate flex items-center gap-2'>
                            {isThisWorkflowLoading && (
                              <Loader2
                                className='h-3 w-3 animate-spin text-panel-text-muted'
                                strokeWidth={1.5}
                              />
                            )}
                            {workflow.name}
                          </span>
                          <span className='ml-2 text-panel-text-muted text-[10px]'>
                            {new Date(workflow.updatedAt).toLocaleDateString()}
                          </span>
                        </button>
                        <Tooltip text='Delete workflow' position='left'>
                          <button
                            onClick={(e) => handleDeleteClick(e, workflow)}
                            disabled={!!loadingWorkflowId}
                            className='ml-2 p-1 rounded hover:bg-red-500/20 text-panel-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'
                          >
                            <Trash2 className='h-3.5 w-3.5' strokeWidth={1.5} />
                          </button>
                        </Tooltip>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </>
      )}

      <div className='mx-1 h-5 w-px bg-panel-text-muted/30' />

      <AuthButton />

      <div className='mx-1 h-5 w-px bg-panel-text-muted/30' />

      <div className='relative' ref={menuRef}>
        {isZoomMenuOpen && (
          <div className='absolute bottom-full left-0 mb-2 w-44 overflow-hidden rounded-md border border-panel-border bg-panel-bg p-1 shadow-xl'>
            <button
              onClick={() => {
                if (!isModalOpen) {
                  zoomIn();
                }
                setIsZoomMenuOpen(false);
              }}
              disabled={isModalOpen}
              className='flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs font-normal text-panel-text cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted disabled:cursor-not-allowed'
            >
              <span>Zoom in</span>
              <div className='flex items-center gap-1.5 font-light text-panel-text-muted'>
                <span className='text-[10px]'>⌘</span>
                <span className='min-w-[1ch] text-center'>+</span>
              </div>
            </button>
            <button
              onClick={() => {
                if (!isModalOpen) {
                  zoomOut();
                }
                setIsZoomMenuOpen(false);
              }}
              disabled={isModalOpen}
              className='flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs font-normal text-panel-text cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted disabled:cursor-not-allowed'
            >
              <span>Zoom out</span>
              <div className='flex items-center gap-1.5 font-light text-panel-text-muted'>
                <span className='text-[10px]'>⌘</span>
                <span className='min-w-[1ch] text-center'>-</span>
              </div>
            </button>
            <button
              onClick={() => {
                if (!isModalOpen) {
                  zoomTo(1);
                }
                setIsZoomMenuOpen(false);
              }}
              disabled={isModalOpen}
              className='flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs font-normal text-panel-text cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted disabled:cursor-not-allowed'
            >
              <span>Zoom to 100%</span>
              <div className='flex items-center gap-1.5 font-light text-panel-text-muted'>
                <span className='text-[10px]'>⌘</span>
                <span className='min-w-[1ch] text-center'>0</span>
              </div>
            </button>
            <button
              onClick={() => {
                if (!isModalOpen) {
                  fitView({ padding: 0.2 });
                }
                setIsZoomMenuOpen(false);
              }}
              disabled={isModalOpen}
              className='flex w-full items-center justify-between rounded-sm px-3 py-2 text-xs font-normal text-panel-text cursor-pointer enabled:hover:bg-panel-hover disabled:text-panel-text-muted disabled:cursor-not-allowed'
            >
              <span>Zoom to fit</span>
              <div className='flex items-center gap-1.5 font-light text-panel-text-muted'>
                <span className='text-[10px]'>⌘</span>
                <span className='min-w-[1ch] text-center'>1</span>
              </div>
            </button>
          </div>
        )}

        <Tooltip text='Change zoom level' position='top'>
          <button
            onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
            className={`flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-normal text-panel-text transition-colors cursor-pointer enabled:hover:bg-panel-hover ${
              isZoomMenuOpen ? 'bg-panel-hover shadow-sm' : ''
            }`}
          >
            <span className='min-w-[3.5ch] text-left'>{zoomPercent}%</span>
            <ChevronDown
              className={`h-4 w-4 transition-colors ${
                isZoomMenuOpen ? 'text-white' : 'text-panel-text-muted'
              }`}
              strokeWidth={1.5}
            />
          </button>
        </Tooltip>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWorkflowToDelete(null);
        }}
        title='Delete Workflow'
        footer={
          <>
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setWorkflowToDelete(null);
              }}
              disabled={isDeleting}
              className='px-4 py-1.5 text-xs font-normal text-panel-text bg-panel-hover hover:bg-panel-border rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='px-4 py-1.5 text-xs font-normal text-white bg-red-500 hover:bg-red-600 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p className='text-xs font-light text-panel-text'>
          Are you sure you want to delete{' '}
          <span className='font-normal text-white'>
            "{workflowToDelete?.name}"
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
