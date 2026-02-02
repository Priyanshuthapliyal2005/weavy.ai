import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';
import type { CustomNode } from '@/types/workflow';
import type { Edge } from '@xyflow/react';
import { executeNode, type ExecutionResult } from '@/lib/workflow-execution';
import { getNodeInputs } from '@/lib/workflow-graph';

const schema = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  layerNodeIds: z.array(z.string().min(1)).min(1),
  priorOutputs: z.any().optional(),
  priorStatuses: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const validated = schema.parse(body);

    const nodes = validated.nodes as CustomNode[];
    const edges = validated.edges as Edge[];

    const executionResults = new Map<string, any>(
      Object.entries(validated.priorOutputs ?? {})
    );

    const statusById = new Map<string, 'success' | 'failed' | 'skipped'>(
      Object.entries(validated.priorStatuses ?? {}) as any
    );

    const nodeById = new Map(nodes.map((n) => [n.id, n] as const));

    const results: ExecutionResult[] = [];

    await Promise.all(
      validated.layerNodeIds.map(async (nodeId) => {
        const node = nodeById.get(nodeId);
        const now = new Date();

        if (!node) {
          results.push({
            nodeId,
            status: 'failed',
            input: {},
            output: null,
            error: 'Node not found',
            duration: 0,
            startedAt: now,
            completedAt: now,
          });
          return;
        }

        const inputs = getNodeInputs(nodeId, nodes, edges, executionResults);

        // Skip if any upstream dependency failed/skipped.
        const incoming = edges.filter((e) => e.target === nodeId);
        const hasFailedDep = incoming.some((e) => {
          const s = statusById.get(e.source);
          return s === 'failed' || s === 'skipped';
        });

        if (hasFailedDep) {
          results.push({
            nodeId,
            status: 'skipped',
            input: inputs,
            output: null,
            error: 'Skipped due to failed dependency',
            duration: 0,
            startedAt: now,
            completedAt: now,
          });
          return;
        }

        const nodeStart = Date.now();
        const startedAt = new Date();
        const { output, error } = await executeNode(node, inputs);
        const completedAt = new Date();

        results.push({
          nodeId,
          status: error ? 'failed' : 'success',
          input: inputs,
          output,
          error,
          duration: Date.now() - nodeStart,
          startedAt,
          completedAt,
        });
      })
    );

    // Preserve request order (useful for UI consistency)
    const resultById = new Map(results.map((r) => [r.nodeId, r] as const));
    const ordered = validated.layerNodeIds
      .map((id) => resultById.get(id))
      .filter(Boolean) as ExecutionResult[];

    return NextResponse.json({ nodeResults: ordered });
  } catch (error) {
    console.error('Error executing workflow layer:', error);
    return NextResponse.json({ error: 'Failed to execute workflow layer' }, { status: 500 });
  }
}
