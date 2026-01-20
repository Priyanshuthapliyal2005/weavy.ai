import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import { llmRequestSchema } from "@/lib/schema";
import type { runLLMTask } from "@/trigger";

const LLM_API_TIMEOUT_MS = 60_000;

function isRateLimitError(err: unknown, message: string): boolean {
  const anyErr = err as any;
  const status = anyErr?.status ?? anyErr?.statusCode ?? anyErr?.response?.status;
  const code = anyErr?.code ?? anyErr?.error?.code;
  if (status === 429) return true;
  if (code === 429) return true;
  if (typeof code === "string") {
    const c = code.toLowerCase();
    if (c.includes("rate") || c.includes("quota") || c.includes("resource_exhausted")) return true;
  }

  const m = message.toLowerCase();
  return (
    message.includes("429") ||
    m.includes("too many requests") ||
    m.includes("rate limit") ||
    m.includes("ratelimit") ||
    m.includes("quota") ||
    message.includes("rateLimitExceeded") ||
    message.includes("RESOURCE_EXHAUSTED")
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = llmRequestSchema.parse(body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_API_TIMEOUT_MS);

    try {
      const handle = await tasks.trigger<typeof runLLMTask>("run-llm", {
        model: validated.model,
        systemPrompt: validated.systemPrompt,
        userMessage: validated.userMessage,
        images: validated.images,
        temperature: validated.temperature,
        thinking: validated.thinking,
      });

      // Poll for completion (max ~60 seconds)
      const maxAttempts = 60;
      for (let i = 0; i < maxAttempts; i++) {
        const run = await runs.retrieve(handle);

        if (run.isCompleted) {
          const taskOutput = run.output as any;

          if (taskOutput?.code === "RATE_LIMIT") {
            return NextResponse.json(
              {
                code: "RATE_LIMIT",
                error:
                  taskOutput?.output ||
                  "Rate limit due to heavy traffic. Please wait a moment and try again.",
              },
              { status: 429 }
            );
          }

          const output = taskOutput?.output;
          return NextResponse.json({ output: output ?? null });
        }

        if (run.isFailed) {
          const err = run.output ? JSON.stringify(run.output) : "LLM task failed";
          throw new Error(err);
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      return NextResponse.json({ error: "LLM request timed out." }, { status: 504 });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.issues[0]?.message ?? "Invalid input"}` },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : String(error);

    if (isRateLimitError(error, message)) {
      return NextResponse.json(
        {
          code: "RATE_LIMIT",
          error: "Rate limit due to heavy traffic. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    if (message.includes("AbortError")) {
      return NextResponse.json(
        { error: "LLM request timed out." },
        { status: 504 }
      );
    }

    // Never send giant provider payloads to the client.
    const safe = (message || "LLM request failed").slice(0, 500);
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}
