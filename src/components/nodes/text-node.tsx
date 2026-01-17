"use client"

import type React from "react"
import { memo, useCallback, useEffect, useRef } from "react"
import { type Node, type NodeProps } from "@xyflow/react"
import { useWorkflowStore } from "@/store/workflow-store"
import { BaseNode } from "./base-node"
import { HANDLE_COLORS } from "@/constants/colors"
import { HANDLE_IDS } from "@/constants/node-ids"
import { TEXTAREA_MIN_HEIGHT_LINES, TEXTAREA_MAX_HEIGHT_PX, TEXTAREA_LINE_HEIGHT, TEXTAREA_FONT_SIZE } from "@/constants/ui"

type TextNode = Node<{ label: string; content: string }, "text">

function TextNodeComponent({ id, data, selected }: NodeProps<TextNode>) {
  const { updateNodeData } = useWorkflowStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isLocked = (data as { locked?: boolean })?.locked || false

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { content: e.target.value })
    },
    [id, updateNodeData],
  )

  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      const minHeight = TEXTAREA_MIN_HEIGHT_LINES * TEXTAREA_LINE_HEIGHT * TEXTAREA_FONT_SIZE
      const newHeight = Math.max(minHeight, Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT_PX))
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [data.content])

  return (
    <BaseNode
      id={id}
      selected={selected}
      title="Text"
      nodeType="text"
      data={data}
      inputHandles={[]}
      outputHandles={[{ id: HANDLE_IDS.OUTPUT, color: HANDLE_COLORS.text }]}
    >
      <textarea
        ref={textareaRef}
        value={data.content}
        onChange={handleContentChange}
        placeholder="Text here..."
        disabled={isLocked}
        className={`w-full bg-[#353539] rounded-lg px-3 py-2.5 text-sm placeholder:text-panel-text-muted/50 outline-none resize-none transition-colors overflow-y-auto ${
          isLocked 
            ? "text-white/50 border border-white/30 hover:border-panel-border" 
            : "text-white border-none"
        }`}
        style={{
          backgroundColor: "#353539",
          minHeight: `${TEXTAREA_MIN_HEIGHT_LINES}em`,
          lineHeight: `${TEXTAREA_LINE_HEIGHT}em`,
          maxHeight: `${TEXTAREA_MAX_HEIGHT_PX}px`,
        }}
        rows={TEXTAREA_MIN_HEIGHT_LINES}
      />
    </BaseNode>
  )
}

export const TextNode = memo(TextNodeComponent)
