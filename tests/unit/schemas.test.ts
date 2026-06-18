import { describe, expect, it } from "vitest";
import {
  configSchema,
  recipeSchema,
  routeSchema,
  routesFileSchema,
  primitiveManifestSchema,
  layoutManifestSchema
} from "../../src/schemas/sourceSchemas.js";

const validConfig = {
  schemaVersion: "2.0",
  project: { name: "Test" },
  source: { routes: "routes.json", contentDir: "content", recipesDir: "recipes", primitivesDir: "primitives", layoutsDir: "layouts" },
  output: { dir: "prototype", clean: true, assetsDir: "assets" },
  theme: { profile: "productMarketing", defaultMode: "light", allowThemeToggle: true },
  routeBudget: { defaultMaxRoutes: 7, largePrototypeRequiresApproval: true, representativeRoutesRequired: true },
  eval: { required: true, strict: true, viewports: ["mobile"], aiReview: "off", sampleStrategy: "all" }
};

const baseRoute = {
  id: "home",
  path: "/",
  title: "Home",
  file: "index.html",
  routeType: "home",
  profile: "productMarketing",
  recipe: "recipes/home.json"
} as const;

describe("config schema", () => {
  it("accepts a complete valid config", () => {
    expect(() => configSchema.parse(validConfig)).not.toThrow();
  });

  it("rejects an unsupported viewport name", () => {
    const result = configSchema.safeParse({ ...validConfig, eval: { ...validConfig.eval, viewports: ["watch"] } });
    expect(result.success).toBe(false);
  });
});

describe("route schema", () => {
  it("accepts root and slash-delimited paths", () => {
    expect(() => routeSchema.parse(baseRoute)).not.toThrow();
    expect(() => routeSchema.parse({ ...baseRoute, path: "/pricing/" })).not.toThrow();
  });

  it("rejects paths that do not start and end with a slash", () => {
    const result = routeSchema.safeParse({ ...baseRoute, path: "/no-trailing-slash" });
    expect(result.success).toBe(false);
  });

  it("rejects non-kebab route ids", () => {
    const result = routeSchema.safeParse({ ...baseRoute, id: "Bad_Id" });
    expect(result.success).toBe(false);
  });
});

describe("routes file schema", () => {
  it("rejects duplicate route ids", () => {
    const result = routesFileSchema.safeParse({ routes: [baseRoute, { ...baseRoute, path: "/other/" }] });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate route paths", () => {
    const result = routesFileSchema.safeParse({ routes: [baseRoute, { ...baseRoute, id: "other" }] });
    expect(result.success).toBe(false);
  });

  it("requires a recipe unless the route is hidden", () => {
    const visible = routesFileSchema.safeParse({ routes: [{ ...baseRoute, recipe: undefined }] });
    expect(visible.success).toBe(false);
    const hidden = routesFileSchema.safeParse({ routes: [{ ...baseRoute, status: "hidden", recipe: undefined }] });
    expect(hidden.success).toBe(true);
  });
});

describe("recipe schema", () => {
  const baseRecipe = {
    schemaVersion: "2.0",
    routeId: "home",
    routeType: "home",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.heroProof", layout: "core.stack", content: "hero" },
      { id: "cta", primitive: "core.finalCta", layout: "core.stack", content: "cta" }
    ]
  } as const;

  it("accepts a valid recipe", () => {
    expect(() => recipeSchema.parse(baseRecipe)).not.toThrow();
  });

  it("rejects duplicate section ids", () => {
    const result = recipeSchema.safeParse({ ...baseRecipe, sections: [{ ...baseRecipe.sections[0] }, { ...baseRecipe.sections[0] }] });
    expect(result.success).toBe(false);
  });

  it("rejects an unqualified primitive reference", () => {
    const result = recipeSchema.safeParse({ ...baseRecipe, sections: [{ id: "hero", primitive: "heroProof", layout: "core.stack", content: "hero" }] });
    expect(result.success).toBe(false);
  });
});

describe("manifest schemas", () => {
  it("accepts a valid primitive manifest", () => {
    expect(() =>
      primitiveManifestSchema.parse({
        schemaVersion: "2.0",
        name: "demo",
        namespace: "project",
        type: "primitive",
        description: "A demo primitive.",
        slots: { title: { type: "string", required: true } },
        variants: ["default"],
        layouts: ["core.stack"],
        interactions: [],
        states: ["default"]
      })
    ).not.toThrow();
  });

  it("rejects an unknown slot type", () => {
    const result = primitiveManifestSchema.safeParse({
      schemaVersion: "2.0",
      name: "demo",
      namespace: "project",
      type: "primitive",
      description: "A demo primitive.",
      slots: { title: { type: "bogus" } },
      variants: ["default"],
      layouts: ["core.stack"],
      interactions: [],
      states: ["default"]
    });
    expect(result.success).toBe(false);
  });

  it("accepts a page-scoped layout manifest", () => {
    expect(() =>
      layoutManifestSchema.parse({
        schemaVersion: "2.0",
        name: "appShell",
        namespace: "core",
        description: "Page shell.",
        overflow: "forbidden",
        scope: "page"
      })
    ).not.toThrow();
  });
});
