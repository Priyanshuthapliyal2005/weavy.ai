import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Node, Edge, applyNodeChanges, applyEdgeChanges, addEdge, type NodeChange, type EdgeChange, type Connection } from '@xyflow/react'
import type { CustomNode, TextNodeData, ImageNodeData, LLMNodeData, WorkflowJSON } from '@/types/workflow'
import { NODE_COLORS } from '@/constants/colors'
import { getHandleColor } from '@/lib/handle-colors'
import { HANDLE_IDS } from '@/constants/node-ids'

export type InteractionMode = 'select' | 'pan'
const WORKFLOW_VERSION = '1.0.0'
const HISTORY_LIMIT = 50

export interface WorkflowNode extends Node {
  data: {
    label?: string
    locked?: boolean
    viewMode?: 'single' | 'all'
    content?: string
    type?: string
    [key: string]: any
  }
}

export interface WorkflowEdge extends Edge {
  data?: {
    sourceColor?: string
    targetColor?: string
    sourceHandle?: string
    targetHandle?: string
  }
}

interface WorkflowStore {
  // State
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  interactionMode: InteractionMode
  projectName: string
  activeTab: string | null
  workflowId: string | null
  history: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }[]
  historyIndex: number
  selectedFromTags: string[]
  selectedToTags: string[]

  // Actions
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: WorkflowEdge[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (params: Connection) => void
  addNode: (type: 'text' | 'image' | 'llm' | 'video' | 'crop' | 'extract', position: { x: number; y: number }) => string
  setActiveTab: (tab: string | null) => void
  setSelectedFromTags: (tags: string[]) => void
  setSelectedToTags: (tags: string[]) => void
  toggleFromTag: (tagId: string) => void
  toggleToTag: (tagId: string) => void
  createNewWorkflow: () => Promise<string>
  selectNode: (nodeId: string | null) => void
  saveToHistory: () => void
  setProjectName: (name: string) => void
  updateNodeData: (nodeId: string, data: any) => void
  deleteNode: (nodeId: string) => void
  loadProductAnalysisWorkflow: () => void
  setInteractionMode: (mode: InteractionMode) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  exportWorkflow: () => WorkflowJSON
  importWorkflow: (workflow: WorkflowJSON) => void
  clearWorkflow: () => void
  saveWorkflowToDB: (name: string, workflow: WorkflowJSON) => Promise<string | null>
  loadWorkflowFromDB: (id: string) => Promise<void>
  clearWorkflowId: () => void
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      interactionMode: 'select',
      projectName: 'untitled',
      activeTab: null,
      workflowId: null,
      history: [],
      historyIndex: -1,
      selectedFromTags: [],
      selectedToTags: [],

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      setInteractionMode: (mode) => set({ interactionMode: mode }),
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setSelectedFromTags: (tags) => set({ selectedFromTags: tags }),
      
      setSelectedToTags: (tags) => set({ selectedToTags: tags }),
      
      toggleFromTag: (tagId) => {
        const current = get().selectedFromTags;
        if (current.includes(tagId)) {
          set({ selectedFromTags: current.filter(id => id !== tagId) });
        } else {
          set({ selectedFromTags: [...current, tagId] });
        }
      },
      
      toggleToTag: (tagId) => {
        const current = get().selectedToTags;
        if (current.includes(tagId)) {
          set({ selectedToTags: current.filter(id => id !== tagId) });
        } else {
          set({ selectedToTags: [...current, tagId] });
        }
      },
      
      createNewWorkflow: async () => {
        try {
          const response = await fetch('/api/workflows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'untitled',
              workflow: { nodes: [], edges: [], version: WORKFLOW_VERSION },
            }),
          });
          
          if (!response.ok) throw new Error('Failed to create workflow');
          
          const data = await response.json();
          set({ 
            workflowId: data.id,
            projectName: 'untitled',
            nodes: [],
            edges: [],
            history: [],
            historyIndex: -1,
          });
          
          return data.id;
        } catch (error) {
          console.error('Error creating workflow:', error);
          throw error;
        }
      },

      // Actions
      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[],
        })
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges) as WorkflowEdge[],
        })
      },

      onConnect: (params) => {
        const sourceNode = get().nodes.find((n) => n.id === params.source)
        const targetNode = get().nodes.find((n) => n.id === params.target)
        
        if (!sourceNode || !targetNode) return

        const sourceHandleId = params.sourceHandle || 'output'
        const targetHandleId = params.targetHandle || 'input'
        
        const sourceColor = getHandleColor(sourceHandleId, sourceNode.type as 'text' | 'image' | 'llm', true)
        const targetColor = getHandleColor(targetHandleId, targetNode.type as 'text' | 'image' | 'llm', false)
        
        const newEdge: WorkflowEdge = {
          id: `edge-${Date.now()}`,
          source: params.source!,
          target: params.target!,
          sourceHandle: sourceHandleId,
          targetHandle: targetHandleId,
          type: 'default',
          style: { strokeWidth: 2 },
          data: {
            sourceColor,
            targetColor,
            sourceHandle: sourceHandleId,
            targetHandle: targetHandleId,
          },
        }
        
        set((state) => ({
          edges: [...state.edges, newEdge]
        }))
        get().saveToHistory()
      },

      addNode: (type, position) => {
        const id = `${type}-${Date.now()}`
        let newNode: WorkflowNode

        switch (type) {
          case 'text':
            newNode = {
              id,
              type: 'text',
              position,
              data: {
                label: 'Text',
                content: '',
                type: 'text',
              },
            }
            break
          case 'image':
            newNode = {
              id,
              type: 'image',
              position,
              data: {
                label: 'Upload Image',
                imageUrl: null,
                imageFile: null,
                type: 'image',
              },
            }
            break
          case 'video':
            newNode = {
              id,
              type: 'video',
              position,
              data: {
                label: 'Upload Video',
                videoUrl: null,
                videoFile: null,
                type: 'video',
              },
            }
            break
          case 'llm':
            newNode = {
              id,
              type: 'llm',
              position,
              data: {
                label: 'Run Any LLM',
                model: 'gemini-2.5-flash',
                isRunning: false,
                output: '',
                error: null,
                type: 'llm',
              },
            }
            break
          case 'crop':
            newNode = {
              id,
              type: 'crop',
              position,
              data: {
                label: 'Crop Image',
                xPercent: 0,
                yPercent: 0,
                widthPercent: 100,
                heightPercent: 100,
                isProcessing: false,
                outputUrl: null,
                error: null,
                type: 'crop',
              },
            }
            break
          case 'extract':
            newNode = {
              id,
              type: 'extract',
              position,
              data: {
                label: 'Extract Frame',
                timestamp: '0',
                isProcessing: false,
                outputUrl: null,
                error: null,
                type: 'extract',
              },
            }
            break
          default:
            newNode = {
              id,
              type,
              position,
              data: { label: type, type },
            }
        }

        set((state) => ({
          nodes: [...state.nodes, newNode]
        }))
        get().saveToHistory()
        return id
      },

      selectNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.map((node) => ({
            ...node,
            selected: node.id === nodeId
          }))
        }))
      },

      saveToHistory: () => {
        const { nodes, edges, history, historyIndex } = get()
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push({ nodes: [...nodes], edges: [...edges] })
        
        if (newHistory.length > HISTORY_LIMIT) {
          newHistory.shift()
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        })
      },

      undo: () => {
        const { history, historyIndex } = get()
        if (historyIndex > 0) {
          const prev = history[historyIndex - 1]
          set({
            nodes: prev.nodes,
            edges: prev.edges,
            historyIndex: historyIndex - 1,
          })
        }
      },

      redo: () => {
        const { history, historyIndex } = get()
        if (historyIndex < history.length - 1) {
          const next = history[historyIndex + 1]
          set({
            nodes: next.nodes,
            edges: next.edges,
            historyIndex: historyIndex + 1,
          })
        }
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      setProjectName: (name) => {
        set({ projectName: name })
      },

      updateNodeData: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
          ) as WorkflowNode[]
        }))
      },

      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        }))
        get().saveToHistory()
      },

      exportWorkflow: () => {
        const { nodes, edges } = get()
        return {
          nodes: nodes as unknown as CustomNode[],
          edges,
          version: WORKFLOW_VERSION,
        }
      },

      importWorkflow: (workflow) => {
        set({
          nodes: workflow.nodes as unknown as WorkflowNode[],
          edges: workflow.edges as WorkflowEdge[],
        })
        get().saveToHistory()
      },

      clearWorkflow: () => {
        set({
          nodes: [],
          edges: [],
          workflowId: null,
        })
        get().saveToHistory()
      },

      clearWorkflowId: () => {
        set({ workflowId: null })
      },

      saveWorkflowToDB: async (name, workflow) => {
        const { workflowId } = get()
        
        const url = workflowId ? `/api/workflows/${workflowId}` : '/api/workflows'
        const method = workflowId ? 'PUT' : 'POST'
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nodes: workflow.nodes,
            edges: workflow.edges,
            version: workflow.version,
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to save workflow')
        }
        
        const data = await response.json()
        const savedId = data.id || workflowId
        
        set({ workflowId: savedId, projectName: name })
        
        return savedId
      },

      loadWorkflowFromDB: async (id) => {
        const response = await fetch(`/api/workflows/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to load workflow')
        }
        
        const workflow = await response.json()
        
        set({
          nodes: workflow.nodes as WorkflowNode[],
          edges: workflow.edges as WorkflowEdge[],
          projectName: workflow.name,
          workflowId: id,
        })
        get().saveToHistory()
      },

      loadProductAnalysisWorkflow: () => {
        const workflowNodes: WorkflowNode[] = [
          {
            id: 'text1',
            type: 'text',
            position: { x: 100, y: 100 },
            data: {
              label: 'Text',
              content: 'Describe the product in the image.',
              type: 'text',
            },
          },
          {
            id: 'img1',
            type: 'image',
            position: { x: 100, y: 300 },
            data: {
              label: 'Image',
              imageUrl: null,
              imageFile: null,
              type: 'image',
            },
          },
          {
            id: 'llm1',
            type: 'llm',
            position: { x: 500, y: 200 },
            data: {
              label: 'Run Any LLM',
              model: 'gemini-2.5-flash',
              isRunning: false,
              output: '',
              error: null,
              type: 'llm',
            },
          },
        ]

        const workflowEdges: WorkflowEdge[] = [
          {
            id: 'e1',
            source: 'text1',
            target: 'llm1',
            sourceHandle: 'output',
            targetHandle: 'prompt',
            type: 'default',
            style: { strokeWidth: 2 },
            data: {
              sourceColor: NODE_COLORS.text,
              targetColor: NODE_COLORS.text,
              sourceHandle: 'output',
              targetHandle: 'prompt',
            },
          },
          {
            id: 'e2',
            source: 'img1',
            target: 'llm1',
            sourceHandle: 'output',
            targetHandle: 'image_1',
            type: 'default',
            style: { strokeWidth: 2 },
            data: {
              sourceColor: NODE_COLORS.image,
              targetColor: NODE_COLORS.image,
              sourceHandle: 'output',
              targetHandle: 'image_1',
            },
          },
        ]

        set({
          nodes: workflowNodes,
          edges: workflowEdges,
        })
        get().saveToHistory()
      },
    }),
    {
      name: 'workflow-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        projectName: state.projectName,
      }),
    }
  )
)