"use client"

import type React from "react"
import { memo, useCallback, useState, useMemo, useEffect, useRef } from "react"
import { type Node, type NodeProps } from "@xyflow/react"
import { Bot, Play, Loader2, AlertCircle, ExternalLink, X } from "lucide-react"
import { useWorkflowStore } from "@/store/workflow-store"
import { GEMINI_MODELS, type GeminiModel, type LLMNodeData } from "@/types/workflow"
import { BaseNode } from "./base-node"
import { HANDLE_COLORS, NODE_COLORS } from "@/constants/colors"
import { HANDLE_IDS } from "@/constants/node-ids"
import { ERROR_DISPLAY_TIMEOUT_MS } from "@/constants/ui"
import { SIDEBAR_TABS } from "@/constants/sidebar"

type LLMNode = Node<LLMNodeData, "llm">

function isRateLimitLike(message: string): boolean {
  const m = message.toLowerCase()
  return (
    message.includes("429") ||
    m.includes("too many requests") ||
    m.includes("quota") ||
    m.includes("rate limit") ||
    message.includes("rateLimitExceeded") ||
    message.includes("RESOURCE_EXHAUSTED")
  )
}

const RATE_LIMIT_FRIENDLY_MESSAGE =
  "Rate limit due to heavy traffic. Please wait a moment and try again."

function normalizeOutputValue(value: unknown): string {
  if (typeof value !== "string") return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.toLowerCase() === "null") return ""
  if (trimmed.toLowerCase() === "undefined") return ""
  return value
}

function normalizeLlmError(message: string): string {
  return message.length > 240 ? `${message.slice(0, 240)}…` : message
}

function LLMNodeComponent({ id, data, selected }: NodeProps<LLMNode>) {
  const { updateNodeData, nodes, edges, openGalleryForNode, setActiveTab } = useWorkflowStore()
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [errorHandleId, setErrorHandleId] = useState<string | null>(null)
  const [showPromptError, setShowPromptError] = useState(false)
  const [isTextModalOpen, setIsTextModalOpen] = useState(false)
  const latestRunTokenRef = useRef(0)

  useEffect(() => {
    const hasRun = !!data.hasRun

    // If the node has never been run, don't show any persisted rate-limit message/error.
    if (!hasRun) {
      const shouldClearOutput =
        data.output === RATE_LIMIT_FRIENDLY_MESSAGE ||
        String(data.output ?? "").trim().toLowerCase() === "null" ||
        String(data.output ?? "").trim().toLowerCase() === "undefined"
      if (data.error || shouldClearOutput) {
        updateNodeData(id, { error: null, ...(shouldClearOutput ? { output: "" } : {}) })
      }
      return
    }

    if (!data.error) return

    const rawError = String(data.error)
    // After a run, never persist rate limit provider errors as a red banner; show a friendly message in output.
    if (isRateLimitLike(rawError)) {
      if (data.output) {
        updateNodeData(id, { error: null })
      } else {
        updateNodeData(id, { error: null, output: RATE_LIMIT_FRIENDLY_MESSAGE })
      }
      return
    }

    // If we have a successful output, avoid showing stale error banners.
    if (data.output && data.error) {
      updateNodeData(id, { error: null })
    }
  }, [data.output, data.error, data.hasRun, id, updateNodeData])

  const displayError = useMemo(() => {
    if (!data.error) return null
    return normalizeLlmError(String(data.error))
  }, [data.error])
  
  const imageInputCount = data.imageInputCount || 1

  const handleModelChange = useCallback(
    (model: GeminiModel) => {
      updateNodeData(id, { model })
      setShowModelDropdown(false)
    },
    [id, updateNodeData],
  )

  const runLLM = useCallback(async () => {
    const runToken = ++latestRunTokenRef.current
    
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
    updateNodeData(id, { isRunning: true, error: null, output: "", hasRun: true })

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

      
      const modelToUse = (data.model as string) || "gemini-3-flash-preview"
      
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
        const rawError = result?.error || "Failed to run LLM"
        const rawString = typeof rawError === "string" ? rawError : JSON.stringify(rawError)

        const looksRateLimited =
          response.status === 429 ||
          result?.code === "RATE_LIMIT" ||
          rawString.includes("429") ||
          rawString.toLowerCase().includes("too many requests") ||
          rawString.toLowerCase().includes("quota") ||
          rawString.toLowerCase().includes("rate limit") ||
          rawString.includes("rateLimitExceeded") ||
          rawString.includes("RESOURCE_EXHAUSTED")

        if (looksRateLimited) {
          // Avoid a persistent red error banner for transient rate limits.
          if (latestRunTokenRef.current !== runToken) return
          updateNodeData(id, {
            output: RATE_LIMIT_FRIENDLY_MESSAGE,
            isRunning: false,
            error: null,
          })
          return
        }

        // Prevent massive provider payloads from flooding the UI.
        const trimmed = rawString.length > 240 ? `${rawString.slice(0, 240)}…` : rawString
        throw new Error(trimmed)
      }

      if (latestRunTokenRef.current !== runToken) return
      updateNodeData(id, { output: normalizeOutputValue(result?.output), isRunning: false, error: null })
    } catch (error) {
      if (latestRunTokenRef.current !== runToken) return
      const raw = error instanceof Error ? error.message : "Unknown error occurred"
      const looksRateLimited =
        raw.includes("429") ||
        raw.toLowerCase().includes("too many requests") ||
        raw.toLowerCase().includes("quota") ||
        raw.toLowerCase().includes("rate limit") ||
        raw.includes("rateLimitExceeded") ||
        raw.includes("RESOURCE_EXHAUSTED")

      if (looksRateLimited) {
        updateNodeData(id, {
          output: RATE_LIMIT_FRIENDLY_MESSAGE,
          isRunning: false,
          error: null,
        })
        return
      }

      updateNodeData(id, {
        error: raw.length > 240 ? `${raw.slice(0, 240)}…` : raw,
        isRunning: false,
        output: "",
      })
    }
  }, [id, data.model, edges, nodes, updateNodeData])

  const normalizedOutput = useMemo(() => normalizeOutputValue(data.output), [data.output])

  useEffect(() => {
    if (!data.model) {
      updateNodeData(id, { model: "gemini-3-flash-preview" })
    }
  }, [id, data.model, updateNodeData])
  
  const selectedModel = GEMINI_MODELS.find((m) => m.id === (data.model || "gemini-3-flash-preview")) || GEMINI_MODELS[0]

  
  const inputHandles = useMemo(() => {
    const handles: Array<{ id: string; color: string; title: string; top: string }> = [
      { id: "prompt", color: HANDLE_COLORS.prompt, title: "prompt *", top: "15%" },
      { id: "system_prompt", color: HANDLE_COLORS.systemPrompt, title: "system prompt", top: "28%" },
    ]

    // Distribute image handles within the node height so they don't overflow
    // when many image inputs are added.
    const imageStart = 41
    const imageEnd = 90
    const imageSpacing = imageInputCount <= 1 ? 0 : (imageEnd - imageStart) / (imageInputCount - 1)

    for (let i = 1; i <= imageInputCount; i++) {
      const topPercent = imageStart + (i - 1) * imageSpacing
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

  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Any LLM"
      nodeType="llm"
      data={data}
      executing={!!data.isRunning}
      minWidth="383px"
      maxWidth="383px"
      inputHandles={inputHandles}
      outputHandles={[{ id: "output", color: HANDLE_COLORS.text, title: "Output" }]}
      errorHandleId={errorHandleId}
    >
      <div
        data-nodrag
        className="w-full bg-[#353539] rounded-lg border border-panel-border p-4 group custom-scrollbar relative select-text cursor-text overflow-y-auto min-h-56 max-h-72"
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <div className="relative group">
            <button
              data-nodrag
              onClick={() => {
                openGalleryForNode(id)
                setActiveTab(SIDEBAR_TABS.GALLERY)
              }}
              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              aria-label="Open in gallery"
            >
              <ExternalLink className="w-4 h-4" strokeWidth={2} />
            </button>
            <div className="pointer-events-none absolute right-0 top-7 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-[11px] text-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Open in gallery
            </div>
          </div>
        </div>

        {data.isRunning && !normalizedOutput ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white/70 animate-spin" strokeWidth={2} />
          </div>
        ) : normalizedOutput ? (
          <>
            <p
              data-nodrag
              className="text-sm text-panel-text whitespace-pre-wrap w-full pr-2 pt-8 select-text"
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              onDoubleClick={() => setIsTextModalOpen(true)}
            >
              {normalizedOutput}
            </p>
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

        <div className="flex items-center gap-2">
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
      </div>

      {displayError && !normalizedOutput && (
        <div className="mt-4 relative flex items-start gap-2 p-3 pr-10 bg-red-500/10 border border-red-500/30 rounded-lg max-h-28 overflow-auto custom-scrollbar">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{displayError}</p>
          <button
            onClick={() => updateNodeData(id, { error: null })}
            className="absolute right-2 top-2 p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss error"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {showPromptError && errorHandleId === "prompt" && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">Prompt is required. Please connect a Text Node or LLM Node to 'prompt *'.</p>
        </div>
      )}

      {isTextModalOpen && normalizedOutput ? (
        <div className="fixed inset-0 z-20000 flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setIsTextModalOpen(false)}>
          <div className="w-full max-w-2xl bg-[#1e1e22] border border-[#2a2a2e] rounded-lg shadow-2xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2e]">
              <div className="text-sm text-white/90 truncate">Any LLM</div>
              <button
                onClick={() => setIsTextModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 max-h-[70vh] overflow-auto custom-scrollbar">
              <pre className="whitespace-pre-wrap wrap-break-word text-[12px] text-white/80">{normalizedOutput}</pre>
            </div>
          </div>
        </div>
      ) : null}

    </BaseNode>
  )
}

export const LLMNode = memo(LLMNodeComponent)
