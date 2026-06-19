import { describe, expect, it } from "vitest";
import pkg from "../../package.json" with { type: "json" };
import { DRAFTPINE_VERSION } from "../../src/cli/brief.js";

describe("version single-sourcing", () => {
  it("the agent prompt version equals package.json version", () => {
    expect(DRAFTPINE_VERSION).toBe(pkg.version);
  });

  it("package.json declares a stable 3.x version the prompt pins to", () => {
    expect(pkg.version).toMatch(/^3\.\d+\.\d+/);
    expect(DRAFTPINE_VERSION).toBe(pkg.version);
  });
});
