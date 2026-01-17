'use client';

import {
  Search,
  History,
  Briefcase,
  Image as ImageIcon,
  Video,
  Box,
  Sparkles,
  HelpCircle,
  MessageCircle,
  Type,
  ChevronDown,
  X,
  ChevronRight,
  Check,
  Plus,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/store/workflow-store';
import { Tooltip } from './tooltip';
import toast from 'react-hot-toast';
import {
  SIDEBAR_TAGS,
  SIDEBAR_TABS,
  FILTER_ORDERS,
  FILTER_TYPES,
} from '@/constants/sidebar';

export function Sidebar() {
  const {
    projectName,
    activeTab,
    setActiveTab,
    addNode,
    nodes,
    createNewWorkflow,
  } = useWorkflowStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<null | 'type'>(null);
  const [isInputMenuOpen, setIsInputMenuOpen] = useState(false);
  const [isOutputMenuOpen, setIsOutputMenuOpen] = useState(false);
  const { selectedFromTags, selectedToTags, toggleFromTag, toggleToTag } =
    useWorkflowStore();
  const [selectedOrder, setSelectedOrder] = useState<string>(
    FILTER_ORDERS.FEATURED
  );
  const [selectedType, setSelectedType] = useState<string>(FILTER_TYPES.ALL);
  const [hoveredFromTag, setHoveredFromTag] = useState<string | null>(null);
  const [hoveredToTag, setHoveredToTag] = useState<string | null>(null);
  const [hoveredLLM, setHoveredLLM] = useState(false);
  const [llmTooltipPos, setLlmTooltipPos] = useState({ top: 0, left: 0 });

  const filterMenuRef = useRef<HTMLDivElement>(null);
  const inputMenuRef = useRef<HTMLDivElement>(null);
  const outputMenuRef = useRef<HTMLDivElement>(null);
  const llmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target as Node)
      ) {
        setIsFilterOpen(false);
        setActiveSubMenu(null);
      }
      if (
        inputMenuRef.current &&
        !inputMenuRef.current.contains(e.target as Node)
      )
        setIsInputMenuOpen(false);
      if (
        outputMenuRef.current &&
        !outputMenuRef.current.contains(e.target as Node)
      )
        setIsOutputMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Always allow Text and Image tags for filtering
  const availableFilterTags = ['text', 'image'];

  const toggleTag = (type: 'from' | 'to', tagId: string) => {
    // Only allow Text and Image tags
    if (!availableFilterTags.includes(tagId)) {
      return;
    }

    if (type === 'from') {
      toggleFromTag(tagId);
    } else {
      toggleToTag(tagId);
    }
  };

  const navItems = [
    { id: SIDEBAR_TABS.SEARCH, icon: Search, label: 'Search' },
    { id: SIDEBAR_TABS.HISTORY, icon: History, label: 'Quick access' },
    { id: SIDEBAR_TABS.LIBRARY, icon: Briefcase, label: 'Library' },
    { id: SIDEBAR_TABS.ASSETS, icon: ImageIcon, label: 'Assets' },
    { id: SIDEBAR_TABS.MEDIA, icon: Video, label: 'Media' },
    { id: SIDEBAR_TABS.NODES, icon: Box, label: 'Nodes' },
    { id: SIDEBAR_TABS.AI_TOOLS, icon: Sparkles, label: 'AI Tools' },
  ];

  const quickAccess = [
    {
      icon: Type,
      label: 'Text',
      type: 'text' as const,
      category: 'tools' as const,
      fromTags: [] as string[],
      toTags: ['text'] as string[],
    },
    {
      icon: ImageIcon,
      label: 'Image',
      type: 'image' as const,
      category: 'tools' as const,
      fromTags: [] as string[],
      toTags: ['image'] as string[],
    },
    {
      icon: Sparkles,
      label: 'Run Any LLM',
      type: 'llm' as const,
      category: 'models' as const,
      fromTags: ['text', 'image'] as string[],
      toTags: ['text'] as string[],
    },
  ];

  const filteredItems = quickAccess.filter((item) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        item.label.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (selectedType !== FILTER_TYPES.ALL) {
      if (selectedType === FILTER_TYPES.TOOLS && item.category !== 'tools')
        return false;
      if (selectedType === FILTER_TYPES.MODELS && item.category !== 'models')
        return false;
    }

    if (selectedFromTags.length > 0) {
      const hasMatchingFromTag = selectedFromTags.some((tag) =>
        item.fromTags.includes(tag)
      );
      if (!hasMatchingFromTag) return false;
    }

    if (selectedToTags.length > 0) {
      const hasMatchingToTag = selectedToTags.some((tag) =>
        item.toTags.includes(tag)
      );
      if (!hasMatchingToTag) return false;
    }

    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (selectedOrder) {
      case FILTER_ORDERS.FEATURED:
      default:
        return 0;
    }
  });

  return (
    <div className='flex h-full select-none'>
      <aside className='w-[60px] flex flex-col bg-panel-bg border-r border-panel-border z-20'>
        <div className='h-14 flex items-center justify-center mb-6'>
          <div className='w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center text-white font-bold text-xs'>
            W
          </div>
        </div>

        <nav className='flex-1 flex flex-col items-center gap-4 px-2'>
          {navItems
            .filter(
              (item) =>
                item.id === SIDEBAR_TABS.SEARCH ||
                item.id === SIDEBAR_TABS.HISTORY
            )
            .map((item) => (
              <Tooltip key={item.id} text={item.label}>
                <button
                  onClick={() =>
                    setActiveTab(activeTab === item.id ? null : item.id)
                  }
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-sm transition-all cursor-pointer',
                    activeTab === item.id
                      ? 'bg-button-active text-black'
                      : 'text-panel-text enabled:hover:bg-panel-hover'
                  )}
                >
                  <item.icon className='h-5 w-5' strokeWidth={1.5} />
                </button>
              </Tooltip>
            ))}

          <div className='mt-auto mb-4'>
            <Tooltip text='Create new workflow' position='right'>
              <button
                onClick={async () => {
                  try {
                    const workflowId = await createNewWorkflow();
                    if (typeof window !== 'undefined' && workflowId) {
                      toast.success('New workflow created');
                      window.location.href = `/flow/${workflowId}`;
                    }
                  } catch (error) {
                    console.error('Failed to create new workflow:', error);
                    toast.error(
                      'Failed to create new workflow. Please try again.'
                    );
                  }
                }}
                className='w-10 h-10 flex items-center justify-center rounded-sm transition-all cursor-pointer text-panel-text enabled:hover:bg-panel-hover'
              >
                <Plus className='h-5 w-5' strokeWidth={1.5} />
              </button>
            </Tooltip>
          </div>
        </nav>
      </aside>

      <div
        className={cn(
          'h-full bg-panel-bg border-r border-panel-border transition-all duration-300 ease-in-out absolute left-[60px] top-0 z-20',
          activeTab
            ? 'w-[240px] opacity-100 overflow-visible'
            : 'w-0 opacity-0 border-r-0 overflow-hidden'
        )}
        style={{ boxShadow: '4px 0 12px rgba(0, 0, 0, 0.3)' }}
      >
        <div
          className={cn(
            'w-[240px] h-full flex flex-col transition-transform duration-500 ease-out',
            activeTab ? 'translate-x-0' : '-translate-x-8'
          )}
          style={{ zIndex: 10000 }}
        >
          <div className='flex flex-col shrink-0'>
            <div className='h-[74px] relative'>
              <div className='absolute top-[31px] left-[35px] text-sm font-light text-white tracking-tight truncate w-[160px]'>
                {projectName || 'untitled'}
              </div>
            </div>
            <div className='h-px bg-panel-border w-full' />

            <div className='p-4 flex flex-col gap-3 overflow-visible'>
              <div className='flex items-center gap-2 relative'>
                <div className='relative flex-1 group'>
                  <div className='absolute inset-y-0 left-3 flex items-center pointer-events-none'>
                    <Search
                      className='h-3.5 w-3.5 text-white/70'
                      strokeWidth={2}
                    />
                  </div>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveTab(SIDEBAR_TABS.SEARCH);
                    }}
                    placeholder='Search'
                    className='w-full bg-transparent border border-panel-border rounded-md py-1.5 pl-9 pr-4 text-xs text-panel-text placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors cursor-text'
                  />
                </div>
                {activeTab === SIDEBAR_TABS.SEARCH && (
                  <div className='relative'>
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={cn(
                        'flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border transition-colors text-xs font-light',
                        isFilterOpen
                          ? 'bg-[#3a3a3d] border-panel-border text-white'
                          : 'bg-[#2a2a2d] border-panel-border/50 text-panel-text-muted hover:text-white'
                      )}
                    >
                      <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.5'
                      >
                        <polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' />
                      </svg>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 transition-transform',
                          isFilterOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {isFilterOpen && (
                      <div
                        ref={filterMenuRef}
                        className='absolute top-[calc(100%+6px)] right-0 w-40 bg-panel-bg border border-panel-border rounded-md shadow-2xl py-1 z-20000 animate-in fade-in slide-in-from-top-2'
                      >
                        <div
                          className='relative px-1'
                          onMouseEnter={() => setActiveSubMenu('type')}
                          onMouseLeave={() => setActiveSubMenu(null)}
                        >
                          <button
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-1 text-xs text-panel-text hover:bg-panel-hover rounded-md transition-colors group',
                              activeSubMenu === 'type' && 'bg-panel-hover'
                            )}
                          >
                            <span className='font-light'>Type</span>
                            <ChevronRight className='h-3.5 w-3.5 text-panel-text-muted group-hover:text-white' />
                          </button>

                          {activeSubMenu === 'type' && (
                            <div className='absolute left-[calc(100%-4px)] top-0 w-32 bg-panel-bg border border-panel-border rounded-md shadow-2xl py-1 z-20000 animate-in fade-in slide-in-from-left-2'>
                              {[
                                FILTER_TYPES.ALL,
                                FILTER_TYPES.TOOLS,
                                FILTER_TYPES.MODELS,
                              ].map((type) => (
                                <button
                                  key={type}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedType(type);
                                    setIsFilterOpen(false);
                                    setActiveSubMenu(null);
                                  }}
                                  className='w-full flex items-center justify-between px-3 py-1 text-xs text-panel-text hover:bg-panel-hover rounded-md transition-colors'
                                >
                                  <span className='capitalize font-light'>
                                    {type}
                                  </span>
                                  {selectedType === type && (
                                    <Check className='h-3.5 w-3.5 text-white' />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className='h-px bg-panel-border mx-3 my-1' />

                        <div className='pl-4 py-0.5 text-xs font-light text-panel-text-muted capitalize text-left'>
                          Order
                        </div>
                        <div className='px-1 flex flex-col'>
                          {[
                            { id: FILTER_ORDERS.FEATURED, label: 'Featured' },
                          ].map((order) => (
                            <button
                              key={order.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order.id);
                                setIsFilterOpen(false);
                              }}
                              className='w-full flex items-center justify-between px-3 py-1 text-xs text-panel-text hover:bg-panel-hover rounded-md transition-colors'
                            >
                              <span className='font-light'>{order.label}</span>
                              {selectedOrder === order.id && (
                                <Check className='h-3.5 w-3.5 text-white' />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {activeTab === SIDEBAR_TABS.SEARCH && (
                <div className='relative overflow-visible'>
                  <div className='flex flex-wrap items-center gap-1.5 text-xs font-normal text-panel-text'>
                    <div className='flex items-center gap-1.5'>
                      <span
                        className='text-white h-6 flex items-center px-0.5 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap font-mono text-xs'
                        onClick={() => setIsInputMenuOpen(!isInputMenuOpen)}
                      >
                        From
                      </span>

                      <div className='relative flex flex-wrap items-center gap-1.5'>
                        {selectedFromTags.filter((tagId) =>
                          availableFilterTags.includes(tagId)
                        ).length > 0 ? (
                          <div className='flex flex-wrap items-center gap-1.5'>
                            {selectedFromTags
                              .filter((tagId) =>
                                availableFilterTags.includes(tagId)
                              )
                              .map((tagId) => {
                                const tag = SIDEBAR_TAGS.find(
                                  (t) => t.id === tagId
                                );
                                if (!tag) return null;
                                return (
                                  <div
                                    key={tagId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsInputMenuOpen(true);
                                    }}
                                    onMouseEnter={() =>
                                      setHoveredFromTag(tagId)
                                    }
                                    onMouseLeave={() => setHoveredFromTag(null)}
                                    className='relative inline-flex items-center px-1 py-0 rounded text-xs font-normal font-mono leading-normal text-black cursor-pointer shadow-sm transition-all duration-200 w-fit'
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    <span className='whitespace-nowrap'>
                                      {tag.label}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTag('from', tagId);
                                      }}
                                      className={cn(
                                        'shrink-0 flex items-center cursor-pointer transition-all duration-200 overflow-hidden',
                                        hoveredFromTag === tagId
                                          ? 'ml-1 max-w-[20px] opacity-100'
                                          : 'ml-0 max-w-0 opacity-0'
                                      )}
                                    >
                                      <X className='h-3 w-3' />
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsInputMenuOpen(!isInputMenuOpen)}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[11px] font-normal font-mono leading-normal border transition-colors cursor-pointer whitespace-nowrap',
                              isInputMenuOpen
                                ? 'bg-[#3a3a3d] text-white border-panel-border'
                                : 'bg-[#2a2a2d] text-panel-text-muted hover:text-white border-panel-border/50'
                            )}
                          >
                            Input
                          </button>
                        )}

                        {isInputMenuOpen && (
                          <div
                            ref={inputMenuRef}
                            className='absolute top-[calc(100%+6px)] left-0 w-auto bg-panel-bg border border-panel-border rounded-lg shadow-2xl p-1 z-20000 animate-in fade-in slide-in-from-top-1 duration-200'
                          >
                            <div className='flex flex-col gap-0.5'>
                              {SIDEBAR_TAGS.filter((tag) =>
                                availableFilterTags.includes(tag.id)
                              ).map((tag) => {
                                const isSelected = selectedFromTags.includes(
                                  tag.id
                                );
                                return (
                                  <div
                                    key={tag.id}
                                    onClick={() => toggleTag('from', tag.id)}
                                    className='flex items-center justify-between gap-2 px-1 py-0.5 rounded hover:bg-panel-hover transition-colors cursor-pointer'
                                  >
                                    <div
                                      className='px-1.5 py-0.5 rounded text-[11px] font-normal font-mono leading-normal text-black whitespace-nowrap'
                                      style={{ backgroundColor: tag.color }}
                                    >
                                      {tag.label}
                                    </div>
                                    <Check
                                      className={cn(
                                        'h-3.5 w-3.5 shrink-0',
                                        isSelected
                                          ? 'text-white'
                                          : 'text-transparent'
                                      )}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-1.5'>
                      <span
                        className='text-white h-6 flex items-center px-1 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap font-mono text-xs'
                        onClick={() => setIsOutputMenuOpen(!isOutputMenuOpen)}
                      >
                        to
                      </span>

                      <div className='relative flex flex-wrap items-center gap-1.5'>
                        {selectedToTags.filter((tagId) =>
                          availableFilterTags.includes(tagId)
                        ).length > 0 ? (
                          <div className='flex flex-wrap items-center gap-1.5'>
                            {selectedToTags
                              .filter((tagId) =>
                                availableFilterTags.includes(tagId)
                              )
                              .map((tagId) => {
                                const tag = SIDEBAR_TAGS.find(
                                  (t) => t.id === tagId
                                );
                                if (!tag) return null;
                                return (
                                  <div
                                    key={tagId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsOutputMenuOpen(true);
                                    }}
                                    onMouseEnter={() => setHoveredToTag(tagId)}
                                    onMouseLeave={() => setHoveredToTag(null)}
                                    className='relative inline-flex items-center px-1 py-0 rounded text-xs font-normal font-mono leading-normal text-black cursor-pointer shadow-sm transition-all duration-200 w-fit'
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    <span className='whitespace-nowrap'>
                                      {tag.label}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTag('to', tagId);
                                      }}
                                      className={cn(
                                        'shrink-0 flex items-center cursor-pointer transition-all duration-200 overflow-hidden',
                                        hoveredToTag === tagId
                                          ? 'ml-1 max-w-[20px] opacity-100'
                                          : 'ml-0 max-w-0 opacity-0'
                                      )}
                                    >
                                      <X className='h-3 w-3' />
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setIsOutputMenuOpen(!isOutputMenuOpen)
                            }
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[11px] font-normal font-mono leading-normal border transition-colors cursor-pointer whitespace-nowrap',
                              isOutputMenuOpen
                                ? 'bg-[#3a3a3d] text-white border-panel-border'
                                : 'bg-[#2a2a2d] text-panel-text-muted hover:text-white border-panel-border/50'
                            )}
                          >
                            Output
                          </button>
                        )}

                        {isOutputMenuOpen && (
                          <div
                            ref={outputMenuRef}
                            className='absolute top-[calc(100%+6px)] left-0 w-auto bg-panel-bg border border-panel-border rounded-lg shadow-2xl p-1 z-20000 animate-in fade-in slide-in-from-top-1 duration-200'
                          >
                            <div className='flex flex-col gap-0.5'>
                              {SIDEBAR_TAGS.filter((tag) =>
                                availableFilterTags.includes(tag.id)
                              ).map((tag) => {
                                const isSelected = selectedToTags.includes(
                                  tag.id
                                );
                                return (
                                  <div
                                    key={tag.id}
                                    onClick={() => toggleTag('to', tag.id)}
                                    className='flex items-center justify-between gap-2 px-1 py-0.5 rounded hover:bg-panel-hover transition-colors cursor-pointer'
                                  >
                                    <div
                                      className='px-1.5 py-0.5 rounded text-[11px] font-normal font-mono leading-normal text-black whitespace-nowrap'
                                      style={{ backgroundColor: tag.color }}
                                    >
                                      {tag.label}
                                    </div>
                                    <Check
                                      className={cn(
                                        'h-3.5 w-3.5 shrink-0',
                                        isSelected
                                          ? 'text-white'
                                          : 'text-transparent'
                                      )}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {activeTab === 'search' && (
              <div className='h-px bg-panel-border w-full' />
            )}
          </div>

          <div
            className={cn(
              'flex-1 overflow-y-auto overflow-x-visible p-4 flex flex-col gap-6 hide-scrollbar',
              activeTab === 'search' ? 'pt-3' : 'pt-0'
            )}
            style={
              {
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              } as React.CSSProperties & { msOverflowStyle: string }
            }
          >
            {sortedItems.length > 0 && (
              <section className='pt-4'>
                <h2 className='text-[15px] font-normal text-white mb-4'>
                  Quick access
                </h2>
                <div
                  className='grid grid-cols-2 gap-2 relative'
                  style={{ zIndex: 10001 }}
                >
                  {sortedItems.map((item, index) => (
                    <div
                      key={index}
                      className='relative group'
                      onMouseEnter={() => {
                        if (item.type === 'llm') {
                          setHoveredLLM(true);
                          if (llmButtonRef.current) {
                            const rect =
                              llmButtonRef.current.getBoundingClientRect();
                            setLlmTooltipPos({
                              top: rect.top,
                              left: rect.right + 4,
                            });
                          }
                        }
                      }}
                      onMouseLeave={() =>
                        item.type === 'llm' && setHoveredLLM(false)
                      }
                    >
                      <button
                        ref={item.type === 'llm' ? llmButtonRef : null}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'application/reactflow',
                            item.type
                          );
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => {
                          addNode(item.type, { x: 300, y: 200 });
                        }}
                        className='flex flex-col items-center justify-center gap-1.5 aspect-square p-2 rounded border border-panel-border bg-panel-bg hover:bg-panel-hover transition-colors cursor-grab w-full'
                      >
                        <item.icon
                          className='h-5 w-5 text-white'
                          strokeWidth={1.2}
                        />
                        <span className='text-xs font-light text-white text-center px-1 leading-tight'>
                          {item.label}
                        </span>
                      </button>
                      {item.type === 'llm' && hoveredLLM && (
                        <div
                          className='fixed w-[280px] bg-panel-hover border border-panel-border rounded-md p-4 shadow-2xl z-99999'
                          style={{
                            top: `${llmTooltipPos.top}px`,
                            left: `${llmTooltipPos.left}px`,
                          }}
                        >
                          <h3 className='text-sm font-normal text-white mb-2'>
                            Run Any LLM
                          </h3>
                          <p className='text-xs font-light text-white mb-3'>
                            Run any large language model.
                          </p>
                          <div className='flex items-center gap-1.5 text-[10px] font-normal'>
                            <span className='text-white'>From</span>
                            <span
                              className='px-1.5 py-0.5 rounded text-[10px] font-normal font-mono leading-normal text-black'
                              style={{ backgroundColor: '#6edeb3' }}
                            >
                              Image
                            </span>
                            <span
                              className='px-1.5 py-0.5 rounded text-[10px] font-normal font-mono leading-normal text-black'
                              style={{ backgroundColor: '#f2a0fa' }}
                            >
                              Text
                            </span>
                            <span className='text-white'>to</span>
                            <span
                              className='px-1.5 py-0.5 rounded text-[10px] font-normal font-mono leading-normal text-black'
                              style={{ backgroundColor: '#6edeb3' }}
                            >
                              Image
                            </span>
                            <span
                              className='px-1.5 py-0.5 rounded text-[10px] font-normal font-mono leading-normal text-black'
                              style={{ backgroundColor: '#f2a0fa' }}
                            >
                              Text
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(searchQuery.trim() ||
              selectedType !== FILTER_TYPES.ALL ||
              selectedFromTags.length > 0 ||
              selectedToTags.length > 0) &&
              sortedItems.length === 0 && (
                <div className='flex flex-col items-center justify-center py-10 text-center px-4 animate-in fade-in zoom-in duration-300'>
                  <div className='w-12 h-12 rounded-full bg-panel-border/30 flex items-center justify-center mb-3'>
                    <Search
                      className='h-5 w-5 text-panel-text-muted'
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className='text-sm font-light text-white mb-1'>
                    {searchQuery.trim()
                      ? `No results matching "${searchQuery}"`
                      : 'No results matching your filters'}
                  </h3>
                  <p className='text-xs text-panel-text-muted max-w-[160px]'>
                    {selectedFromTags.length > 0 || selectedToTags.length > 0
                      ? 'No nodes support the selected input/output types. Try adjusting your filters.'
                      : 'Try adjusting your search or filters to find what you&apos;re looking for.'}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
