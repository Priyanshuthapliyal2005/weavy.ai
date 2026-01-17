export const NODE_COLORS = {
  text: '#f2a0fa', 
  image: '#6edeb3', 
  llm: '#68b0ff',
  video: '#10b981',
  crop: '#f59e0b',
  extract: '#8b5cf6',
} as const;

export const HANDLE_COLORS = {
  TEXT: '#f2a0fa',
  IMAGE: '#6edeb3',
  VIDEO: '#10b981',
  NUMBER: '#fbbf24',
  LLM: '#68b0ff',
  text: '#f2a0fa', 
  image: '#6edeb3', 
  llm: '#f2a0fa', 
  prompt: '#f2a0fa', 
  systemPrompt: '#f2a0fa', 
  default: '#6b7280',
} as const;

export type NodeType = keyof typeof NODE_COLORS;
export type HandleType = keyof typeof HANDLE_COLORS;