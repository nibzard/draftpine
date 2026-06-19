import path from "node:path";
import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { evalProject } from "../../src/eval/browserEval.js";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

const badFixtures: Array<{ dir: string; finding: string }> = [
  { dir: "fixtures/bad/lite-unknown-block", finding: "theme.unknownBlock" },
  { dir: "fixtures/bad/lite-duplicate-route", finding: "source.duplicatePagePath" },
  { dir: "fixtures/bad/lite-unsafe-theme", finding: "theme.scriptTag" },
  { dir: "fixtures/bad/lite-noop-interaction", finding: "runtime.themeToggleNoop" }
];

const goodFixtures = ["fixtures/good/lite-basic", "fixtures/good/lite-browsable", "fixtures/good/lite-custom-block"];
const defaultBlocks = [
  "hero",
  "banner",
  "logo-cloud",
  "metrics",
  "section-header",
  "feature-icons",
  "feature-tabs",
  "feature-showcase",
  "social-proof",
  "testimonial",
  "testimonial-grid",
  "case-study",
  "case-study-grid",
  "press-logos",
  "integrations-grid",
  "resource-list",
  "steps",
  "cta-split",
  "faq",
  "newsletter",
  "callout",
  "pricing",
  "comparison",
  "values",
  "team",
  "careers",
  "job-list",
  "rich-text",
  "article",
  "blog-list",
  "author-bio",
  "changelog",
  "contact",
  "locations",
  "not-found"
];

describe("v3 regression corpus — bad fixtures fail for the expected reason", () => {
  for (const { dir, finding } of badFixtures) {
    it(`${dir} -> ${finding}`, async () => {
      process.chdir(path.join(repoRoot, dir));
      const report = await evalProject({ strict: true });
      expect(report.deterministicStatus).toBe("fail");
      expect(report.findings.some((item) => item.id === finding)).toBe(true);
    });
  }
});

describe("v3 regression corpus — good fixtures pass strict eval", () => {
  for (const dir of goodFixtures) {
    it(`${dir} passes with zero errors`, async () => {
      process.chdir(path.join(repoRoot, dir));
      const report = await evalProject({ strict: true });
      expect(report.summary.errors).toBe(0);
      expect(report.deterministicStatus).toBe("pass");
    });
  }

  it("lite-browsable renders every default block in the regression corpus", async () => {
    const fixtureRoot = path.join(repoRoot, "fixtures/good/lite-browsable");
    process.chdir(fixtureRoot);
    const report = await evalProject({ strict: true });
    const manifest = JSON.parse(await readFile(path.join(fixtureRoot, "prototype/draftpine.manifest.json"), "utf8")) as { blocksUsed: string[] };
    expect(report.deterministicStatus).toBe("pass");
    expect(new Set(manifest.blocksUsed)).toEqual(new Set(defaultBlocks));
  });
});
