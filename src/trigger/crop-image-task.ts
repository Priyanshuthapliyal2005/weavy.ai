import { task, logger } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { Transloadit } from "transloadit";

// Configure ffmpeg paths from environment variables (set by ffmpeg build extension)
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

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

      // Create temp paths using OS temp directory
      const tmpDir = os.tmpdir();
      const inputPath = path.join(tmpDir, `input_${Date.now()}.jpg`);
      const outputPath = path.join(tmpDir, `output_${Date.now()}.jpg`);

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

      // Validate crop bounds
      if (cropX + cropWidth > width) {
        throw new Error(
          `Invalid crop: x (${cropX}) + width (${cropWidth}) = ${cropX + cropWidth} exceeds image width (${width})`
        );
      }
      if (cropY + cropHeight > height) {
        throw new Error(
          `Invalid crop: y (${cropY}) + height (${cropHeight}) = ${cropY + cropHeight} exceeds image height (${height})`
        );
      }
      if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error(
          `Invalid crop dimensions: width (${cropWidth}) and height (${cropHeight}) must be positive`
        );
      }

      logger.info("Cropping image with validated parameters", {
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

      // Upload to Transloadit/R2
      const transloadit = new Transloadit({
        authKey: process.env.TRANSLOADIT_AUTH_KEY!,
        authSecret: process.env.TRANSLOADIT_AUTH_SECRET!,
      });

      const assembly = await transloadit.createAssembly({
        params: ({
          steps: {
            ':original': {
              robot: '/upload/handle',
            },
            optimized: {
              use: ':original',
              robot: '/image/optimize',
              progressive: true,
              quality: 'medium',
            },
          },
        } as any),
        uploads: {
          [`cropped_${Date.now()}.jpg`]: croppedBuffer,
        },
        waitForCompletion: true,
      });

      // Check for assembly errors
      if (assembly.error) {
        logger.error("Transloadit assembly failed", {
          error: assembly.error,
          assembly_id: assembly.assembly_id,
        });
        throw new Error(`Transloadit error: ${assembly.error}`);
      }

      const url = assembly.results?.optimized?.[0]?.ssl_url;

      if (!url) {
        logger.error("No output URL from Transloadit", {
          assembly_id: assembly.assembly_id,
          results: assembly.results,
        });
        throw new Error('Failed to get upload URL from Transloadit');
      }

      // Clean up temp files
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});

      logger.info("Image crop completed", { url });

      return {
        output: url,
        dimensions: { width: cropWidth, height: cropHeight },
      };
    } catch (error) {
      logger.error("Image crop failed", { error });
      throw error;
    }
  },
});
