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
  IMAGE_URL: 'image_url',
  VIDEO_URL: 'video_url',
  X_PERCENT: 'x_percent',
  Y_PERCENT: 'y_percent',
  WIDTH_PERCENT: 'width_percent',
  HEIGHT_PERCENT: 'height_percent',
  TIMESTAMP: 'timestamp',
} as const;

export const NODE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  LLM: 'llm',
  CROP: 'crop',
  EXTRACT: 'extract',
} as const;

export type NodeType = typeof NODE_TYPES[keyof typeof NODE_TYPES];