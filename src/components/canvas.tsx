"use client"

import type React from "react"

import { useCallback, useRef, useEffect, useState } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type OnConnect,
  type NodeTypes,
  MiniMap,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useWorkflowStore } from "@/store/workflow-store"
import { cn } from "@/lib/utils"
import { TextNode } from "./nodes/text-node"
import { ImageNode } from "./nodes/image-node"
import { LLMNode } from "./nodes/llm-node"
import { VideoNode } from "./nodes/video-node"
import { CropImageNode } from "./nodes/crop-image-node"
import { ExtractFrameNode } from "./nodes/extract-frame-node"
// import { Toolbar } from "./toolbar" // Removed legacy toolbar
import { NodeActionsSidebar } from "./node-actions-sidebar"
import { CustomConnectionLine } from "./custom-connection-line"
import { CustomEdge } from "./custom-edge"
import { CompatibleNodesMenu } from "./compatible-nodes-menu"
import type { EdgeTypes } from "@xyflow/react"
import { NODE_COLORS, HANDLE_COLORS } from "@/constants/colors"
import { getHandleColor } from "@/lib/handle-colors"
import { validateConnection } from "@/lib/connection-validation"
import { HANDLE_IDS } from "@/constants/node-ids"
import toast from "react-hot-toast"

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  llm: LLMNode,
  video: VideoNode,
  crop: CropImageNode,
  extract: ExtractFrameNode,
}

const edgeTypes: EdgeTypes = {
  default: CustomEdge,
}

interface WorkflowCanvasProps {
  showGrid: boolean;
}

export function WorkflowCanvas({ showGrid }: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    saveToHistory,
    interactionMode,
    projectName,
    setProjectName,
    activeTab,
    updateNodeData,
    deleteNode,
    loadProductAnalysisWorkflow,
    openRightSidebar,
    closeRightSidebar,
    rightSidebarTab,
  } = useWorkflowStore()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)
  const [selectedNodeForActions, setSelectedNodeForActions] = useState<string | null>(null)
  const [connectionLineColor, setConnectionLineColor] = useState<string>(NODE_COLORS.text)
  const [connectionTargetColor, setConnectionTargetColor] = useState<string | null>(null)
  const [isCompatibleMenuOpen, setIsCompatibleMenuOpen] = useState(false)
  const [compatibleMenuPosition, setCompatibleMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [connectionSourceInfo, setConnectionSourceInfo] = useState<{
    nodeId: string
    handleId: string
    nodeType?: 'text' | 'image' | 'llm' | 'video' | 'crop' | 'extract'
    isOutput: boolean
  } | null>(null)
  const [wasConnectionSuccessful, setWasConnectionSuccessful] = useState(false)
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, flowToScreenPosition, getNode } = useReactFlow()
  const lastInvalidConnectReasonRef = useRef<string | null>(null)

  
  useEffect(() => {
    const handleModalOpen = () => setIsModalOpen(true)
    const handleModalClose = () => setIsModalOpen(false)
    
    window.addEventListener('modal-open', handleModalOpen)
    window.addEventListener('modal-close', handleModalClose)
    
    return () => {
      window.removeEventListener('modal-open', handleModalOpen)
      window.removeEventListener('modal-close', handleModalClose)
    }
  }, [])

  
  useEffect(() => {
    const handleActionsMenuOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>
      if (customEvent.detail?.nodeId) {
        setSelectedNodeForActions(customEvent.detail.nodeId)
        setIsActionsMenuOpen(true)
      }
    }
    const handleActionsMenuClose = () => {
      setSelectedNodeForActions(null)
      setIsActionsMenuOpen(false)
    }
    
    window.addEventListener('node-actions-open', handleActionsMenuOpen as EventListener)
    window.addEventListener('node-actions-close', handleActionsMenuClose)
    window.addEventListener('actions-menu-close', handleActionsMenuClose)
    
    return () => {
      window.removeEventListener('node-actions-open', handleActionsMenuOpen as EventListener)
      window.removeEventListener('node-actions-close', handleActionsMenuClose)
      window.removeEventListener('actions-menu-close', handleActionsMenuClose)
    }
  }, [])

  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      const isCanvas = target.closest('.workflow-canvas') || target.closest('.react-flow')
      
      if (!isCanvas && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [])

  

  const handleConnect: OnConnect = useCallback(
    (params) => {
      setWasConnectionSuccessful(true)
      
      setIsCompatibleMenuOpen(false)
      setCompatibleMenuPosition(null)
      setConnectionSourceInfo(null)
      onConnect(params)
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('react-flow-connect-end'))
      }
    },
    [onConnect],
  )

  const isValidConnection = useCallback(
    (connection: any) => {
      const result = validateConnection(connection, nodes as any, edges as any)
      lastInvalidConnectReasonRef.current = result.ok ? null : result.reason
      return result.ok
    },
    [nodes, edges]
  )

  const handleConnectStart = useCallback(
    (event: any, params: { nodeId: string | null; handleId: string | null }) => {
      const { nodeId, handleId } = params
      if (nodeId && handleId && typeof window !== 'undefined') {
        setWasConnectionSuccessful(false)
        setIsCompatibleMenuOpen(false)
        setCompatibleMenuPosition(null)
        
        if (event && event instanceof MouseEvent) {
          setLastMousePosition({ x: event.clientX, y: event.clientY })
        } else {
          setLastMousePosition(null)
        }
        
        const sourceNode = nodes.find((n) => n.id === nodeId)
        if (sourceNode && sourceNode.type) {
          const isOutput = handleId === HANDLE_IDS.OUTPUT
          const nodeType = sourceNode.type as any
          
          const handleColor = getHandleColor(handleId, nodeType, isOutput)
          setConnectionLineColor(handleColor)
          
          setConnectionSourceInfo({
            nodeId,
            handleId,
            nodeType,
            isOutput,
          })
          
          window.dispatchEvent(
            new CustomEvent('react-flow-connect-start', {
              detail: {
                nodeId,
                handleId,
                nodeType,
                isOutput,
              },
            })
          )
        }
      }
    },
    [nodes]
  )

  
  useEffect(() => {
    if (!connectionSourceInfo) return
    
    const handleMouseMove = (e: MouseEvent) => {
      setLastMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      setLastMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [connectionSourceInfo])

  const handleConnectEnd = useCallback(
    (event?: MouseEvent | TouchEvent) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('react-flow-connect-end'))
        setConnectionTargetColor(null)
        
        const sourceInfo = connectionSourceInfo
        const wasSuccessful = wasConnectionSuccessful
        
        let mousePos: { x: number; y: number } | null = null
        
        if (event) {
          if (event instanceof MouseEvent) {
            mousePos = { x: event.clientX, y: event.clientY }
            setLastMousePosition(mousePos)
          } else if (event.touches && event.touches.length > 0) {
            mousePos = { x: event.touches[0].clientX, y: event.touches[0].clientY }
            setLastMousePosition(mousePos)
          }
        }
        
        const invalidReason = lastInvalidConnectReasonRef.current
        if (!wasSuccessful && invalidReason) {
          toast.error(invalidReason)
          lastInvalidConnectReasonRef.current = null
          // Don't open the compatible-nodes menu when the user tried an invalid connection.
          setIsCompatibleMenuOpen(false)
          setCompatibleMenuPosition(null)
          return
        }

        if (!wasSuccessful && sourceInfo) {
          const finalPos = mousePos || lastMousePosition || { 
            x: window.innerWidth / 2, 
            y: window.innerHeight / 2 
          }
          
          setCompatibleMenuPosition(finalPos)
          setIsCompatibleMenuOpen(true)
        } else if (wasSuccessful) {
          setConnectionSourceInfo(null)
          setLastMousePosition(null)
          setIsCompatibleMenuOpen(false)
          setCompatibleMenuPosition(null)
        }
      }
    },
    [wasConnectionSuccessful, connectionSourceInfo, lastMousePosition]
  )

  
  useEffect(() => {
    const handleTargetHover = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string; handleId?: string; color: string }>
      if (customEvent.detail) {
        
        setConnectionTargetColor(customEvent.detail.color)
      }
    }
    const handleTargetLeave = () => {
      setConnectionTargetColor(null)
    }

    window.addEventListener('connection-target-hover', handleTargetHover as EventListener)
    window.addEventListener('connection-target-leave', handleTargetLeave)
    return () => {
      window.removeEventListener('connection-target-hover', handleTargetHover as EventListener)
      window.removeEventListener('connection-target-leave', handleTargetLeave)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData("application/reactflow")
      if (!type) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addNode(type as "text" | "image" | "llm", position)
    },
    [addNode, screenToFlowPosition],
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      if (interactionMode === "select") {
        selectNode(node.id)
        
        const clickedNode = nodes.find((n) => n.id === node.id)
        // Open task panel for runnable nodes (llm, crop, extract)
        if (clickedNode?.type === 'llm' || clickedNode?.type === 'crop' || clickedNode?.type === 'extract') {
          openRightSidebar('tasks')
        }
      }
    },
    [selectNode, interactionMode, nodes, openRightSidebar],
  )

  const handlePaneClick = useCallback(() => {
    selectNode(null)
    if (rightSidebarTab === 'tasks') {
      closeRightSidebar()
    }
    
    setSelectedNodeForActions(null)
    setIsActionsMenuOpen(false)
    
    setIsCompatibleMenuOpen(false)
    setCompatibleMenuPosition(null)
    setConnectionSourceInfo(null)
  }, [selectNode, rightSidebarTab, closeRightSidebar])

  const handleNodesChangeWithHistory = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      
      const filteredChanges = changes.filter((change) => {
        if (change.type === "position" && change.dragging === true) {
          const node = nodes.find((n) => n.id === change.id)
          if (node?.data?.locked) {
            return false 
          }
        }
        return true
      })
      onNodesChange(filteredChanges)
      const hasPositionChange = filteredChanges.some((c) => c.type === "position" && !("dragging" in c && c.dragging))
      if (hasPositionChange) {
        saveToHistory()
      }
    },
    [onNodesChange, saveToHistory, nodes],
  )

  
  const isPanMode = interactionMode === "pan"

  
  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return
      }

      
      if (isModalOpen) {
        return
      }

      
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "=": 
          case "+":
            e.preventDefault()
            zoomIn({ duration: 200 })
            break
          case "-": 
          case "_":
            e.preventDefault()
            zoomOut({ duration: 200 })
            break
          case "0": 
            e.preventDefault()
            zoomTo(1, { duration: 200 })
            break
          case "1": 
            e.preventDefault()
            fitView({ padding: 0.2, duration: 200 })
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [zoomIn, zoomOut, zoomTo, fitView, isModalOpen])

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div ref={reactFlowWrapper} className="flex-1 bg-[#0e0e12] relative">
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            draggable: !node.data?.locked,
          }))}
          edges={edges}
          onNodesChange={handleNodesChangeWithHistory}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
                    isValidConnection={isValidConnection}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          connectionLineStyle={{ 
            strokeWidth: 2,
            stroke: connectionLineColor,
          }}
          connectionLineComponent={(props) => (
            <CustomConnectionLine 
              {...props} 
              sourceColor={connectionLineColor}
              targetColor={connectionTargetColor ?? undefined}
            />
          )}
          connectionLineType={undefined}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            animated: false,
            type: 'default',
            style: { strokeWidth: 2 },
          }}
          connectionMode={undefined}
          minZoom={0.1}
          maxZoom={4}
          
          panOnDrag={isPanMode && !isModalOpen ? true : [1, 2]} 
          selectionOnDrag={!isPanMode} 
          panOnScroll={!isModalOpen} 
          
          zoomOnScroll={!isModalOpen}
          zoomOnDoubleClick={!isPanMode && !isModalOpen}
          zoomOnPinch={!isModalOpen}
          elementsSelectable={!isPanMode}
          edgesReconnectable={true}
          edgesFocusable={true}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
          className="workflow-canvas"
        >
          {showGrid && (
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#65606b" />
          )}
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(n) => {
              const type = (n as any)?.type as keyof typeof NODE_COLORS
              return (NODE_COLORS as any)[type] ?? "#6b7280"
            }}
            maskColor="rgba(14, 14, 18, 0.55)"
            style={{
              backgroundColor: "#1e1e22",
              border: "1px solid #2a2a2e",
              borderRadius: 8,
            }}
          />
        </ReactFlow>
      </div>

      <NodeActionsSidebar
          node={nodes.find((n) => n.id === selectedNodeForActions) || null}
          isOpen={isActionsMenuOpen}
          onClose={() => {
            setSelectedNodeForActions(null)
            setIsActionsMenuOpen(false)
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('actions-menu-close'))
            }
          }}
          onDuplicate={() => {
            const node = nodes.find((n) => n.id === selectedNodeForActions)
            if (node) {
              const newNode = {
                ...node,
                id: `${node.type}-${Date.now()}`,
                position: {
                  x: node.position.x + 50,
                  y: node.position.y + 50,
                },
                selected: false,
                data: { ...node.data, label: node.data?.label || node.type },
              }
              addNode(newNode.type as "text" | "image" | "llm", newNode.position)
            }
          }}
          onRename={() => {
            
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('node-rename'))
            }
          }}
          onLock={() => {
            if (selectedNodeForActions) {
              const node = nodes.find((n) => n.id === selectedNodeForActions)
              if (node) {
                updateNodeData(selectedNodeForActions, {
                  locked: !node.data?.locked,
                })
              }
            }
          }}
          onDelete={() => {
            if (selectedNodeForActions) {
              deleteNode(selectedNodeForActions)
              setSelectedNodeForActions(null)
              setIsActionsMenuOpen(false)
            }
          }}
          nodeType={nodes.find((n) => n.id === selectedNodeForActions)?.type}
          isLocked={Boolean(nodes.find((n) => n.id === selectedNodeForActions)?.data?.locked) || false}
          viewMode={nodes.find((n) => n.id === selectedNodeForActions)?.data?.viewMode as 'single' | 'all' | undefined}
          onViewModeChange={(mode) => {
            if (selectedNodeForActions) {
              updateNodeData(selectedNodeForActions, { viewMode: mode })
            }
          }}
          onUpdateNodeData={(data) => {
            if (selectedNodeForActions) {
              updateNodeData(selectedNodeForActions, data)
            }
          }}  
        />

      <CompatibleNodesMenu
        isOpen={isCompatibleMenuOpen}
        position={compatibleMenuPosition}
        sourceInfo={connectionSourceInfo}
        onSelect={async (nodeType, handleId) => {
          if (connectionSourceInfo && compatibleMenuPosition) {
            
            const flowPosition = screenToFlowPosition({
              x: compatibleMenuPosition.x,
              y: compatibleMenuPosition.y,
            })
            
            
            const newNodeId = addNode(nodeType, flowPosition)
            
            // Wait for next render cycle to ensure node is in state
            await new Promise(resolve => setTimeout(resolve, 0))
            
            const { nodes: allNodes, onConnect: connect } = useWorkflowStore.getState()
            const createdNode = allNodes.find((n) => n.id === newNodeId)
            
            if (createdNode && connectionSourceInfo) {
              if (connectionSourceInfo.isOutput) {
                connect({
                  source: connectionSourceInfo.nodeId,
                  sourceHandle: connectionSourceInfo.handleId,
                  target: createdNode.id,
                  targetHandle: handleId,
                })
              } else {
                connect({
                  source: createdNode.id,
                  sourceHandle: handleId,
                  target: connectionSourceInfo.nodeId,
                  targetHandle: connectionSourceInfo.handleId,
                })
              }
            }
          }
          
          
          setIsCompatibleMenuOpen(false)
          setCompatibleMenuPosition(null)
          setConnectionSourceInfo(null)
        }}
        onClose={() => {
          setIsCompatibleMenuOpen(false)
          setCompatibleMenuPosition(null)
          setConnectionSourceInfo(null)
        }}
      />
    </div>
  )
}