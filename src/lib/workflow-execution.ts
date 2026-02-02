import type { WorkflowNode, WorkflowEdge } from '@/store/workflow-store';
import type { CustomNode } from '@/types/workflow';
import { Edge } from '@xyflow/react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { tasks, runs } from '@trigger.dev/sdk/v3';
import { buildPlainTextSystemInstruction, sanitizeLlmPlainText } from '@/lib/llm-format';
import type { cropImageTask, extractFrameTask } from '@/trigger';
import { buildExecutionLayers, buildExecutionOrder, getNodeInputs } from '@/lib/workflow-graph';

export interface ExecutionResult {
  nodeId: string;
  status: 'success' | 'failed' | 'skipped';
  input?: any;
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

// buildExecutionOrder/buildExecutionLayers/getNodeInputs live in `src/lib/workflow-graph.ts`
// and are imported above to keep graph utilities client-safe.

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
        
      case 'llm': {
        const modelName = node.data.model || 'gemini-2.5-flash';
        const systemPrompt = inputs.system_prompt;
        const userMessage = inputs.user_message || inputs.prompt;

        const imageInputs = Array.isArray(inputs.images)
          ? inputs.images
          : inputs.image_1
            ? [inputs.image_1, inputs.image_2, inputs.image_3].filter(Boolean)
            : [];

        // Check if any video inputs are connected - LLMs cannot process videos directly
        const hasVideoInput = Object.values(inputs).some(
          (value) =>
            typeof value === 'string' &&
            (value.includes('.mp4') ||
              value.includes('.webm') ||
              value.includes('.mov') ||
              value.includes('.avi') ||
              value.includes('video'))
        );

        if (hasVideoInput) {
          return {
            output: null,
            error:
              'LLM cannot process video directly. Please connect an "Extract Frame" node to convert the video to an image first.',
          };
        }

        if (!userMessage) {
          return { output: null, error: 'Missing prompt/user message' };
        }

        try {
          const handle = await tasks.trigger<any>('run-llm', {
            model: modelName,
            systemPrompt: typeof systemPrompt === 'string' ? systemPrompt : undefined,
            userMessage: String(userMessage),
            images: imageInputs.filter((x) => typeof x === 'string') as string[],
            temperature: node.data.temperature,
            thinking: node.data.thinking,
          });

          const maxAttempts = 60;
          for (let i = 0; i < maxAttempts; i++) {
            const run = await runs.retrieve(handle);
            if (run.isCompleted) {
              const taskOutput = run.output as any;
              if (taskOutput?.code === 'RATE_LIMIT') {
                return {
                  output: null,
                  error:
                    taskOutput?.output ||
                    'Rate limit due to heavy traffic. Please wait a moment and try again.',
                };
              }
              return { output: taskOutput?.output ?? taskOutput };
            }
            if (run.isFailed) {
              const errorMsg = run.output ? JSON.stringify(run.output) : 'LLM task failed';
              return { output: null, error: errorMsg };
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          return { output: null, error: 'LLM task timeout' };
        } catch (error) {
          return {
            output: null,
            error: error instanceof Error ? `LLM failed: ${error.message}` : 'LLM failed',
          };
        }
      }
        
      case 'crop': {
        const imageUrl = inputs.image_url || inputs.image_1 || inputs.image;
        if (!imageUrl || typeof imageUrl !== 'string') {
          return { output: null, error: 'Missing image_url input. Connect an image node to the IMAGE_URL handle.' };
        }

        // Read from node.data (UI config) as fallback when not provided via inputs
        const xPercent = inputs.x_percent 
          ? parseFloat(inputs.x_percent) 
          : (node.data?.xPercent ?? 0);
        const yPercent = inputs.y_percent 
          ? parseFloat(inputs.y_percent) 
          : (node.data?.yPercent ?? 0);
        const widthPercent = inputs.width_percent 
          ? parseFloat(inputs.width_percent) 
          : (node.data?.widthPercent ?? 100);
        const heightPercent = inputs.height_percent 
          ? parseFloat(inputs.height_percent) 
          : (node.data?.heightPercent ?? 100);

        try {
          // Trigger the task (non-blocking)
          const handle = await tasks.trigger<typeof cropImageTask>('crop-image', {
            imageUrl,
            xPercent,
            yPercent,
            widthPercent,
            heightPercent,
          });

          // Poll for completion (max 60 seconds)
          const maxAttempts = 60;
          for (let i = 0; i < maxAttempts; i++) {
            const run = await runs.retrieve(handle);
            
            if (run.isCompleted) {
              // Task returns { output: "data:image/...", dimensions: {...} }
              const taskOutput = run.output as any;
              return { output: taskOutput?.output || taskOutput };
            }
            
            if (run.isFailed) {
              const errorMsg = run.output ? JSON.stringify(run.output) : 'Crop task failed';
              return { output: null, error: errorMsg };
            }
            
            // Wait 1 second before next poll
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          return { output: null, error: 'Crop task timeout' };
        } catch (error) {
          console.error('[crop] Error:', error);
          return { 
            output: null, 
            error: error instanceof Error 
              ? `Crop failed: ${error.message}`
              : 'Image cropping failed' 
          };
        }
      }
        
      case 'extract': {
        const videoUrl = inputs.video_url;
        if (!videoUrl || typeof videoUrl !== 'string') {
          return { output: null, error: 'Missing video_url input. Connect a video node to the VIDEO_URL handle.' };
        }

        try {
          // Read from node.data (UI config) as fallback when not provided via inputs
          const timestamp = inputs.timestamp ?? node.data?.timestamp ?? '0';

          // Trigger the task (non-blocking)
          const handle = await tasks.trigger<typeof extractFrameTask>('extract-frame', {
            videoUrl,
            timestamp,
          });

          // Poll for completion (max 60 seconds)
          const maxAttempts = 60;
          for (let i = 0; i < maxAttempts; i++) {
            const run = await runs.retrieve(handle);
            
            if (run.isCompleted) {
              // Task returns { output: "data:image/...", dimensions: {...} }
              const taskOutput = run.output as any;
              return { output: taskOutput?.output || taskOutput };
            }
            
            if (run.isFailed) {
              const errorMsg = run.output ? JSON.stringify(run.output) : 'Frame extraction failed';
              return { output: null, error: errorMsg };
            }
            
            // Wait 1 second before next poll
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          return { output: null, error: 'Frame extraction timeout' };
        } catch (error) {
          console.error('[extract] Error:', error);
          return { 
            output: null, 
            error: error instanceof Error 
              ? `Frame extraction failed: ${error.message}`
              : 'Frame extraction failed' 
          };
        }
      }
        
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
 * Execute entire workflow layer by layer
 * Provides callback for updating node status in real-time
 */
export async function executeWorkflowByLayers(
  nodes: CustomNode[],
  edges: Edge[],
  selectedNodeIds: string[] | undefined,
  onLayerStart?: (nodeIds: string[]) => void,
  onLayerComplete?: (nodeIds: string[], results: Map<string, ExecutionResult>) => void
): Promise<WorkflowRunResult> {
  const startTime = Date.now();
  const startedAt = new Date();
  const nodeResults: ExecutionResult[] = [];
  const executionResults = new Map<string, any>();
  
  // If user selected nodes, include upstream dependencies (closure).
  const required = new Set<string>(selectedNodeIds ?? nodes.map((n) => n.id));
  if (selectedNodeIds && selectedNodeIds.length > 0) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const edge of edges) {
        if (required.has(edge.target) && !required.has(edge.source)) {
          required.add(edge.source);
          changed = true;
        }
      }
    }
  }

  const nodesToExecute = nodes.filter((n) => required.has(n.id));
  
  // Build execution layers
  const layers = buildExecutionLayers(nodesToExecute, edges);
  
  let overallStatus: 'success' | 'failed' | 'partial' = 'success';
  const completed = new Set<string>();
  const failed = new Set<string>();

  // Execute layer by layer
  for (const layer of layers) {
    const layerNodeIds = layer.map(n => n.id);
    
    // Notify that this layer is starting
    if (onLayerStart) {
      onLayerStart(layerNodeIds);
    }
    
    // Execute all nodes in this layer in parallel
    const executions = await Promise.all(
      layer.map(async (node) => {
        const nodeStartTime = Date.now();
        const nodeStartedAt = new Date();
        const inputs = getNodeInputs(node.id, nodes, edges, executionResults);

        // Check if any dependency failed
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        const hasFailedDependency = incomingEdges.some(edge => failed.has(edge.source));
        
        if (hasFailedDependency) {
          const now = new Date();
          return {
            id: node.id,
            result: {
              nodeId: node.id,
              status: 'skipped' as const,
              input: inputs,
              output: null,
              error: 'Skipped due to failed dependency',
              duration: 0,
              startedAt: now,
              completedAt: now,
            },
            output: undefined,
            error: 'skipped',
          };
        }

        const { output, error } = await executeNode(node, inputs);
        const nodeCompletedAt = new Date();
        const nodeDuration = Date.now() - nodeStartTime;

        const result: ExecutionResult = {
          nodeId: node.id,
          status: error ? 'failed' : 'success',
          input: inputs,
          output,
          error,
          duration: nodeDuration,
          startedAt: nodeStartedAt,
          completedAt: nodeCompletedAt,
        };

        return { id: node.id, result, output, error };
      })
    );

    // Process results for this layer
    const layerResults = new Map<string, ExecutionResult>();
    for (const exec of executions) {
      nodeResults.push(exec.result);
      layerResults.set(exec.id, exec.result);
      
      if (exec.result.status === 'success') {
        completed.add(exec.id);
        executionResults.set(exec.id, exec.output);
      } else if (exec.result.status === 'skipped') {
        failed.add(exec.id);
        overallStatus = overallStatus === 'success' ? 'partial' : 'failed';
      } else {
        failed.add(exec.id);
        overallStatus = overallStatus === 'success' ? 'partial' : 'failed';
      }
    }
    
    // Notify that this layer is complete
    if (onLayerComplete) {
      onLayerComplete(layerNodeIds, layerResults);
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
  
  // If user selected nodes, include upstream dependencies (closure).
  const required = new Set<string>(selectedNodeIds ?? nodes.map((n) => n.id));
  if (selectedNodeIds && selectedNodeIds.length > 0) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const edge of edges) {
        if (required.has(edge.target) && !required.has(edge.source)) {
          required.add(edge.source);
          changed = true;
        }
      }
    }
  }

  const nodesToExecute = nodes.filter((n) => required.has(n.id));
  const nodeById = new Map(nodesToExecute.map((n) => [n.id, n] as const));

  // Build dependency graph restricted to nodesToExecute
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  const deps = new Map<string, Set<string>>();

  for (const n of nodesToExecute) {
    inDegree.set(n.id, 0);
    dependents.set(n.id, []);
    deps.set(n.id, new Set());
  }

  for (const e of edges) {
    if (!required.has(e.source) || !required.has(e.target)) continue;
    dependents.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    deps.get(e.target)?.add(e.source);
  }

  let overallStatus: 'success' | 'failed' | 'partial' = 'success';
  const completed = new Set<string>();
  const failed = new Set<string>();

  // Parallel execution: run all ready nodes concurrently per layer.
  while (completed.size + failed.size < nodesToExecute.length) {
    const ready: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0 && !completed.has(id) && !failed.has(id)) ready.push(id);
    }

    if (ready.length === 0) {
      // Cycle or missing deps; mark remaining as failed.
      for (const id of nodeById.keys()) {
        if (completed.has(id) || failed.has(id)) continue;
        failed.add(id);
        overallStatus = overallStatus === 'success' ? 'partial' : 'failed';
        const now = new Date();
        nodeResults.push({
          nodeId: id,
          status: 'failed',
          input: getNodeInputs(id, nodes, edges, executionResults),
          output: null,
          error: 'Workflow contains a cycle or unresolved dependency',
          duration: 0,
          startedAt: now,
          completedAt: now,
        });
      }
      break;
    }

    const executions = await Promise.all(
      ready.map(async (id) => {
        const node = nodeById.get(id)!;
        const nodeStartTime = Date.now();
        const nodeStartedAt = new Date();
        const inputs = getNodeInputs(node.id, nodes, edges, executionResults);

        // If any dependency failed, skip.
        const upstream = deps.get(id) || new Set<string>();
        for (const upstreamId of upstream) {
          if (failed.has(upstreamId)) {
            const now = new Date();
            return {
              id,
              result: {
                nodeId: node.id,
                status: 'skipped' as const,
                input: inputs,
                output: null,
                error: 'Skipped due to failed dependency',
                duration: 0,
                startedAt: now,
                completedAt: now,
              },
              output: undefined,
              error: 'skipped',
            };
          }
        }

        const { output, error } = await executeNode(node, inputs);
        const nodeCompletedAt = new Date();
        const nodeDuration = Date.now() - nodeStartTime;

        const result: ExecutionResult = {
          nodeId: node.id,
          status: error ? 'failed' : 'success',
          input: inputs,
          output,
          error,
          duration: nodeDuration,
          startedAt: nodeStartedAt,
          completedAt: nodeCompletedAt,
        };

        return { id, result, output, error };
      })
    );

    for (const exec of executions) {
      nodeResults.push(exec.result);
      if (exec.result.status === 'success') {
        completed.add(exec.id);
        executionResults.set(exec.id, exec.output);
      } else if (exec.result.status === 'skipped') {
        // Skipped nodes count as failures for downstream blocking.
        failed.add(exec.id);
        overallStatus = overallStatus === 'success' ? 'partial' : 'failed';
      } else {
        failed.add(exec.id);
        overallStatus = overallStatus === 'success' ? 'partial' : 'failed';
      }

      // Decrement dependents regardless; they will decide to skip if deps failed.
      for (const dep of dependents.get(exec.id) || []) {
        inDegree.set(dep, Math.max(0, (inDegree.get(dep) || 0) - 1));
      }
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
