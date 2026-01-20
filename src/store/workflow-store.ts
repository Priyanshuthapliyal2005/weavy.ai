import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Node, Edge, applyNodeChanges, applyEdgeChanges, addEdge, type NodeChange, type EdgeChange, type Connection } from '@xyflow/react'
import type { CustomNode, TextNodeData, ImageNodeData, LLMNodeData, WorkflowJSON } from '@/types/workflow'
import { NODE_COLORS } from '@/constants/colors'
import { getHandleColor } from '@/lib/handle-colors'
import { HANDLE_IDS } from '@/constants/node-ids'
import { validateConnection } from '@/lib/connection-validation'
import { SIDEBAR_TABS } from '@/constants/sidebar'

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
  rightSidebarOpen: boolean
  rightSidebarTab: 'tasks' | 'history'
  workflowId: string | null
  history: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }[]
  historyIndex: number
  selectedFromTags: string[]
  selectedToTags: string[]
  isExecuting: boolean
  executionResults: Map<string, any>
  galleryFocusNodeId: string | null

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
  loadSampleWorkflow: () => Promise<void>
  setInteractionMode: (mode: InteractionMode) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  openRightSidebar: (tab: 'tasks' | 'history') => void
  closeRightSidebar: () => void
  setRightSidebarTab: (tab: 'tasks' | 'history') => void
  exportWorkflow: () => WorkflowJSON
  importWorkflow: (workflow: WorkflowJSON) => void
  clearWorkflow: () => void
  saveWorkflowToDB: (name: string, workflow: WorkflowJSON) => Promise<string | null>
  saveWorkflow: () => Promise<string | null>
  loadWorkflowFromDB: (id: string) => Promise<void>
  clearWorkflowId: () => void
  executeWorkflow: (selectedNodeIds?: string[]) => Promise<void>
  setIsExecuting: (isExecuting: boolean) => void
  openGalleryForNode: (nodeId?: string) => void
  clearGalleryFocus: () => void
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
      rightSidebarOpen: false,
      rightSidebarTab: 'tasks',
      workflowId: null,
      history: [],
      historyIndex: -1,
      selectedFromTags: [],
      selectedToTags: [],
      isExecuting: false,
      executionResults: new Map(),
      galleryFocusNodeId: null,

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      setInteractionMode: (mode) => set({ interactionMode: mode }),
      
      setActiveTab: (tab) => set({ activeTab: tab }),

      openRightSidebar: (tab) => set({ rightSidebarOpen: true, rightSidebarTab: tab }),
      closeRightSidebar: () => set({ rightSidebarOpen: false }),
      setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
      
      setIsExecuting: (isExecuting) => set({ isExecuting }),

      openGalleryForNode: (nodeId) => {
        set({
          activeTab: SIDEBAR_TABS.GALLERY,
          galleryFocusNodeId: nodeId || null,
        })
      },

      clearGalleryFocus: () => set({ galleryFocusNodeId: null }),
      
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
              nodes: [],
              edges: [],
              version: WORKFLOW_VERSION,
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
        const validation = validateConnection(params, get().nodes, get().edges)
        if (!validation.ok) {
          return
        }

        const sourceNode = get().nodes.find((n) => n.id === params.source)
        const targetNode = get().nodes.find((n) => n.id === params.target)
        
        if (!sourceNode || !targetNode) return

        const sourceHandleId = params.sourceHandle || 'output'
        const targetHandleId = params.targetHandle || 'input'
        
        const sourceColor = getHandleColor(sourceHandleId, sourceNode.type as any, true)
        const targetColor = getHandleColor(targetHandleId, targetNode.type as any, false)
        
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

      saveWorkflow: async () => {
        const { projectName } = get()
        const workflow = get().exportWorkflow()
        return await get().saveWorkflowToDB(projectName || 'untitled', workflow)
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

      loadSampleWorkflow: async () => {
        try {
          const response = await fetch('/sample-workflows/product-marketing-kit.json', {
            cache: 'no-store',
          })
          if (!response.ok) {
            throw new Error('Failed to load sample workflow')
          }

          const workflow = await response.json()

          set({
            nodes: (workflow.nodes || []) as WorkflowNode[],
            edges: (workflow.edges || []) as WorkflowEdge[],
            projectName: workflow.name || get().projectName,
          })
          get().saveToHistory()
        } catch (error) {
          console.error('Error loading sample workflow:', error)
          get().loadProductAnalysisWorkflow()
        }
      },

      executeWorkflow: async (selectedNodeIds?: string[]) => {
        let { nodes, edges, workflowId } = get();

        const selectedSet = new Set(
          (selectedNodeIds && selectedNodeIds.length > 0)
            ? selectedNodeIds
            : nodes.map((n) => n.id)
        );
        const scope = selectedNodeIds
          ? (selectedNodeIds.length === 1 ? 'single' : 'partial')
          : 'full';

        // Immediate UI feedback: mark nodes as running/processing and open history.
        set({
          isExecuting: true,
          rightSidebarOpen: true,
          rightSidebarTab: 'history',
          nodes: nodes.map((n) => {
            if (!selectedSet.has(n.id)) return n;
            const isProcessingType = n.type === 'crop' || n.type === 'extract';
            return {
              ...n,
              data: {
                ...n.data,
                isRunning: !isProcessingType,
                isProcessing: isProcessingType,
                lastRunStatus: 'running',
                lastRunError: null,
              },
            };
          }),
        });

        window.dispatchEvent(
          new CustomEvent('workflow-execution-started', {
            detail: { scope, selectedNodeIds: Array.from(selectedSet) },
          })
        );

        try {
          // Auto-create workflow if it doesn't exist yet
          if (!workflowId) {
            console.log('[executeWorkflow] Creating new workflow...');
            const response = await fetch('/api/workflows', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: get().projectName || 'untitled',
                nodes,
                edges,
                version: WORKFLOW_VERSION,
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              workflowId = data.id;
              set({ workflowId: data.id });
              console.log('[executeWorkflow] Workflow created:', workflowId);
            } else {
              const error = await response.text();
              console.error('[executeWorkflow] Failed to create workflow:', error);
              throw new Error('Failed to create workflow');
            }
          } else {
            console.log('[executeWorkflow] Using existing workflow:', workflowId);
          }

          console.log('[executeWorkflow] Executing workflow:', { workflowId, nodeCount: nodes.length, edgeCount: edges.length });
          
          const response = await fetch('/api/workflows/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowId: workflowId ?? undefined,
              nodes,
              edges,
              selectedNodeIds,
              scope,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[executeWorkflow] Execution failed:', errorText);
            throw new Error(`Workflow execution failed: ${errorText}`);
          }

          const result = await response.json();
          console.log('[executeWorkflow] Execution complete:', result);
          
          // Update execution results
          const resultsMap = new Map();
          result.nodeResults?.forEach((nr: any) => {
            resultsMap.set(nr.nodeId, nr.output);
            console.log('[executeWorkflow] Node result:', nr.nodeId, nr.status, nr.error || 'success');
          });
          set((state) => {
            const nodeResultById = new Map<string, any>();
            for (const nr of result.nodeResults || []) {
              nodeResultById.set(nr.nodeId, nr);
            }

            return {
              executionResults: resultsMap,
              nodes: state.nodes.map((n) => {
                if (!selectedSet.has(n.id)) return n;
                const nr = nodeResultById.get(n.id);
                const nextData: Record<string, any> = {
                  ...n.data,
                  isRunning: false,
                  isProcessing: false,
                  lastRunStatus: nr?.status || 'success',
                  lastRunError: nr?.error || null,
                };

                // Make workflow runs feel responsive: hydrate LLM output inline.
                if (n.type === 'llm' && nr && typeof nr.output !== 'undefined') {
                  nextData.output = typeof nr.output === 'string' ? nr.output : JSON.stringify(nr.output, null, 2);
                }

                return { ...n, data: nextData };
              }),
            };
          });

          // Trigger history refresh
          window.dispatchEvent(new CustomEvent('workflow-executed'));
          console.log('[executeWorkflow] History refresh triggered');
          
          return result;
        } catch (error) {
          console.error('Execution error:', error);
          window.dispatchEvent(
            new CustomEvent('workflow-execution-failed', {
              detail: {
                scope,
                message: error instanceof Error ? error.message : 'Unknown error',
              },
            })
          );
          throw error;
        } finally {
          set((state) => ({
            isExecuting: false,
            nodes: state.nodes.map((n) => {
              if (!selectedSet.has(n.id)) return n;
              return {
                ...n,
                data: {
                  ...n.data,
                  isRunning: false,
                  isProcessing: false,
                },
              };
            }),
          }));
        }
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