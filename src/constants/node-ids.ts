export const HANDLE_IDS = {
  INPUT: 'input',
  OUTPUT: 'output',
  PROMPT: 'prompt',
  SYSTEM_PROMPT: 'system_prompt',
  USER_MESSAGE: 'user_message',
  IMAGES: 'images',
  IMAGE: 'image',
  IMAGE_1: 'image_1',
  IMAGE_2: 'image_2',
  IMAGE_3: 'image_3',
} as const;

export const NODE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LLM: 'llm',
} as const;

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];