#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";

/**
 * Lightweight zero-dependency secret scanner.
 * Inspects all git-tracked files for potential leaked secrets.
 * NEVER prints secret values; only reports file paths and line numbers.
 */

const SECRET_RULES = [
  {
    name: "Private Key Header",
    pattern: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY/i,
  },
  {
    name: "JWT Token",
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
  {
    name: "AWS Access Key",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: "Hardcoded Password Assignment",
    pattern: /(?:password|passwd|pwd|secret)\s*[:=]\s*["'][^"'\n]{8,}["']/i,
    ignore: (line, file) => {
      // Allow benign test fixtures and documentation
      if (file.endsWith(".spec.ts") || file.endsWith(".test.ts")) return true;
      if (file.endsWith(".example") || file.endsWith(".md")) return true;
      if (file === "scripts/scan-secrets.mjs") return true;
      if (/InvalidPassword/i.test(line)) return true;
      return false;
    },
  },
];

const IGNORE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz",
  ".pdf",
]);

const IGNORE_FILES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
]);

function run() {
  let trackedFiles = [];
  try {
    const stdout = execSync("git ls-files", { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
    trackedFiles = stdout.split(/\r?\n/).filter(Boolean);
  } catch (err) {
    console.error("Error listing git tracked files:", err.message);
    process.exit(1);
  }

  const findings = [];

  for (const file of trackedFiles) {
    if (IGNORE_FILES.has(file)) continue;
    const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
    if (IGNORE_EXTENSIONS.has(ext)) continue;

    if (!fs.existsSync(file)) continue;

    let content = "";
    try {
      content = fs.readFileSync(file, "utf-8");
    } catch {
      // Skip binary or unreadable files
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const rule of SECRET_RULES) {
        if (rule.ignore && rule.ignore(line, file)) continue;
        if (rule.pattern.test(line)) {
          findings.push({
            file,
            line: i + 1,
            rule: rule.name,
          });
        }
      }
    }
  }

  if (findings.length > 0) {
    console.error(`\x1b[31m[ERROR] Detected ${findings.length} potential secret(s) in repository:\x1b[0m`);
    for (const f of findings) {
      console.error(`  - ${f.file}:${f.line} [Rule: ${f.rule}]`);
    }
    console.error("\x1b[31mPlease remove secrets from source code and use environment variables.\x1b[0m");
    process.exit(1);
  }

  console.log("Secret scan passed: 0 secrets detected.");
  process.exit(0);
}

run();
