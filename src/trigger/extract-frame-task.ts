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

export interface ExtractFramePayload {
  videoUrl: string;
  timestamp?: string | number; // seconds or "50%" format
}

export const extractFrameTask = task({
  id: "extract-frame",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: ExtractFramePayload) => {
    logger.info("Starting frame extraction task", {
      videoUrl: payload.videoUrl,
    });

    const { videoUrl, timestamp = 0 } = payload;

    try {
      // Fetch the video
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }

      // Create temp paths using OS temp directory
      const tmpDir = os.tmpdir();
      const inputPath = path.join(tmpDir, `input_${Date.now()}.mp4`);
      const outputPath = path.join(tmpDir, `frame_${Date.now()}.jpg`);

      // Save input video
      const buffer = await response.arrayBuffer();
      await fs.writeFile(inputPath, Buffer.from(buffer));

      // Get video duration for percentage calculations
      const probe = await new Promise<any>((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });

      const duration = probe.format.duration;

      // Calculate timestamp in seconds
      let seekTime: number;
      if (typeof timestamp === "string" && timestamp.includes("%")) {
        const percentage = parseFloat(timestamp.replace("%", ""));
        seekTime = (duration * percentage) / 100;
      } else {
        seekTime = typeof timestamp === "number" ? timestamp : parseFloat(timestamp);
      }

      logger.info("Extracting frame", {
        duration,
        seekTime,
        originalTimestamp: timestamp,
      });

      // Extract frame using FFmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(seekTime)
          .frames(1)
          .output(outputPath)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });

      // Read the output file
      const frameBuffer = await fs.readFile(outputPath);

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
          [`frame_${Date.now()}.jpg`]: frameBuffer,
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

      logger.info("Frame extraction completed", { url, timestamp: seekTime });

      return {
        output: url,
        timestamp: seekTime,
      };
    } catch (error) {
      logger.error("Frame extraction failed", { error });
      throw error;
    }
  },
});
