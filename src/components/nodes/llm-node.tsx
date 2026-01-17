"use client"

import type React from "react"
import { memo, useCallback, useState, useMemo, useEffect } from "react"
import { createPortal } from "react-dom"
import { type Node, type NodeProps } from "@xyflow/react"
import { Bot, Play, Loader2, AlertCircle, ChevronDown, ChevronUp, Maximize2, Copy, X } from "lucide-react"
import { useWorkflowStore } from "@/store/workflow-store"
import { GEMINI_MODELS, type GeminiModel, type LLMNodeData } from "@/types/workflow"
import { BaseNode } from "./base-node"
import { HANDLE_COLORS, NODE_COLORS } from "@/constants/colors"
import { HANDLE_IDS } from "@/constants/node-ids"
import { ERROR_DISPLAY_TIMEOUT_MS } from "@/constants/ui"

type LLMNode = Node<LLMNodeData, "llm">

function LLMNodeComponent({ id, data, selected }: NodeProps<LLMNode>) {
  const { updateNodeData, nodes, edges } = useWorkflowStore()
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [errorHandleId, setErrorHandleId] = useState<string | null>(null)
  const [showPromptError, setShowPromptError] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const imageInputCount = data.imageInputCount || 1

  const handleModelChange = useCallback(
    (model: GeminiModel) => {
      updateNodeData(id, { model })
      setShowModelDropdown(false)
    },
    [id, updateNodeData],
  )

  const runLLM = useCallback(async () => {
    
    const incomingEdges = edges.filter((e) => e.target === id)
    let prompt = ""
    
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source)
      if (!sourceNode) continue
      
      const handle = edge.targetHandle
      if (handle === HANDLE_IDS.PROMPT) {
        if (sourceNode.type === "text") {
          prompt = (sourceNode.data as { content: string }).content || ""
        } else if (sourceNode.type === "llm") {
          prompt = (sourceNode.data as { output: string }).output || ""
        }
      }
    }

    
    if (!prompt) {
      setErrorHandleId(HANDLE_IDS.PROMPT)
      setShowPromptError(true)
      setTimeout(() => {
        setErrorHandleId(null)
        setShowPromptError(false)
      }, ERROR_DISPLAY_TIMEOUT_MS)
      return
    }

    setErrorHandleId(null)
    updateNodeData(id, { isRunning: true, error: null, output: "" })

    try {
      const systemPromptParts: string[] = []
      const imageUrls: string[] = []

      for (const edge of incomingEdges) {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        if (!sourceNode) continue

        const handle = edge.targetHandle

        if (handle === HANDLE_IDS.SYSTEM_PROMPT) {
          if (sourceNode.type === "text") {
            const content = (sourceNode.data as { content: string }).content || ""
            if (content) systemPromptParts.push(content)
          } else if (sourceNode.type === "llm") {
            
            const output = (sourceNode.data as { output: string }).output || ""
            if (output) systemPromptParts.push(output)
          }
        } else if (handle?.startsWith("image_") && sourceNode.type === "image") {
          const imageNodeData = sourceNode.data as { 
            imageUrl: string | null
            images?: Array<{ id: string; url: string; file: File | null }>
          }
          
          let imageUrl = imageNodeData.imageUrl
          
          if (handle.startsWith("image_")) {
            const imageIndex = parseInt(handle.split("_")[1]) - 1
            if (imageNodeData.images && imageNodeData.images[imageIndex]) {
              imageUrl = imageNodeData.images[imageIndex].url
            }
          }
          
          if (imageUrl) {
            imageUrls.push(imageUrl)
          }
        }
      }

      const systemPrompt = systemPromptParts.join("\n\n")

      
      const modelToUse = "gemini-2.5-flash"
      
      const temperature = data.temperature ?? undefined
      const thinking = data.thinking ?? undefined
      
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelToUse,
          systemPrompt,
          userMessage: prompt,
          images: imageUrls,
          temperature,
          thinking,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to run LLM")
      }

      updateNodeData(id, { output: result.output, isRunning: false })
      setIsExpanded(false) 
    } catch (error) {
      updateNodeData(id, {
        error: error instanceof Error ? error.message : "Unknown error occurred",
        isRunning: false,
      })
    }
  }, [id, data.model, edges, nodes, updateNodeData])

  
  useEffect(() => {
    if (data.model && data.model !== "gemini-2.5-flash") {
      updateNodeData(id, { model: "gemini-2.5-flash" })
    } else if (!data.model) {
      updateNodeData(id, { model: "gemini-2.5-flash" })
    }
  }, [id, data.model, updateNodeData])
  
  const selectedModel = GEMINI_MODELS.find((m) => m.id === (data.model || "gemini-2.5-flash")) || GEMINI_MODELS[0]

  
  const inputHandles = useMemo(() => {
    const handles: Array<{ id: string; color: string; title: string; top: string }> = [
      { id: "prompt", color: HANDLE_COLORS.prompt, title: "prompt *", top: "15%" },
      { id: "system_prompt", color: HANDLE_COLORS.systemPrompt, title: "system prompt", top: "28%" },
    ]

    
    for (let i = 1; i <= imageInputCount; i++) {
      const topPercent = 41 + (i - 1) * 13 
      handles.push({
        id: `image_${i}`,
        color: HANDLE_COLORS.image,
        title: `image ${i}`,
        top: `${topPercent}%`,
      })
    }
    
    return handles
  }, [imageInputCount])

  const handleAddImageInput = useCallback(() => {
    const newImageInputCount = imageInputCount + 1
    
    
    updateNodeData(id, { imageInputCount: newImageInputCount })
  }, [id, imageInputCount, updateNodeData])

  
  const formatMarkdown = useCallback((text: string) => {
    
    const lines = text.split('\n')
    return lines.map((line, lineIndex) => {
      
      const parts = line.split(/(\*\*[^*]+\*\*)/g)
      return (
        <span key={lineIndex}>
          {parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              
              const boldText = part.slice(2, -2)
              return <strong key={partIndex} className="font-semibold">{boldText}</strong>
            }
            return <span key={partIndex}>{part}</span>
          })}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    })
  }, [])

  
  const handleCopy = useCallback(async () => {
    if (data.output) {
      try {
        await navigator.clipboard.writeText(data.output)
        
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }, [data.output])

  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Run Any LLM"
      nodeType="llm"
      data={data}
      minWidth="383px"
      maxWidth="383px"
      inputHandles={inputHandles}
      outputHandles={[{ id: "output", color: HANDLE_COLORS.text, title: "Output" }]}
      errorHandleId={errorHandleId}
    >
      <div 
        data-nodrag
        className={`w-full bg-[#353539] rounded-lg border border-panel-border p-4 group ${
          isExpanded ? 'min-h-[360px]' : 'h-[360px] overflow-y-auto'
        } custom-scrollbar relative select-text`}
        style={{ cursor: 'text' }}
        onMouseDown={(e) => {
          
          e.stopPropagation()
        }}
      >
        {data.isRunning && !data.output ? (
          
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white/70 animate-spin" strokeWidth={2} />
          </div>
        ) : data.output ? (
          <>
            <div 
              data-nodrag
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10"
            >
              <button
                data-nodrag
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/10 rounded cursor-pointer"
                title="Copy"
              >
                <Copy className="w-4 h-4 text-white/70 hover:text-white" strokeWidth={2} />
              </button>
              <button
                data-nodrag
                onClick={() => setIsModalOpen(true)}
                className="p-1.5 hover:bg-white/10 rounded cursor-pointer"
                title="Maximize"
              >
                <Maximize2 className="w-4 h-4 text-white/70 hover:text-white" strokeWidth={2} />
              </button>
            </div>
            
            <p 
              data-nodrag
              className="text-sm text-panel-text whitespace-pre-wrap w-full pr-2 select-text"
              onMouseDown={(e) => {
                
                e.stopPropagation()
              }}
            >
              {data.output}
            </p>
            {data.output.length > 500 && (
              <div 
                data-nodrag
                className={`flex justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${!isExpanded ? 'sticky bottom-0 pt-2 pb-0' : ''}`}
              >
                <button
                  data-nodrag
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-white/70 hover:text-white font-light cursor-pointer bg-[#212126] px-2 py-1 rounded"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" strokeWidth={2} />
                  ) : (
                    <ChevronDown className="w-3 h-3" strokeWidth={2} />
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-panel-text-muted">The generated text will appear here</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <button
          onClick={handleAddImageInput}
          className="text-left text-xs text-white font-light hover:text-white transition-colors cursor-pointer inline-block"
        >
          <span className="hover:bg-white/5 rounded px-2.5 py-1.5 transition-colors">
            + Add another image input
          </span>
        </button>

        <button
          onClick={runLLM}
          disabled={data.isRunning}
          className="flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/50 text-white/90 text-xs font-light rounded transition-colors hover:bg-white/15 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {data.isRunning ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3" strokeWidth={2} />
              <span>Run Model</span>
            </>
          )}
        </button>
      </div>

      {data.error && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">{data.error}</p>
        </div>
      )}
      {showPromptError && errorHandleId === "prompt" && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">Prompt is required. Please connect a Text Node or LLM Node to 'prompt *'.</p>
        </div>
      )}

      {isModalOpen && data.output && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-[#212126] border border-panel-border rounded-lg shadow-xl flex flex-col"
            style={{ width: '70vw', height: '70vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-panel-border">
              <h3 className="text-sm font-medium text-white">Response</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer"
                  title="Copy"
                >
                  <Copy className="w-4 h-4 text-white/70 hover:text-white" strokeWidth={2} />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-white/70 hover:text-white" strokeWidth={2} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar select-text" style={{ cursor: 'text' }}>
              <div className="text-sm text-panel-text whitespace-pre-wrap">
                {formatMarkdown(data.output)}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </BaseNode>
  )
}

export const LLMNode = memo(LLMNodeComponent)
