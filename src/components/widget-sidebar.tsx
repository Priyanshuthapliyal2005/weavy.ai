'use client';

import { Search, Box, Sparkles, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Tooltip } from './tooltip';

type WidgetType = 'search' | 'toolbox' | 'ai' | null;

interface WidgetSidebarProps {
  activeWidget: WidgetType;
  onWidgetChange: (widget: WidgetType) => void;
}

export function WidgetSidebar({ activeWidget, onWidgetChange }: WidgetSidebarProps) {
  const router = useRouter();

  const widgets = [
    { id: 'search' as const, icon: Search, label: 'Search Nodes' },
    { id: 'toolbox' as const, icon: Box, label: 'Toolbox' },
    { id: 'ai' as const, icon: Sparkles, label: 'AI Tools' },
  ];

  const handleWidgetClick = (widgetId: WidgetType) => {
    // Toggle: if clicking the active widget, close it
    onWidgetChange(activeWidget === widgetId ? null : widgetId);
  };

  const handleHomeClick = () => {
    router.push('/dashboard');
  };

  return (
    <div className="w-14 bg-[#0a0a0f] border-r border-zinc-800 flex flex-col items-center py-3 gap-2">
      {/* Logo - Returns to dashboard */}
      <Tooltip text="Back to dashboard" position="right">
        <button
          onClick={handleHomeClick}
          className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors mb-4"
        >
          <span className="text-white font-bold text-lg">W</span>
        </button>
      </Tooltip>

      <div className="w-full h-px bg-zinc-800 my-1" />

      {/* Widget Icons */}
      {widgets.map((widget) => {
        const Icon = widget.icon;
        const isActive = activeWidget === widget.id;

        return (
          <Tooltip key={widget.id} text={widget.label} position="right">
            <button
              onClick={() => handleWidgetClick(widget.id)}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                'hover:bg-zinc-800',
                isActive
                  ? 'bg-purple-600/20 text-purple-400 ring-2 ring-purple-500/50'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Icon size={20} />
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-purple-500 rounded-r-full" />
              )}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
