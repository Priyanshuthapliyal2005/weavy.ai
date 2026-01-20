'use client';

import { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from './canvas';
import { WidgetSidebar } from './widget-sidebar';
import { WidgetPanel } from './widget-panel';
import { WorkflowToolbar } from './workflow-toolbar';
import { KeyboardShortcuts } from './keyboard-shortcuts';
import { useWorkflowStore } from '@/store/workflow-store';
import { Search, Box, Sparkles, Type, Image as ImageIcon, Video, Crop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RightSidebar } from './right-sidebar';
import { WorkflowGalleryModal } from './workflow-gallery-modal';

type WidgetType = 'search' | 'toolbox' | 'ai' | null;

export default function WorkflowBuilder() {
  const [activeWidget, setActiveWidget] = useState<WidgetType>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addNode } = useWorkflowStore();

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ widget?: WidgetType }>
      if (ce.detail?.widget) setActiveWidget(ce.detail.widget)
    }
    window.addEventListener('open-widget', handler)
    return () => window.removeEventListener('open-widget', handler)
  }, [])

  const handleCanvasClick = () => {
    // Close widget panel when canvas is clicked
    setActiveWidget(null);
    setSearchQuery(''); // Reset search when closing
  };

  const handleCloseWidget = () => {
    setActiveWidget(null);
    setSearchQuery(''); // Reset search when closing
  };

  const handleAddNode = (type: 'text' | 'image' | 'llm' | 'crop' | 'extract' | 'video') => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 };

    addNode(type, position);
    setActiveWidget(null); // Close panel after adding node
    setSearchQuery(''); // Reset search
  };

  // Define all available nodes for search
  const allNodes = [
    { icon: Type, label: 'Text', type: 'text' as const, accent: 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20', keywords: ['text', 'input', 'string'] },
    { icon: ImageIcon, label: 'Upload Image', type: 'image' as const, accent: 'text-blue-300 bg-blue-500/10 border border-blue-500/20', keywords: ['image', 'upload', 'picture', 'photo'] },
    { icon: Video, label: 'Upload Video', type: 'video' as const, accent: 'text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20', keywords: ['video', 'upload', 'movie', 'clip'] },
    { icon: Crop, label: 'Crop Image', type: 'crop' as const, accent: 'text-blue-300 bg-blue-500/10 border border-blue-500/20', keywords: ['crop', 'image', 'resize', 'cut'] },
    { icon: ImageIcon, label: 'Extract Frame', type: 'extract' as const, accent: 'text-blue-300 bg-blue-500/10 border border-blue-500/20', keywords: ['extract', 'frame', 'video', 'snapshot'] },
    { icon: Sparkles, label: 'Run LLM', type: 'llm' as const, accent: 'text-purple-300 bg-purple-500/10 border border-purple-500/20', keywords: ['llm', 'ai', 'gpt', 'chat', 'generate', 'model'] },
  ];

  // Filter nodes based on search query
  const filteredNodes = searchQuery.trim()
    ? allNodes.filter((node) => {
        const query = searchQuery.toLowerCase();
        return (
          node.label.toLowerCase().includes(query) ||
          node.keywords.some((keyword) => keyword.toLowerCase().includes(query))
        );
      })
    : allNodes;

  const renderWidgetContent = () => {
    switch (activeWidget) {
      case 'search':
        return (
          <div className="p-3 space-y-2">
            <div className="px-1">
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
            {filteredNodes.length > 0 ? (
              <div className="space-y-1">
                {filteredNodes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleAddNode(item.type)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors group"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          item.accent
                        )}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="text-sm text-zinc-300 group-hover:text-white">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-sm text-zinc-500">
                No nodes found matching "{searchQuery}"
              </div>
            )}
          </div>
        );

      case 'toolbox':
        return (
          <div className="p-3 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase px-2 mb-2">
              Quick Access
            </h3>
            {[
              { icon: Type, label: 'Text', type: 'text' as const, accent: 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20' },
              { icon: ImageIcon, label: 'Upload Image', type: 'image' as const, accent: 'text-blue-300 bg-blue-500/10 border border-blue-500/20' },
              { icon: Video, label: 'Upload Video', type: 'video' as const, accent: 'text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20' },
              { icon: Crop, label: 'Crop Image', type: 'crop' as const, accent: 'text-blue-300 bg-blue-500/10 border border-blue-500/20' },
              { icon: ImageIcon, label: 'Extract Frame', type: 'extract' as const, accent: 'text-blue-300 bg-blue-500/10 border border-blue-500/20' },
              { icon: Sparkles, label: 'Run LLM', type: 'llm' as const, accent: 'text-purple-300 bg-purple-500/10 border border-purple-500/20' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => handleAddNode(item.type)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors group"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      item.accent
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-white">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'ai':
        return (
          <div className="p-3 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase px-2 mb-2">
              AI Tools
            </h3>
            <button
              onClick={() => handleAddNode('llm')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600/20 text-purple-400">
                <Sparkles size={16} />
              </div>
              <span className="text-sm text-zinc-300 group-hover:text-white">
                LLM Node
              </span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ReactFlowProvider>
      <KeyboardShortcuts />
      <WorkflowGalleryModal />
      <div className="h-screen w-screen flex flex-col relative overflow-hidden bg-[#0e0e12]">
        {/* Toolbar */}
        <WorkflowToolbar showGrid={showGrid} setShowGrid={setShowGrid} />

        {/* Main Content */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Widget Sidebar */}
          <WidgetSidebar activeWidget={activeWidget} onWidgetChange={setActiveWidget} />

          {/* Widget Panel */}
          <WidgetPanel
            isOpen={activeWidget !== null}
            onClose={handleCloseWidget}
            title={
              activeWidget === 'search'
                ? 'Search'
                : activeWidget === 'toolbox'
                ? 'Toolbox'
                : activeWidget === 'ai'
                ? 'AI Tools'
                : ''
            }
          >
            {renderWidgetContent()}
          </WidgetPanel>

          {/* Canvas */}
          <div
            className="flex-1 overflow-hidden"
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasClick}
          >
            <WorkflowCanvas showGrid={showGrid} />
          </div>

          {/* Right Sidebar (Tasks / History) */}
          <RightSidebar />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

