import { task, logger } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPlainTextSystemInstruction, sanitizeLlmPlainText } from "@/lib/llm-format";

const apiKey: string | undefined =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY;

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function isRateLimitError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    message.includes("429") ||
    m.includes("too many requests") ||
    m.includes("quota") ||
    m.includes("rate limit") ||
    message.includes("rateLimitExceeded") ||
    message.includes("RESOURCE_EXHAUSTED")
  );
}

export interface LLMTaskPayload {
  model: string;
  systemPrompt?: string;
  userMessage?: string;
  images?: string[];
  temperature?: number;
  thinking?: any;
}

export const runLLMTask = task({
  id: "run-llm",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: LLMTaskPayload) => {
    logger.info("Starting LLM task", { model: payload.model });

    try {
      if (!genAI) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      const modelConfig: any = {
        model: payload.model,
        systemInstruction: buildPlainTextSystemInstruction(payload.systemPrompt),
      };

      if (payload.temperature !== undefined) {
        modelConfig.generationConfig = { temperature: payload.temperature };
      }

      if (payload.thinking !== undefined) {
        modelConfig.thinking = payload.thinking;
      }

      const model = genAI.getGenerativeModel(modelConfig);

      // Build prompt parts
      const parts: any[] = [];

      // Add images if provided
      if (payload.images && payload.images.length > 0) {
        for (const imageUrl of payload.images) {
          try {
            const response = await fetch(imageUrl);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");

            parts.push({
              inlineData: {
                data: base64,
                mimeType: response.headers.get("content-type") || "image/jpeg",
              },
            });
          } catch (error) {
            logger.warn("Failed to fetch image", { imageUrl, error });
          }
        }
      }

      // Add user message
      if (payload.userMessage) {
        parts.push({ text: payload.userMessage });
      }

      // Validate that we have content to generate
      if (parts.length === 0) {
        throw new Error("No content provided for LLM generation");
      }

      // Generate content
      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = sanitizeLlmPlainText(response.text());

      logger.info("LLM task completed", { 
        outputLength: text.length,
        imageCount: payload.images?.length || 0 
      });

      return {
        output: text,
        model: payload.model,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (isRateLimitError(errorMessage)) {
        logger.warn("LLM rate limited", {
          model: payload.model,
          imageCount: payload.images?.length || 0,
        });

        // Important: return a successful completion so `trigger.dev dev` keeps running
        // even when the provider is temporarily rate-limited.
        return {
          code: "RATE_LIMIT",
          output: "Rate limit due to heavy traffic. Please wait a moment and try again.",
          model: payload.model,
        };
      }

      logger.error("LLM task failed", {
        error: errorMessage,
        model: payload.model,
        hasSystemPrompt: !!payload.systemPrompt,
        hasUserMessage: !!payload.userMessage,
        imageCount: payload.images?.length || 0,
      });
      throw error;
    }
  },
});
