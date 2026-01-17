import { prisma } from "@/lib/db/client";
import { auth } from "@clerk/nextjs/server";
import { Edge } from "@xyflow/react";
import { NextRequest } from "next/server";
import { workflowCreateSchema } from "@/lib/schema";
import { hasCycle } from "@/lib/dag-validation";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
        const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
            return new Response("Invalid pagination parameters", { status: 400 });
        }

        const [workflow , total] = await Promise.all([
            prisma.workflow.findMany({
                where: { userId },
                skip: offset,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.workflow.count({
                where: { userId },
            }),
        ]);

        return new Response(JSON.stringify({ workflow, total , page, limit , totalPages: Math.ceil(total / limit) }), { status: 200 });
    }
    catch (error) {
        console.error("Error fetching workflows:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return new Response("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const validated = workflowCreateSchema.parse(body)

        const edges = validated.edges as Edge[]
        if(hasCycle(edges)){
            return new Response("Workflow graph contains a cycle", { status: 400 })
        }

        const workflow = await prisma.workflow.create({
            data: {
                userId,
                name: validated.name.trim().slice(0, 100),
                nodes: validated.nodes as any,
                edges: validated.edges as any,
                version: validated.version || "1.0.0",
            },
        })

        return new Response(JSON.stringify(workflow), { status: 201 })
    }
    catch (error) {
        console.error("Error creating workflow:", error)
        return new Response("Internal Server Error", { status: 500 })
    }
}