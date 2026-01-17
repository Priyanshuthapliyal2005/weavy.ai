import type { WorkflowNode, WorkflowEdge } from '@/store/workflow-store';
import type { CustomNode } from '@/types/workflow';
import { Edge } from '@xyflow/react';

export interface ExecutionResult {
  nodeId: string;
  status: 'success' | 'failed' | 'skipped';
  output?: any;
  error?: string;
  duration: number;
  startedAt: Date;
  completedAt: Date;
}

export interface WorkflowRunResult {
  runId: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  nodeResults: ExecutionResult[];
  totalDuration: number;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Build execution order using topological sort (Kahn's algorithm)
 * Returns nodes in order of execution respecting dependencies
 */
export function buildExecutionOrder(
  nodes: CustomNode[],
  edges: Edge[]
): CustomNode[] {
  // Build adjacency list and in-degree map
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  // Initialize
  nodes.forEach(node => {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
  });
  
  // Build graph
  edges.forEach(edge => {
    const from = edge.source;
    const to = edge.target;
    adjList.get(from)?.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  });
  
  // Find nodes with no dependencies (in-degree = 0)
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });
  
  const executionOrder: CustomNode[] = [];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      executionOrder.push(node);
    }
    
    // Reduce in-degree for neighbors
    const neighbors = adjList.get(nodeId) || [];
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  return executionOrder;
}

/**
 * Get input values for a node from connected edges
 */
export function getNodeInputs(
  nodeId: string,
  nodes: CustomNode[],
  edges: Edge[],
  executionResults: Map<string, any>
): Record<string, any> {
  const inputs: Record<string, any> = {};
  
  // Find all edges connected to this node
  const incomingEdges = edges.filter(edge => edge.target === nodeId);
  
  incomingEdges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode) return;
    
    const handleId = edge.targetHandle || 'input';
    
    // Get the output from the source node's execution result
    const sourceOutput = executionResults.get(edge.source);
    
    if (sourceOutput !== undefined) {
      inputs[handleId] = sourceOutput;
    }
  });
  
  return inputs;
}

/**
 * Execute a single node
 */
export async function executeNode(
  node: CustomNode,
  inputs: Record<string, any>
): Promise<{ output: any; error?: string }> {
  try {
    switch (node.type) {
      case 'text':
        return { output: node.data.content };
        
      case 'image':
        return { output: node.data.imageUrl };
        
      case 'video':
        return { output: node.data.videoUrl };
        
      case 'llm':
        // TODO: Call Trigger.dev task for LLM execution
        return { 
          output: 'LLM execution placeholder - integrate Trigger.dev',
          error: undefined 
        };
        
      case 'crop':
        // TODO: Call Trigger.dev task for image cropping
        return { 
          output: 'Crop execution placeholder - integrate Trigger.dev',
          error: undefined 
        };
        
      case 'extract':
        // TODO: Call Trigger.dev task for frame extraction
        return { 
          output: 'Extract frame placeholder - integrate Trigger.dev',
          error: undefined 
        };
        
      default:
        return { output: null, error: 'Unknown node type' };
    }
  } catch (error) {
    return { 
      output: null, 
      error: error instanceof Error ? error.message : 'Execution failed' 
    };
  }
}

/**
 * Execute entire workflow
 */
export async function executeWorkflow(
  nodes: CustomNode[],
  edges: Edge[],
  selectedNodeIds?: string[]
): Promise<WorkflowRunResult> {
  const startTime = Date.now();
  const startedAt = new Date();
  const nodeResults: ExecutionResult[] = [];
  const executionResults = new Map<string, any>();
  
  // Filter nodes if specific nodes selected
  const nodesToExecute = selectedNodeIds 
    ? nodes.filter(n => selectedNodeIds.includes(n.id))
    : nodes;
  
  // Build execution order
  const executionOrder = buildExecutionOrder(nodesToExecute, edges);
  
  let overallStatus: 'success' | 'failed' | 'partial' = 'success';
  
  // Execute nodes in order
  for (const node of executionOrder) {
    const nodeStartTime = Date.now();
    const nodeStartedAt = new Date();
    
    // Get inputs from connected nodes
    const inputs = getNodeInputs(node.id, nodes, edges, executionResults);
    
    // Execute the node
    const { output, error } = await executeNode(node, inputs);
    
    const nodeCompletedAt = new Date();
    const nodeDuration = Date.now() - nodeStartTime;
    
    const result: ExecutionResult = {
      nodeId: node.id,
      status: error ? 'failed' : 'success',
      output,
      error,
      duration: nodeDuration,
      startedAt: nodeStartedAt,
      completedAt: nodeCompletedAt,
    };
    
    nodeResults.push(result);
    
    if (error) {
      overallStatus = overallStatus === 'success' ? 'partial' : 'failed';
    } else {
      executionResults.set(node.id, output);
    }
  }
  
  const completedAt = new Date();
  const totalDuration = Date.now() - startTime;
  
  return {
    runId: `run-${Date.now()}`,
    status: overallStatus,
    nodeResults,
    totalDuration,
    startedAt,
    completedAt,
  };
}
