import type { CustomNode } from '@/types/workflow';
import type { Edge } from '@xyflow/react';

/**
 * Build execution order using topological sort (Kahn's algorithm)
 * Returns nodes in order of execution respecting dependencies
 */
export function buildExecutionOrder(nodes: CustomNode[], edges: Edge[]): CustomNode[] {
  const nodeIds = new Set(nodes.map((n) => n.id));

  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const from = edge.source;
    const to = edge.target;
    if (!nodeIds.has(from) || !nodeIds.has(to)) continue;

    adjList.get(from)!.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  }

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const executionOrder: CustomNode[] = [];
  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeById.get(nodeId);
    if (node) executionOrder.push(node);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return executionOrder;
}

/**
 * Build execution layers for layer-by-layer processing
 * Each layer contains nodes that can run in parallel.
 */
export function buildExecutionLayers(nodes: CustomNode[], edges: Edge[]): CustomNode[][] {
  const nodeIds = new Set(nodes.map((n) => n.id));

  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const from = edge.source;
    const to = edge.target;
    if (!nodeIds.has(from) || !nodeIds.has(to)) continue;

    adjList.get(from)!.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  }

  const layers: CustomNode[][] = [];
  const remaining = new Set(nodes.map((n) => n.id));
  const nodeById = new Map(nodes.map((n) => [n.id, n] as const));

  while (remaining.size > 0) {
    const currentLayer: CustomNode[] = [];

    for (const id of remaining) {
      if ((inDegree.get(id) || 0) === 0) {
        const node = nodeById.get(id);
        if (node) currentLayer.push(node);
      }
    }

    if (currentLayer.length === 0) {
      // Cycle or unresolved deps; stop.
      break;
    }

    layers.push(currentLayer);

    for (const node of currentLayer) {
      remaining.delete(node.id);
      const neighbors = adjList.get(node.id) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      }
    }
  }

  return layers;
}

/**
 * Get input values for a node from connected edges.
 * Uses `executionResults` map (nodeId -> output) as the source of upstream outputs.
 */
export function getNodeInputs(
  nodeId: string,
  nodes: CustomNode[],
  edges: Edge[],
  executionResults: Map<string, any>
): Record<string, any> {
  const inputs: Record<string, any> = {};
  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) continue;

    const handleId = edge.targetHandle || 'input';
    const sourceOutput = executionResults.get(edge.source);
    if (sourceOutput !== undefined) {
      inputs[handleId] = sourceOutput;
    }
  }

  return inputs;
}
