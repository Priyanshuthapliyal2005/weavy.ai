'use client';

import { useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflow-store';

export function KeyboardShortcuts() {
  const { executeWorkflow, nodes, saveWorkflow } = useWorkflowStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: Run workflow
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeWorkflow(nodes.map(n => n.id));
      }

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveWorkflow();
      }

      // Ctrl/Cmd + D: Duplicate (placeholder)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        console.log('Duplicate workflow');
      }

      // Escape: Close widgets
      if (e.key === 'Escape') {
        // Will be handled by widget components
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeWorkflow, nodes, saveWorkflow]);

  return null;
}
