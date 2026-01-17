import { task, logger } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";

export interface CropImagePayload {
  imageUrl: string;
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
}

export const cropImageTask = task({
  id: "crop-image",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: CropImagePayload) => {
    logger.info("Starting image crop task", { imageUrl: payload.imageUrl });

    const {
      imageUrl,
      xPercent = 0,
      yPercent = 0,
      widthPercent = 100,
      heightPercent = 100,
    } = payload;

    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Create temp paths
      const inputPath = path.join("/tmp", `input_${Date.now()}.jpg`);
      const outputPath = path.join("/tmp", `output_${Date.now()}.jpg`);

      // Save input image
      const buffer = await response.arrayBuffer();
      await fs.writeFile(inputPath, Buffer.from(buffer));

      // Get image dimensions first
      const probe = await new Promise<any>((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });

      const width = probe.streams[0].width;
      const height = probe.streams[0].height;

      // Calculate crop dimensions
      const cropX = Math.floor((width * xPercent) / 100);
      const cropY = Math.floor((height * yPercent) / 100);
      const cropWidth = Math.floor((width * widthPercent) / 100);
      const cropHeight = Math.floor((height * heightPercent) / 100);

      logger.info("Cropping image", {
        original: { width, height },
        crop: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
      });

      // Crop the image using FFmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .videoFilters(`crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`)
          .output(outputPath)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });

      // Read the output file
      const croppedBuffer = await fs.readFile(outputPath);
      const base64Image = croppedBuffer.toString("base64");

      // Clean up temp files
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});

      logger.info("Image crop completed");

      return {
        output: `data:image/jpeg;base64,${base64Image}`,
        dimensions: { width: cropWidth, height: cropHeight },
      };
    } catch (error) {
      logger.error("Image crop failed", { error });
      throw error;
    }
  },
});
