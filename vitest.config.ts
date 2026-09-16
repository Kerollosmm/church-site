// vitest.config.ts
// The unit-test runner for the parish portal's PURE core.
//
// WHY SO SMALL: the tests in `src/**/*.test.ts` deliberately exercise code that needs no network, no
// Supabase project and no browser — the recurrence engine, the capability table, the URL filter
// vocabulary, the e-mail rules, the iCal writer, the Coptic calendar and the file-backed store
// (which is pointed at a temporary directory by each test). So the only configuration required is
// the `@/*` alias the source already uses and the node environment.
//
// The alias is mirrored from `tsconfig.json:paths` by hand on purpose: a plugins-based resolver
// (`vite-tsconfig-paths`) would be one more dependency for one line of mapping.

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // A store test writes its document into an OS temp directory and removes it afterwards; keeping
    // the worker pool modest keeps those file operations from competing with each other.
    pool: "threads",
    testTimeout: 20_000,
  },
});
