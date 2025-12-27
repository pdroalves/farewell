#!/usr/bin/env node
/**
 * Get the current git commit ID and write it to a file
 * Works in both local development and CI environments (GitHub Actions)
 */
import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

function getCommitId() {
  // In GitHub Actions, use GITHUB_SHA environment variable
  if (process.env.GITHUB_SHA) {
    // Get short version (first 7 characters)
    return process.env.GITHUB_SHA.substring(0, 7);
  }

  // Try to get from git command (local development)
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch (error) {
    console.warn("Could not get commit ID from git:", error.message);
    return "unknown";
  }
}

try {
  const commitId = getCommitId();
  const libDir = join(process.cwd(), "lib");
  const outputPath = join(libDir, "commit-id.ts");
  
  // Ensure lib directory exists
  mkdirSync(libDir, { recursive: true });
  
  const content = `// Auto-generated at build time
export const COMMIT_ID = "${commitId}";
`;

  writeFileSync(outputPath, content, "utf-8");
  console.log(`Generated commit ID file: ${commitId}`);
} catch (error) {
  console.error("Failed to generate commit ID file:", error.message);
  // Write a fallback
  const libDir = join(process.cwd(), "lib");
  mkdirSync(libDir, { recursive: true });
  const outputPath = join(libDir, "commit-id.ts");
  writeFileSync(outputPath, 'export const COMMIT_ID = "unknown";', "utf-8");
}

