'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Plus, Folder, Trash2, Clock, Loader2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserButton } from '@clerk/nextjs';

interface Workflow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    runs: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows?limit=50');
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object with workflow property
        const workflowList = Array.isArray(data)
          ? data
          : Array.isArray(data.workflow)
            ? data.workflow
            : [];

        setWorkflows(workflowList);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchWorkflows();
    }
  }, [isLoaded, isSignedIn]);

  const handleCreateWorkflow = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled Workflow',
          nodes: [],
          edges: [],
          version: '1.0.0',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/flow/${data.id}`);
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkflow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenWorkflow = (id: string) => {
    router.push(`/flow/${id}`);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-white font-semibold">Weavy</span>
        </div>

        <div className="flex items-center gap-4">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-white">My Workflows</h1>
              <p className="text-zinc-400 text-sm mt-1">
                Create and manage your AI workflows
              </p>
            </div>
            <button
              onClick={handleCreateWorkflow}
              disabled={isCreating}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              New Workflow
            </button>
          </div>

          {/* Workflows Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-20">
              <Folder className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl text-white mb-2">No workflows yet</h2>
              <p className="text-zinc-400 mb-6">
                Create your first workflow to get started
              </p>
              <button
                onClick={handleCreateWorkflow}
                disabled={isCreating}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Create Workflow
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  onClick={() => handleOpenWorkflow(workflow.id)}
                  className="group bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-purple-500/50 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium truncate max-w-[180px]">
                          {workflow.name || 'Untitled'}
                        </h3>
                        <p className="text-zinc-500 text-sm flex items-center gap-1">
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(workflow.updatedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                      disabled={deletingId === workflow.id}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                    >
                      {deletingId === workflow.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                  {workflow._count && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <span className="text-xs text-zinc-500">
                        {workflow._count.runs} execution
                        {workflow._count.runs !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
