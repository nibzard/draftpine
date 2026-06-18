import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generate } from "../../src/compiler/compiler.js";
import { loadProject } from "../../src/io/workspace.js";
import { initProject } from "../../src/cli/scaffold.js";

const originalCwd = process.cwd();
const tempDirs: string[] = [];

afterEach(async () => {
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) await rm(dir, { recursive: true, force: true });
});

describe("v3 compiler", () => {
  it("discovers pages and produces byte-stable HTML and CSS", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-determinism-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    process.chdir(dir);

    await generate();
    const html1 = await readFile(path.join(dir, "prototype/index.html"), "utf8");
    const css1 = await readFile(path.join(dir, "prototype/assets/draftpine.css"), "utf8");

    await generate();
    const html2 = await readFile(path.join(dir, "prototype/index.html"), "utf8");
    const css2 = await readFile(path.join(dir, "prototype/assets/draftpine.css"), "utf8");

    expect(html1).toBe(html2);
    expect(css1).toBe(css2);
  });

  it("reports duplicate page paths before rendering", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-duplicate-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    await writeFile(
      path.join(dir, "pages/other.json"),
      `${JSON.stringify({ schemaVersion: "3.0", id: "other", path: "/", title: "Other", type: "home", sections: [{ id: "hero", block: "hero", props: { headline: "Other" } }] }, null, 2)}\n`
    );
    process.chdir(dir);
    const project = await loadProject();
    expect(project.findings.some((item) => item.id === "source.duplicatePagePath")).toBe(true);
  });
});
