import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  it("reports malformed page JSON as a source finding", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-malformed-page-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    await writeFile(path.join(dir, "pages/broken.json"), "{not json\n");

    process.chdir(dir);
    const project = await loadProject();

    expect(project.findings.some((item) => item.id === "source.invalidPage" && item.file === "pages/broken.json")).toBe(true);
  });

  it("refuses to clean the workspace root as generated output", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-unsafe-output-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    await writeFile(path.join(dir, "keep.txt"), "do not delete\n");
    const configPath = path.join(dir, "draftpine.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.output.dir = ".";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    process.chdir(dir);
    const generated = await generate();

    expect(generated.findings.some((item) => item.id === "config.unsafeOutputDir")).toBe(true);
    expect(await readFile(path.join(dir, "keep.txt"), "utf8")).toBe("do not delete\n");
  });

  it("keeps generated and ignored build files out of source hashes", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-source-hashes-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    await mkdir(path.join(dir, "dist"), { recursive: true });
    await writeFile(path.join(dir, "dist/generated.js"), "compiled\n");
    const configPath = path.join(dir, "draftpine.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.output.dir = "site";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    process.chdir(dir);
    await generate();
    const manifest = JSON.parse(await readFile(path.join(dir, "site/draftpine.manifest.json"), "utf8")) as { sourceHashes: Record<string, string> };

    expect(manifest.sourceHashes["dist/generated.js"]).toBeUndefined();
    expect(Object.keys(manifest.sourceHashes).some((file) => file.startsWith("site/"))).toBe(false);
  });

  it("emits the configured default theme mode", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-theme-mode-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    const configPath = path.join(dir, "draftpine.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.theme.defaultMode = "dark";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    process.chdir(dir);
    await generate();
    const html = await readFile(path.join(dir, "prototype/index.html"), "utf8");

    expect(html).toContain("var d='dark'");
    expect(html).toContain("defaultMode:'dark'");
  });
});
