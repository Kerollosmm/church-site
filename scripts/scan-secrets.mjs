#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";

/**
 * Lightweight zero-dependency secret scanner.
 * Inspects current git-tracked files for potential leaked credentials.
 * NEVER prints secret values; only reports file paths, line numbers, and rule names.
 *
 * Scope note:
 * - Scans current tree (git ls-files).
 * - Does NOT scan historic git commits (use gitleaks or git-filter-repo for historical audits).
 */

const SECRET_RULES = [
  {
    name: "Private Key Header",
    pattern: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY/i,
  },
  {
    name: "GitHub Classic Personal Access Token",
    pattern: /\bghp_[A-Za-z0-9]{36}\b/,
  },
  {
    name: "GitHub Fine-Grained Personal Access Token",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{82}\b/,
  },
  {
    name: "GitHub OAuth / App Token",
    pattern: /\b(?:gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/,
  },
  {
    name: "AWS Access Key ID",
    pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/,
  },
  {
    name: "JWT Token",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    ignore: (line) => {
      // Allow documentation examples and obvious placeholders with ellipsis
      if (line.includes("...") || /placeholder|dummy|example|your-token/i.test(line)) return true;
      return false;
    },
  },
  {
    name: "Supabase Service Role Key Assignment",
    pattern: /(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY)\s*[:=]\s*["'][A-Za-z0-9_.-]{20,}["']/i,
    ignore: (line, file) => {
      if (/your-service-role-key|placeholder|dummy|CHANGE_ME|example/i.test(line)) return true;
      if (file.endsWith(".example")) return true;
      return false;
    },
  },
  {
    name: "Hardcoded Password / Secret Assignment",
    pattern: /(?:password|passwd|pwd|secret_key|api_secret)\s*[:=]\s*["'][^"'\n]{8,}["']/i,
    ignore: (line, file) => {
      // Narrow exemptions: ignore the scanner itself and explicit benign dummy placeholders
      if (file === "scripts/scan-secrets.mjs") return true;
      if (file.endsWith(".example")) return true;
      if (/dummy|placeholder|CHANGE_ME|fake|mock|test-password|secret-value|your-secret|sample-password|InvalidPassword/i.test(line)) return true;
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

  console.log("Current-tree secret scan passed: 0 secrets detected.");
  process.exit(0);
}

run();
