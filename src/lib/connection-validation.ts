import type { Connection } from "@xyflow/react";
import type { WorkflowEdge, WorkflowNode } from "@/store/workflow-store";
import { HANDLE_IDS } from "@/constants/node-ids";

type OutputKind = "text" | "image" | "video";
type InputKind = "text" | "image" | "video" | "number";

export type ConnectionValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

function getOutputKind(nodeType: string | undefined): OutputKind | null {
  switch (nodeType) {
    case "text":
    case "llm":
      return "text";
    case "image":
    case "crop":
    case "extract":
      return "image";
    case "video":
      return "video";
    default:
      return null;
  }
}

function getTargetInputKind(
  nodeType: string | undefined,
  targetHandle: string | null | undefined
): InputKind | null {
  if (!nodeType || !targetHandle) return null;

  if (nodeType === "llm") {
    if (
      targetHandle === HANDLE_IDS.PROMPT ||
      targetHandle === HANDLE_IDS.SYSTEM_PROMPT ||
      targetHandle === HANDLE_IDS.USER_MESSAGE
    ) {
      return "text";
    }
    if (targetHandle === HANDLE_IDS.IMAGES || targetHandle.startsWith("image_")) {
      return "image";
    }
  }

  if (nodeType === "crop") {
    if (
      targetHandle === HANDLE_IDS.IMAGE_URL ||
      targetHandle === HANDLE_IDS.IMAGE ||
      targetHandle === HANDLE_IDS.IMAGE_1
    ) {
      return "image";
    }
    if (
      targetHandle === HANDLE_IDS.X_PERCENT ||
      targetHandle === HANDLE_IDS.Y_PERCENT ||
      targetHandle === HANDLE_IDS.WIDTH_PERCENT ||
      targetHandle === HANDLE_IDS.HEIGHT_PERCENT
    ) {
      return "number";
    }
  }

  if (nodeType === "extract") {
    if (targetHandle === HANDLE_IDS.VIDEO_URL) return "video";
    if (targetHandle === HANDLE_IDS.TIMESTAMP) return "number";
  }

  if (targetHandle === HANDLE_IDS.INPUT) return "text";
  return null;
}

function wouldCreateCycle(source: string, target: string, edges: WorkflowEdge[]): boolean {
  // Adding edge source -> target creates a cycle iff there is already a path target -> source.
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!e.source || !e.target) continue;
    const list = adj.get(e.source) ?? [];
    list.push(e.target);
    adj.set(e.source, list);
  }

  const stack = [target];
  const visited = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === source) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const next = adj.get(cur) ?? [];
    for (const n of next) {
      if (!visited.has(n)) stack.push(n);
    }
  }
  return false;
}

export function validateConnection(
  connection: Connection,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ConnectionValidationResult {
  const sourceId = connection.source;
  const targetId = connection.target;
  const sourceHandle = connection.sourceHandle ?? HANDLE_IDS.OUTPUT;
  const targetHandle = connection.targetHandle ?? HANDLE_IDS.INPUT;

  if (!sourceId || !targetId) {
    return { ok: false, reason: "Invalid connection" };
  }
  if (sourceId === targetId) {
    return { ok: false, reason: "Can't connect a node to itself" };
  }

  // We only support output -> input connections (all outputs are 'output' in this app).
  if (sourceHandle !== HANDLE_IDS.OUTPUT) {
    return { ok: false, reason: "Start from an output handle" };
  }
  if (targetHandle === HANDLE_IDS.OUTPUT) {
    return { ok: false, reason: "Can't connect into an output handle" };
  }

  // Single incoming edge per input handle.
  const alreadyConnected = edges.some(
    (e) => e.target === targetId && (e.targetHandle ?? HANDLE_IDS.INPUT) === targetHandle
  );
  if (alreadyConnected) {
    return { ok: false, reason: "That input is already connected" };
  }

  // DAG enforcement.
  if (wouldCreateCycle(sourceId, targetId, edges)) {
    return { ok: false, reason: "That connection would create a cycle" };
  }

  const sourceNode = nodes.find((n) => n.id === sourceId);
  const targetNode = nodes.find((n) => n.id === targetId);

  const sourceKind = getOutputKind(sourceNode?.type);
  const targetKind = getTargetInputKind(targetNode?.type, targetHandle);

  if (!sourceKind || !targetKind) {
    return { ok: false, reason: "Incompatible connection" };
  }

  if (targetKind === "number") {
    // Numeric inputs parseFloat() from upstream values; in this app only text-like outputs provide that.
    return sourceKind === "text"
      ? { ok: true }
      : { ok: false, reason: "This input expects a number" };
  }

  if (sourceKind !== targetKind) {
    return { ok: false, reason: "Incompatible connection" };
  }

  return { ok: true };
}
