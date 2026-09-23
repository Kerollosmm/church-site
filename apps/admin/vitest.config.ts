import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@church-site/domain": fileURLToPath(new URL("../../packages/domain/src", import.meta.url)),
      "@church-site/data-access": fileURLToPath(new URL("../../packages/data-access/src", import.meta.url)),
      "@church-site/ui": fileURLToPath(new URL("../../packages/ui/src", import.meta.url)),
      "next/cache": fileURLToPath(new URL("./node_modules/next/cache.js", import.meta.url)),
      "next/headers": fileURLToPath(new URL("./node_modules/next/headers.js", import.meta.url)),
      "next/navigation": fileURLToPath(new URL("./node_modules/next/navigation.js", import.meta.url)),
      "next": fileURLToPath(new URL("./node_modules/next", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: [fileURLToPath(new URL("../../vitest.setup.ts", import.meta.url))],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    pool: "forks",
    testTimeout: 20_000,
  },
});
