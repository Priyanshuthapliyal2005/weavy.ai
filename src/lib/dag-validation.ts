import type { Edge } from '@xyflow/react'

export interface Connection {
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

function buildAdjacencyList(edges: Edge[]): Map<string, string[]> {
  const adjList = new Map<string, string[]>()
  
  for (const edge of edges) {
    if (!adjList.has(edge.source)) {
      adjList.set(edge.source, [])
    }
    adjList.get(edge.source)!.push(edge.target)
  }
  
  return adjList
}

function hasCycleDFS(
  node: string,
  adjList: Map<string, string[]>,
  visited: Set<string>,
  recStack: Set<string>
): boolean {
  visited.add(node)
  recStack.add(node)
  
  const neighbors = adjList.get(node) || []
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      if (hasCycleDFS(neighbor, adjList, visited, recStack)) {
        return true
      }
    } else if (recStack.has(neighbor)) {
      return true
    }
  }
  
  recStack.delete(node)
  return false
}

export function hasCycle(edges: Edge[]): boolean {
  const adjList = buildAdjacencyList(edges)
  const visited = new Set<string>()
  const recStack = new Set<string>()
  
  for (const node of adjList.keys()) {
    if (!visited.has(node)) {
      if (hasCycleDFS(node, adjList, visited, recStack)) {
        return true
      }
    }
  }
  
  return false
}

export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  existingEdges: Edge[]
): boolean {
  if (sourceId === targetId) {
    return false
  }
  
  const testEdge: Edge = {
    id: `test-${Date.now()}`,
    source: sourceId,
    target: targetId,
  }
  
  const testEdges = [...existingEdges, testEdge]
  return hasCycle(testEdges)
}

export function getNodesThatWouldCreateCycle(
  sourceId: string,
  existingEdges: Edge[],
  allNodeIds: string[]
): Set<string> {
  const cycleNodes = new Set<string>()
  
  for (const nodeId of allNodeIds) {
    if (nodeId !== sourceId && wouldCreateCycle(sourceId, nodeId, existingEdges)) {
      cycleNodes.add(nodeId)
    }
  }
  
  return cycleNodes
}

export function getNodesThatDependOn(
  targetId: string,
  existingEdges: Edge[]
): Set<string> {
  const dependentNodes = new Set<string>()
  const adjList = buildAdjacencyList(existingEdges)
  
  function dfs(node: string) {
    dependentNodes.add(node)
    const neighbors = adjList.get(node) || []
    for (const neighbor of neighbors) {
      if (!dependentNodes.has(neighbor)) {
        dfs(neighbor)
      }
    }
  }
  
  const directDependents = existingEdges
    .filter(edge => edge.target === targetId)
    .map(edge => edge.source)
  
  for (const dependent of directDependents) {
    dfs(dependent)
  }
  
  return dependentNodes
}

export function isValidConnection(
  sourceId: string,
  targetId: string,
  edges: Edge[]
): boolean {
  if (sourceId === targetId) {
    return false
  }
  
  return !wouldCreateCycle(sourceId, targetId, edges)
}

