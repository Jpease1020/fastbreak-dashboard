import { promises as fs } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appRoot = path.resolve(process.cwd(), "src");

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(resolved);
      }
      return [resolved];
    })
  );

  return files.flat();
}

describe("server-side data access boundaries", () => {
  it("keeps Supabase imports out of client components", async () => {
    const sourceFiles = await collectFiles(appRoot);
    const clientFiles = sourceFiles.filter((file) =>
      file.endsWith(".ts") || file.endsWith(".tsx")
    );

    const violations: string[] = [];

    for (const file of clientFiles) {
      const source = await fs.readFile(file, "utf8");
      if (!source.startsWith('"use client"') && !source.startsWith("'use client'")) {
        continue;
      }

      if (
        source.includes("@supabase/") ||
        source.includes("@/lib/supabase/server")
      ) {
        violations.push(path.relative(process.cwd(), file));
      }
    }

    expect(violations).toEqual([]);
  });
});
