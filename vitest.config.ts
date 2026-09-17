// vitest.config.ts
// The unit-test runner for the parish portal's PURE core.
//
// WHY SO SMALL: the tests in apps/web/src/**/*.test.ts deliberately exercise code that needs no network, no
// Supabase project and no browser — the recurrence engine, the capability table, the URL filter
// vocabulary, the e-mail rules, the iCal writer, the Coptic calendar and the file-backed store
// (which is pointed at a temporary directory by each test). So the only configuration required is
// the @/* alias the source already uses and the node environment.
//
// The alias is mirrored from `tsconfig.json:paths` by hand on purpose: a plugins-based resolver
// (`vite-tsconfig-paths`) would be one more dependency for one line of mapping.

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
      "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
      "@admin": fileURLToPath(new URL("./apps/admin/src", import.meta.url)),
      "@church-site/domain": fileURLToPath(new URL("./packages/domain/src", import.meta.url)),
      "@church-site/data-access": fileURLToPath(new URL("./packages/data-access/src", import.meta.url)),
      "@church-site/ui": fileURLToPath(new URL("./packages/ui/src", import.meta.url)),
      "next/cache": fileURLToPath(new URL("./apps/web/node_modules/next/cache.js", import.meta.url)),
      "next/headers": fileURLToPath(new URL("./apps/web/node_modules/next/headers.js", import.meta.url)),
      "next": fileURLToPath(new URL("./apps/web/node_modules/next", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
    ],
    // A store test writes its document into an OS temp directory and removes it afterwards; keeping
    // the worker pool modest keeps those file operations from competing with each other.
    pool: "threads",
    testTimeout: 20_000,
  },
});
