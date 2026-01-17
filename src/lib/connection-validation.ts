import { getHandleColor } from './handle-color'
import { HANDLE_COLORS } from '@/constants/colors'
import type { ConnectionInfo } from '@/types/validation'
import { isValidConnection as isValidDAGConnection } from './dag-validation'
import type { Edge } from '@xyflow/react'

export type { ConnectionInfo }

export function isValidConnection(
  source: ConnectionInfo,
  target: ConnectionInfo,
  edges: Edge[] = []
): boolean {
  
  if (source.isOutput === target.isOutput) {
    return false
  }

  
  if (source.nodeId === target.nodeId) {
    return false
  }

  
  const sourceColor = getHandleColor(source.handleId, source.nodeType, source.isOutput)
  const targetColor = getHandleColor(target.handleId, target.nodeType, target.isOutput)

  if (sourceColor !== targetColor) {
    return false
  }

  
  if (!isValidDAGConnection(source.nodeId, target.nodeId, edges)) {
    return false
  }

  return true
}
export function isCompatibleTarget(
  source: ConnectionInfo,
  target: ConnectionInfo,
  edges: Edge[] = []
): boolean {
  
  if (source.isOutput === target.isOutput) {
    return false
  }

  
  if (source.nodeId === target.nodeId) {
    return false
  }

  
  const sourceColor = getHandleColor(source.handleId, source.nodeType, source.isOutput)
  const targetColor = getHandleColor(target.handleId, target.nodeType, target.isOutput)

  if (sourceColor !== targetColor) {
    return false
  }

  
  if (!isValidDAGConnection(source.nodeId, target.nodeId, edges)) {
    return false
  }

  return true
}
