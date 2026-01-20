import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';
import { executeWorkflow } from '@/lib/workflow-execution';
import type { CustomNode } from '@/types/workflow';
import type { Edge } from '@xyflow/react';

const executeSchema = z.object({
  workflowId: z.string().min(1).optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  selectedNodeIds: z.array(z.string()).optional(),
  scope: z.enum(['full', 'partial', 'single']).default('full'),
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
    const validated = executeSchema.parse(body);
    
    // Execute the workflow
    const result = await executeWorkflow(
      validated.nodes as CustomNode[],
      validated.edges as Edge[],
      validated.selectedNodeIds
    );

    const workflowId = validated.workflowId;
    const isPersistableWorkflowId = !!workflowId && workflowId !== 'temp';

    if (!isPersistableWorkflowId) {
      return NextResponse.json({
        runId: null,
        status: result.status,
        duration: result.totalDuration,
        nodeResults: result.nodeResults,
      });
    }

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflowRun = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        status: result.status,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        duration: result.totalDuration,
        executionLogs: [
          {
            scope: validated.scope,
            nodeCount: validated.nodes.length,
            selectedNodes: validated.selectedNodeIds,
          },
        ],
        nodeExecutions: {
          create: result.nodeResults.map((nr) => ({
            nodeId: nr.nodeId,
            status: nr.status,
            input: nr.input == null ? Prisma.JsonNull : { data: nr.input },
            output: nr.output == null ? Prisma.JsonNull : { data: nr.output },
            error: nr.error,
            duration: nr.duration,
            createdAt: nr.startedAt,
          })),
        },
      },
      include: {
        nodeExecutions: true,
      },
    });

    return NextResponse.json({
      runId: workflowRun.id,
      status: result.status,
      duration: result.totalDuration,
      nodeResults: result.nodeResults,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
