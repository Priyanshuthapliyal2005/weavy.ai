'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function WidgetPanel({
  isOpen,
  onClose,
  title,
  children,
  width = '280px',
}: WidgetPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{ width }}
      className={cn(
        'bg-[#0e0e12] border-r border-zinc-800',
        'flex flex-col h-full overflow-hidden',
        'animate-slide-in'
      )}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors p-1"
        >
          <X size={16} />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
