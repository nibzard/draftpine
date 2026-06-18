import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { evalProject } from "../../src/eval/browserEval.js";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

// Each bad fixture must fail strict eval for exactly the expected hard gate.
// good/basic and fixtures/bad/mobile-overflow are covered by cli.test.ts.
const badFixtures: Array<{ dir: string; finding: string }> = [
  { dir: "fixtures/bad/route-explosion", finding: "route.budgetExceeded" },
  { dir: "fixtures/bad/generic-card-dump", finding: "route.missingRequiredPrimitive" },
  { dir: "fixtures/bad/unlabeled-controls", finding: "accessibility.unlabeledControl" },
  { dir: "fixtures/bad/alpine-runtime-error", finding: "runtime.consoleError" }
];

const goodFixtures = ["fixtures/good/pricing-basic", "fixtures/good/docs-quickstart"];

describe("regression corpus — bad fixtures fail for the expected reason", () => {
  for (const { dir, finding } of badFixtures) {
    it(`${dir} -> ${finding}`, async () => {
      process.chdir(path.join(repoRoot, dir));
      const report = await evalProject({ strict: true });
      expect(report.deterministicStatus).toBe("fail");
      expect(report.findings.some((item) => item.id === finding)).toBe(true);
    });
  }
});

describe("regression corpus — good fixtures pass strict eval", () => {
  for (const dir of goodFixtures) {
    it(`${dir} passes with zero errors`, async () => {
      process.chdir(path.join(repoRoot, dir));
      const report = await evalProject({ strict: true });
      expect(report.summary.errors).toBe(0);
      expect(report.deterministicStatus).toBe("pass");
    });
  }
});
