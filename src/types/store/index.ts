import type { NodeChange, EdgeChange, Connection } from '@xyflow/react'
import type { CustomNode, TextNodeData, ImageNodeData, LLMNodeData, WorkflowJSON } from '../workflow'
import type { Edge } from '@xyflow/react'
import type { InteractionMode } from '@/constants/workflow'

export interface WorkflowStore {
  nodes: CustomNode[]
  edges: Edge[]
  selectedNode: string | null   
  projectName: string
  activeTab: string | null
  workflowId: string | null
  history: { nodes: CustomNode[]; edges: Edge[] }[]
  historyIndex: number
  setNodes: (nodes: CustomNode[]) => void
  setEdges: (edges: Edge[]) => void
  onNodesChange: (changes: NodeChange<CustomNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: "text" | "image" | "llm", position: { x: number; y: number }) => string
  updateNodeData: (nodeId: string, data: Partial<TextNodeData | ImageNodeData | LLMNodeData>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setProjectName: (name: string) => void
  setActiveTab: (tab: string | null) => void
  interactionMode: InteractionMode
  setInteractionMode: (mode: InteractionMode) => void
  saveToHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  exportWorkflow: () => WorkflowJSON
  importWorkflow: (workflow: WorkflowJSON) => void
  clearWorkflow: () => void
  loadProductAnalysisWorkflow: () => void
  saveWorkflowToDB: (name: string, workflow: WorkflowJSON) => Promise<string | null>
  loadWorkflowFromDB: (workflowId: string) => Promise<void>
  createNewWorkflow: () => Promise<string>
  clearWorkflowId: () => void
  selectedFromTags: string[]
  selectedToTags: string[]
  setSelectedFromTags: (tags: string[]) => void
  setSelectedToTags: (tags: string[]) => void
  toggleFromTag: (tagId: string) => void
  toggleToTag: (tagId: string) => void
}

