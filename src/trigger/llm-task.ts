import { task, logger } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export interface LLMTaskPayload {
  model: string;
  systemPrompt?: string;
  userMessage?: string;
  images?: string[];
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
      const model = genAI.getGenerativeModel({ model: payload.model });

      // Build the parts for the prompt
      const parts: any[] = [];

      // Add system prompt if provided
      if (payload.systemPrompt) {
        parts.push({ text: `System: ${payload.systemPrompt}\n\n` });
      }

      // Add user message
      if (payload.userMessage) {
        parts.push({ text: payload.userMessage });
      }

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

      // Generate content
      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      logger.info("LLM task completed", { outputLength: text.length });

      return {
        output: text,
        model: payload.model,
      };
    } catch (error) {
      logger.error("LLM task failed", { error });
      throw error;
    }
  },
});
