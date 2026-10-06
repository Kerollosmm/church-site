// apps/admin/src/actions/__tests__/use-server-contract.test.ts
// Contract tests ensuring Next.js 15 "use server" files only export async functions.

import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function findTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__" && entry.name !== "node_modules") {
        files.push(...findTsFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Next.js 15 'use server' Module Shape Contract", () => {
  const repoRoot = path.resolve(__dirname, "../../../../..");
  const adminActionsDir = path.resolve(repoRoot, "apps/admin/src/actions");
  const webActionsDir = path.resolve(repoRoot, "apps/web/src/actions");

  const adminFiles = findTsFiles(adminActionsDir);
  const webFiles = findTsFiles(webActionsDir);
  const allActionFiles = [...adminFiles, ...webFiles];

  it("found server action files to inspect", () => {
    expect(adminFiles.length).toBeGreaterThan(0);
    expect(webFiles.length).toBeGreaterThan(0);
  });

  for (const filePath of allActionFiles) {
    const relativePath = path.relative(repoRoot, filePath);

    it(`enforces 'use server' contract for ${relativePath}`, () => {
      const content = fs.readFileSync(filePath, "utf-8");
      const hasUseServer = /^\s*["']use server["']/m.test(content);

      if (!hasUseServer) {
        // Not a "use server" module (e.g. *.shared.ts)
        return;
      }

      // Check lines for illegal non-async exports
      // Illegal in "use server":
      // export const ...
      // export let ...
      // export var ...
      // export class ...
      // export enum ...
      // export function (not async)
      // export default (not async)
      const lines = content.split("\n");
      const violations: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip comments
        if (line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) continue;

        // Disallow export const/let/var/class/enum/non-async function
        if (/^export\s+(const|let|var|class|enum)\s+/.test(line)) {
          violations.push(`Line ${i + 1}: ${line}`);
        }
        if (/^export\s+function\s+(?!async)/.test(line)) {
          violations.push(`Line ${i + 1}: ${line}`);
        }
        if (/^export\s+default\s+(?!async)/.test(line)) {
          violations.push(`Line ${i + 1}: ${line}`);
        }
      }

      expect(violations, `Illegal exports found in "use server" file: ${violations.join(", ")}`).toEqual([]);
    });
  }
});
