import { defineConfig } from "@trigger.dev/sdk/v3";
import { ffmpeg } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: "proj_ikpaxxxcpmrlbpfgfzyo",
  dirs: ["./src/trigger"],
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  maxDuration: 600, // 10 minutes for FFmpeg operations
  machine: "small-1x", // Default machine preset
  build: {
    extensions: [ffmpeg()],
    external: ["fluent-ffmpeg"],
  },
});
