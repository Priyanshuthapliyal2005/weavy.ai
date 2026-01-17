import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'
import { workflowUpdateSchema } from '@/lib/schema'
import { hasCycle } from '@/lib/dag-validation'
import type { Edge } from '@xyflow/react'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: workflow.id,
      name: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
      version: workflow.version,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = workflowUpdateSchema.parse(body)

    if (validated.edges !== undefined) {
      const edges = validated.edges as Edge[]
      if (hasCycle(edges)) {
        return NextResponse.json(
          { error: 'Workflow contains cycles. Workflows must be acyclic (DAG).' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validated.name !== undefined) updateData.name = validated.name.trim().slice(0, 200)
    if (validated.nodes !== undefined) updateData.nodes = validated.nodes
    if (validated.edges !== undefined) updateData.edges = validated.edges
    if (validated.version !== undefined) updateData.version = validated.version

    const updated = await prisma.workflow.update({
      where: {
        id,
        userId,
      },
      data: updateData,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      nodes: updated.nodes,
      edges: updated.edges,
      version: updated.version,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.workflow.delete({
      where: {
        id,
        userId,
      },
    })

    if (!result) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
