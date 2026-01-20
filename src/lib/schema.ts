import { z } from 'zod'

export const llmRequestSchema = z.object({
  model: z.enum(['gemini-2.5-flash']),
  systemPrompt: z.string().optional(),
  userMessage: z.string(),
  images: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  thinking: z.boolean().optional(),
})

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const textNodeDataSchema = z.object({
  label: z.string(),
  content: z.string(),
  type: z.literal('text'),
  locked: z.boolean().optional(),
  viewMode: z.enum(['single', 'all']).optional(),
}).passthrough()

const imageNodeDataSchema = z.object({
  label: z.string(),
  imageUrl: z.string().nullable(),
  imageFile: z.any().nullable(), // File objects can't be serialized
  type: z.literal('image'),
  locked: z.boolean().optional(),
  viewMode: z.enum(['single', 'all']).optional(),
  images: z.array(z.object({
    id: z.string(),
    url: z.string(),
    file: z.any().nullable(),
  })).optional(),
}).passthrough()

const llmNodeDataSchema = z.object({
  label: z.string(),
  model: z.string(),
  isRunning: z.boolean(),
  output: z.string(),
  error: z.string().nullable(),
  type: z.literal('llm'),
  locked: z.boolean().optional(),
  temperature: z.number().optional(),
  thinking: z.boolean().optional(),
  imageInputCount: z.number().optional(),
}).passthrough()

const cropNodeDataSchema = z.object({
  label: z.string(),
  xPercent: z.number(),
  yPercent: z.number(),
  widthPercent: z.number(),
  heightPercent: z.number(),
  isProcessing: z.boolean(),
  outputUrl: z.string().nullable(),
  error: z.string().nullable(),
  type: z.literal('crop'),
  locked: z.boolean().optional(),
  viewMode: z.enum(['single', 'all']).optional(),
}).passthrough()

const extractNodeDataSchema = z.object({
  label: z.string(),
  timestamp: z.string(),
  isProcessing: z.boolean(),
  outputUrl: z.string().nullable(),
  error: z.string().nullable(),
  type: z.literal('extract'),
  locked: z.boolean().optional(),
  viewMode: z.enum(['single', 'all']).optional(),
}).passthrough()

const videoNodeDataSchema = z.object({
  label: z.string(),
  videoUrl: z.string().nullable(),
  videoFile: z.any().nullable(), // File objects can't be serialized
  type: z.literal('video'),
  locked: z.boolean().optional(),
  viewMode: z.enum(['single', 'all']).optional(),
}).passthrough()

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'llm', 'crop', 'extract', 'video']),
  position: positionSchema,
  data: z.union([
    textNodeDataSchema, 
    imageNodeDataSchema, 
    llmNodeDataSchema,
    cropNodeDataSchema,
    extractNodeDataSchema,
    videoNodeDataSchema,
  ]),
  selected: z.boolean().optional(),
  dragging: z.boolean().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
}).passthrough()

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  animated: z.boolean().optional(),
  type: z.string().optional(),
  style: z.record(z.string(), z.any()).optional(),
  data: z.record(z.string(), z.any()).optional(),
}).passthrough()

export const workflowCreateSchema = z.object({
  name: z.string().min(1),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  version: z.string().optional(),
})

export const workflowUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  nodes: z.array(nodeSchema).optional(),
  edges: z.array(edgeSchema).optional(),
  version: z.string().optional(),
})

