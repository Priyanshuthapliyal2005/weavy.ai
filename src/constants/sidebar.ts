export const SIDEBAR_TAGS = [
  { id: 'text', label: 'Text', color: '#f2a0fa' },
  { id: 'image', label: 'Image', color: '#6edeb3' },
  { id: 'video', label: 'Video', color: '#ef9192' },
  { id: '3d', label: '3D', color: '#6e6cec' },
  { id: 'mask', label: 'Mask', color: '#c2dd6f' },
  { id: 'audio', label: 'Audio', color: '#68b0ff' },
  { id: 'lora', label: 'LoRA', color: '#bb68ff' },
] as const;

export const SIDEBAR_TABS = {
  SEARCH: 'search',
  HISTORY: 'history',
  LIBRARY: 'library',
  ASSETS: 'assets',
  MEDIA: 'media',
  NODES: 'nodes',
  AI_TOOLS: 'ai',
} as const;

export const FILTER_ORDERS = {
  FEATURED: 'featured',
  PRICE_LOW: 'price_low',
  PRICE_HIGH: 'price_high',
} as const;

export const FILTER_TYPES = {
  ALL: 'all',
  TOOLS: 'tools',
  MODELS: 'models',
} as const;
