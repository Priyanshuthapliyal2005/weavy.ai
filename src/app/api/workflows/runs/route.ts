import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = req.nextUrl.searchParams.get('workflowId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    
    const where: any = {};
    if (workflowId) {
      where.workflowId = workflowId;
    }

    const runs = await prisma.workflowRun.findMany({
      where,
      include: {
        nodeExecutions: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      runs: runs.map(run => ({
        id: run.id,
        workflowId: run.workflowId,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        duration: run.duration,
        executionLogs: run.executionLogs,
        nodeExecutions: run.nodeExecutions.map(ne => ({
          id: ne.id,
          nodeId: ne.nodeId,
          status: ne.status,
          output: ne.output,
          error: ne.error,
          duration: ne.duration,
        })),
      })),
    });
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow runs' },
      { status: 500 }
    );
  }
}
