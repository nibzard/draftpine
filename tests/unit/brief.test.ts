import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { renderAgentPrompt } from "../../src/cli/brief.js";

describe("draftpine agent prompt", () => {
  it("README paste block matches renderAgentPrompt exactly (no drift)", async () => {
    const readme = await readFile("README.md", "utf8");
    const match = readme.match(/<!-- AGENT_PROMPT_START -->\n```text\n([\s\S]*?)\n```\n<!-- AGENT_PROMPT_END -->/);
    if (!match) throw new Error("README.md is missing the AGENT_PROMPT sentinel block");
    expect(match[1]).toBe(renderAgentPrompt({ bare: false, starter: "browsable", pin: false }).trimEnd());
  });

  it("references the pinned tag, repo, and version in the bootstrap", () => {
    const prompt = renderAgentPrompt();
    expect(prompt).toContain("git clone --depth 1 --branch v3.0.0 https://github.com/nibzard/draftpine.git .draftpine");
    expect(prompt).toContain("draftpine@3.0.0");
    expect(prompt).toContain("DRAFTPINE_SKIP_BROWSER_INSTALL");
    expect(prompt).toContain('new block <name> "$PWD/prototype"');
  });

  it("--bare swaps the sample brief for placeholders", () => {
    const sample = renderAgentPrompt();
    const bare = renderAgentPrompt({ bare: true });
    expect(sample).toContain('"Acme Analytics"');
    expect(bare).toContain("<one line: what this website is for>");
    expect(bare).not.toContain('"Acme Analytics"');
  });

  it("--pin omits the npx fast-path and keeps the pinned clone", () => {
    const prompt = renderAgentPrompt({ pin: true });
    expect(prompt).not.toContain("FAST PATH");
    expect(prompt).toContain("PINNED CLONE");
    expect(prompt).toContain("git clone --depth 1 --branch v3.0.0");
  });

  it("--starter single-screen narrows the routes hint", () => {
    const prompt = renderAgentPrompt({ starter: "single-screen" });
    expect(prompt).toContain("Routes: Home only");
    expect(prompt).toContain("--starter single-screen");
  });
});
