import { describe, expect, it } from "vitest";
import { configSchema, pageSchema, themeSchema } from "../../src/schemas/sourceSchemas.js";

const validConfig = {
  schemaVersion: "3.0",
  project: { name: "Test" },
  source: { mode: "pages", pagesDir: "pages", theme: "default", themesDir: "themes" },
  output: { dir: "prototype", clean: true, assetsDir: "assets" },
  theme: { defaultMode: "light", allowThemeToggle: true },
  eval: { required: true, strict: true, viewports: ["mobile"], aiReview: "off" }
};

const validPage = {
  schemaVersion: "3.0",
  id: "home",
  path: "/",
  title: "Home",
  type: "home",
  sections: [{ id: "hero", block: "hero", props: { headline: "Hello" } }]
};

describe("v3 config schema", () => {
  it("accepts a pages-mode config", () => {
    expect(() => configSchema.parse(validConfig)).not.toThrow();
  });

  it("rejects v2 configs", () => {
    expect(configSchema.safeParse({ ...validConfig, schemaVersion: "2.0" }).success).toBe(false);
  });
});

describe("v3 page schema", () => {
  it("accepts a minimal page with one visible section", () => {
    expect(() => pageSchema.parse(validPage)).not.toThrow();
  });

  it("rejects invalid route paths and duplicate section ids", () => {
    expect(pageSchema.safeParse({ ...validPage, path: "/pricing" }).success).toBe(false);
    expect(
      pageSchema.safeParse({
        ...validPage,
        sections: [
          { id: "hero", block: "hero", props: {} },
          { id: "hero", block: "metrics", props: {} }
        ]
      }).success
    ).toBe(false);
  });
});

describe("v3 theme schema", () => {
  it("accepts a theme with editable blocks", () => {
    expect(() =>
      themeSchema.parse({
        schemaVersion: "3.0",
        name: "Default",
        shell: "shell.html",
        styles: "styles.css",
        blocks: {
          hero: { file: "blocks/hero.html", requires: ["headline"], markers: ["primaryAction"] }
        }
      })
    ).not.toThrow();
  });

  it("rejects escaping block paths", () => {
    expect(
      themeSchema.safeParse({
        schemaVersion: "3.0",
        name: "Default",
        blocks: { hero: { file: "../hero.html" } }
      }).success
    ).toBe(false);
  });
});
