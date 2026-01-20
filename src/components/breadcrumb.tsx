'use client';

import { ChevronRight, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

interface BreadcrumbProps {
  workflowName: string;
  onRename?: (name: string) => void;
  isSaved?: boolean;
}

export function Breadcrumb({ workflowName, onRename, isSaved = true }: BreadcrumbProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(workflowName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempName(workflowName);
  }, [workflowName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    if (tempName.trim()) {
      onRename?.(tempName.trim());
    } else {
      setTempName(workflowName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') {
      setTempName(workflowName);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href="/dashboard"
        className="text-zinc-400 hover:text-white transition-colors"
      >
        Files
      </Link>
      <ChevronRight size={14} className="text-zinc-600" />
      
      {isEditing ? (
        <input
          ref={inputRef}
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="bg-zinc-800 text-white px-2 py-0.5 rounded border border-purple-500 outline-none min-w-[150px]"
        />
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="group flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-0.5 rounded transition-colors"
        >
          <span className="text-white font-medium">
            {workflowName || 'Untitled Workflow'}
          </span>
          <Pencil size={12} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {!isSaved && (
        <span className="text-xs text-zinc-500 ml-2">(Unsaved)</span>
      )}
    </div>
  );
}
