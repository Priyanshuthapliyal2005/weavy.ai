'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useWorkflowStore } from '@/store/workflow-store';
import WorkflowBuilder from '@/components/workflow-builder';
import { Loader2 } from 'lucide-react';

export default function FlowPage() {
  const params = useParams();
  const workflowId = params?.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { loadWorkflowFromDB, setNodes, setEdges, clearWorkflowId } = useWorkflowStore();

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) {
        setError('No workflow ID provided');
        setIsLoading(false);
        return;
      }

      try {
        await loadWorkflowFromDB(workflowId);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load workflow:', err);
        setError('Failed to load workflow');
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, [workflowId, loadWorkflowFromDB]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0e0e12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          <p className="text-zinc-400">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-[#0e0e12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">{error}</p>
          <a 
            href="/dashboard"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  return <WorkflowBuilder />;
}
