import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';

const nodeResultSchema = z.object({
  nodeId: z.string().min(1),
  status: z.enum(['success', 'failed', 'skipped']),
  input: z.any().optional(),
  output: z.any().optional(),
  error: z.string().optional().nullable(),
  duration: z.number().optional(),
  startedAt: z.union([z.string(), z.date()]).optional(),
  completedAt: z.union([z.string(), z.date()]).optional(),
});

const schema = z.object({
  workflowId: z.string().min(1),
  scope: z.enum(['full', 'partial', 'single']).default('full'),
  selectedNodeIds: z.array(z.string()).optional(),
  status: z.enum(['success', 'failed', 'partial']),
  totalDuration: z.number().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  nodeResults: z.array(nodeResultSchema).default([]),
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

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: validated.workflowId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const startedAt = validated.startedAt ? new Date(validated.startedAt) : new Date();
    const completedAt = validated.completedAt ? new Date(validated.completedAt) : new Date();
    const duration = validated.totalDuration ?? Math.max(0, completedAt.getTime() - startedAt.getTime());

    const workflowRun = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        status: validated.status,
        startedAt,
        completedAt,
        duration,
        executionLogs: [
          {
            scope: validated.scope,
            nodeCount: validated.nodeResults.length,
            selectedNodes: validated.selectedNodeIds,
          },
        ],
        nodeExecutions: {
          create: validated.nodeResults.map((nr) => {
            const nrStartedAt = nr.startedAt ? new Date(nr.startedAt as any) : startedAt;
            return {
              nodeId: nr.nodeId,
              status: nr.status,
              input: nr.input == null ? Prisma.JsonNull : { data: nr.input },
              output: nr.output == null ? Prisma.JsonNull : { data: nr.output },
              error: nr.error ?? null,
              duration: nr.duration ?? 0,
              createdAt: nrStartedAt,
            };
          }),
        },
      },
      include: { nodeExecutions: true },
    });

    return NextResponse.json({
      runId: workflowRun.id,
      status: workflowRun.status,
    });
  } catch (error) {
    console.error('Error saving workflow run:', error);
    return NextResponse.json({ error: 'Failed to save workflow run' }, { status: 500 });
  }
}
