import type { Node, Edge } from "@xyflow/react"
export interface TextNodeData {
  label: string
  content: string
  type: "text"
  locked?: boolean
  viewMode?: 'single' | 'all'
  [key: string]: unknown
}

export interface ImageNodeData {
  label: string
  imageUrl: string | null
  imageFile: File | null
  type: "image"
  locked?: boolean
  viewMode?: 'single' | 'all'
  images?: Array<{ id: string; url: string; file: File | null }>
  [key: string]: unknown
}

export interface LLMNodeData {
  label: string
  model: string
  isRunning: boolean
  output: string
  error: string | null
  type: "llm"
  hasRun?: boolean
  locked?: boolean
  temperature?: number
  thinking?: boolean
  imageInputCount?: number
  [key: string]: unknown
}

export interface VideoNodeData {
  label: string
  videoUrl: string | null
  videoFile: File | null
  type: "video"
  locked?: boolean
  viewMode?: 'single' | 'all'
  [key: string]: unknown
}

export interface CropImageNodeData {
  label: string
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  isProcessing: boolean
  outputUrl: string | null
  error: string | null
  type: "crop"
  locked?: boolean
  [key: string]: unknown
}

export interface ExtractFrameNodeData {
  label: string
  timestamp: string
  isProcessing: boolean
  outputUrl: string | null
  error: string | null
  type: "extract"
  locked?: boolean
  [key: string]: unknown
}

export type CustomNodeData = TextNodeData | ImageNodeData | LLMNodeData | VideoNodeData | CropImageNodeData | ExtractFrameNodeData
export type TextNode = Node<TextNodeData, "text">
export type ImageNode = Node<ImageNodeData, "image">
export type LLMNode = Node<LLMNodeData, "llm">
export type VideoNode = Node<VideoNodeData, "video">
export type CropImageNode = Node<CropImageNodeData, "crop">
export type ExtractFrameNode = Node<ExtractFrameNodeData, "extract">

export type CustomNode = TextNode | ImageNode | LLMNode | VideoNode | CropImageNode | ExtractFrameNode
export interface WorkflowState {
  nodes: CustomNode[]
  edges: Edge[]
  selectedNode: string | null
}
export const GEMINI_MODELS = [
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
] as const

export type GeminiModel = (typeof GEMINI_MODELS)[number]["id"]

export interface WorkflowJSON {
  nodes: CustomNode[]
  edges: Edge[]
  version: string
}
