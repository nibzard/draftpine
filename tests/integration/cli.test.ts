import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generate } from "../../src/compiler/compiler.js";
import { check } from "../../src/eval/check.js";
import { evalProject } from "../../src/eval/browserEval.js";
import { initProject, scaffoldPrimitive } from "../../src/cli/scaffold.js";
import { testPrimitive } from "../../src/cli/testExtension.js";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const originalCwd = process.cwd();
const tempDirs: string[] = [];

afterEach(async () => {
  process.chdir(originalCwd);
  for (const dir of tempDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true });
  }
});

describe("Draftpine v2 CLI internals", () => {
  it("generates and checks the good fixture", async () => {
    process.chdir(path.join(repoRoot, "fixtures/good/basic"));
    const generated = await generate();
    expect(generated.findings).toEqual([]);
    expect(generated.artifact.routesRendered).toHaveLength(1);
    const checked = await check();
    expect(checked.findings).toEqual([]);
  });

  it("detects mobile overflow in the bad fixture", async () => {
    process.chdir(path.join(repoRoot, "fixtures/bad/mobile-overflow"));
    const report = await evalProject({ strict: true });
    expect(report.status).toBe("fail");
    expect(report.findings.some((item) => item.id === "mobile.horizontalOverflow")).toBe(true);
  });

  it("initializes a project and scaffolds a valid primitive", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    process.chdir(dir);
    const generated = await generate();
    expect(generated.findings).toEqual([]);
    await scaffoldPrimitive("audit-panel");
    const findings = await testPrimitive("audit-panel");
    expect(findings).toEqual([]);
  });

  it("initializes a browsable project with representative routes", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-browsable-"));
    tempDirs.push(dir);
    await initProject(dir, "browsable", true);
    process.chdir(dir);
    const generated = await generate();
    expect(generated.findings).toEqual([]);
    expect(generated.artifact.routesRendered.map((route) => route.path)).toEqual(["/", "/pricing/", "/compare/", "/contact/"]);
    const report = await evalProject({ strict: true });
    expect(report.summary.errors).toBe(0);
    expect(report.summary.routesEvaluated).toBe(4);
    expect(report.deterministicStatus).toBe("pass");
    expect(report.status).toBe("pass-with-review");
    expect(report.manualReviewRequired).toBe(true);
  });

  it("supports safe project override CSS without extension fixtures", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-overrides-"));
    tempDirs.push(dir);
    await initProject(dir, "single-screen", true);
    process.chdir(dir);
    const configPath = path.join(dir, "draftpine.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.source.overrides = "overrides.css";
    config.eval.aiReview = "off";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
    await writeFile(path.join(dir, "overrides.css"), `.dp-site-header { border-block-end: 1px solid var(--dp-line); }\n.dp-panel { max-width: 700px; }\n`);

    const checked = await check("draftpine.config.json", "source");
    expect(checked.findings).toEqual([]);
    const generated = await generate();
    expect(generated.findings).toEqual([]);
    const css = await readFile(path.join(dir, "prototype/assets/draftpine.css"), "utf8");
    expect(css).toContain(".dp-site-header");
    expect(css).toContain("max-width: 700px");
  });

  it("evaluates an eight-route prototype without mobile nav overflow and cleans stale screenshots", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "draftpine-large-nav-"));
    tempDirs.push(dir);
    await initProject(dir, "browsable", true);
    process.chdir(dir);

    const configPath = path.join(dir, "draftpine.config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.routeBudget.defaultMaxRoutes = 10;
    config.eval.aiReview = "off";
    config.eval.viewports = ["mobile"];
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const routesPath = path.join(dir, "routes.json");
    const routesFile = JSON.parse(await readFile(routesPath, "utf8"));
    for (const id of ["docs", "status", "legal", "team"]) {
      routesFile.routes.push({
        id,
        path: `/${id}/`,
        title: id[0].toUpperCase() + id.slice(1),
        file: `${id}/index.html`,
        routeType: "utility",
        profile: "productMarketing",
        recipe: `recipes/${id}.json`,
        content: `content/pages/${id}.json`,
        priority: routesFile.routes.length + 1,
        status: "ready"
      });
      await writeFile(
        path.join(dir, `recipes/${id}.json`),
        `${JSON.stringify(
          {
            schemaVersion: "2.0",
            routeId: id,
            routeType: "utility",
            profile: "productMarketing",
            sections: [
              { id: "hero", primitive: "core.decisionHero", layout: "core.stack", variant: "compact", content: "hero" },
              { id: "cta", primitive: "core.finalCta", layout: "core.stack", variant: "default", content: "cta" }
            ],
            states: ["default"],
            interactions: ["theme"]
          },
          null,
          2
        )}\n`
      );
      await writeFile(
        path.join(dir, `content/pages/${id}.json`),
        `${JSON.stringify(
          {
            description: `${id} utility route.`,
            hero: {
              eyebrow: "Utility",
              title: `${id} route`,
              description: "Short route used to exercise larger generated navigation.",
              signal: "Mobile nav should not overflow.",
              primaryAction: { label: "Continue", href: "#" }
            },
            cta: {
              title: "Continue",
              description: "A compact CTA for route coverage.",
              primaryAction: { label: "Continue", href: "#" }
            }
          },
          null,
          2
        )}\n`
      );
    }
    await writeFile(routesPath, `${JSON.stringify(routesFile, null, 2)}\n`);

    await generate();
    await mkdir(path.join(dir, "reports/screenshots"), { recursive: true });
    await writeFile(path.join(dir, "reports/screenshots/stale.png"), "stale");
    const report = await evalProject({ strict: true });
    expect(report.status).toBe("pass");
    expect(report.summary.errors).toBe(0);
    expect(report.summary.routesEvaluated).toBe(8);
    expect(report.findings.some((finding) => finding.id === "mobile.horizontalOverflow")).toBe(false);
    await expect(readFile(path.join(dir, "reports/screenshots/stale.png"))).rejects.toThrow();
  });
});
