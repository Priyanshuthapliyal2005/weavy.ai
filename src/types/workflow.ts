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
  locked?: boolean
  temperature?: number
  thinking?: boolean
  imageInputCount?: number
  [key: string]: unknown
}

export type CustomNodeData = TextNodeData | ImageNodeData | LLMNodeData
export type TextNode = Node<TextNodeData, "text">
export type ImageNode = Node<ImageNodeData, "image">
export type LLMNode = Node<LLMNodeData, "llm">

export type CustomNode = TextNode | ImageNode | LLMNode
export interface WorkflowState {
  nodes: CustomNode[]
  edges: Edge[]
  selectedNode: string | null
}
export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
] as const

export type GeminiModel = (typeof GEMINI_MODELS)[number]["id"]

export interface WorkflowJSON {
  nodes: CustomNode[]
  edges: Edge[]
  version: string
}
