import { z } from "zod";

const kebab = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const qualified = /^(core|project|workspace)\.[A-Za-z][A-Za-z0-9]*$/;

export const viewportNameSchema = z.enum(["mobileSmall", "mobile", "tablet", "desktop", "desktopWide"]);
export const routeTypeNameSchema = z.enum([
  "home",
  "hub",
  "detail",
  "pricing",
  "comparison",
  "directory",
  "docs",
  "editorial",
  "article",
  "legal",
  "contact",
  "support",
  "appDashboard",
  "settings",
  "checkout",
  "onboarding",
  "utility"
]);

export const configSchema = z.object({
  schemaVersion: z.literal("2.0"),
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    owner: z.string().optional()
  }),
  source: z.object({
    routes: z.string().default("routes.json"),
    contentDir: z.string().default("content"),
    recipesDir: z.string().default("recipes"),
    primitivesDir: z.string().default("primitives"),
    layoutsDir: z.string().default("layouts"),
    overrides: z.string().optional()
  }),
  output: z.object({
    dir: z.string().default("prototype"),
    clean: z.boolean().default(true),
    assetsDir: z.string().default("assets")
  }),
  theme: z.object({
    profile: z.string().default("productMarketing"),
    tokens: z.string().optional(),
    defaultMode: z.enum(["light", "dark", "system"]).default("light"),
    allowThemeToggle: z.boolean().default(true)
  }),
  routeBudget: z.object({
    defaultMaxRoutes: z.number().int().positive().default(7),
    largePrototypeRequiresApproval: z.boolean().default(true),
    representativeRoutesRequired: z.boolean().default(true)
  }),
  eval: z.object({
    required: z.boolean().default(true),
    strict: z.boolean().default(true),
    viewports: z.array(viewportNameSchema).min(1).default(["mobile", "desktop"]),
    aiReview: z.enum(["off", "manual", "auto"]).default("manual"),
    sampleStrategy: z.enum(["all", "changed", "route-type-plus-changed"]).default("route-type-plus-changed")
  })
});

export const routeSchema = z.object({
  id: z.string().regex(kebab),
  path: z.string().refine((value) => value === "/" || (value.startsWith("/") && value.endsWith("/")), {
    message: "path must be / or start and end with /"
  }),
  title: z.string().min(1),
  file: z.string().endsWith(".html"),
  routeType: routeTypeNameSchema,
  profile: z.string().min(1),
  recipe: z.string().optional(),
  content: z.string().optional(),
  priority: z.number().int().nonnegative().default(1),
  status: z.enum(["draft", "ready", "hidden", "deprecated"]).default("draft"),
  tags: z.array(z.string()).optional()
});

export const routesFileSchema = z.object({
  routes: z.array(routeSchema).superRefine((routes, ctx) => {
    const ids = new Set<string>();
    const paths = new Set<string>();
    for (const [index, route] of routes.entries()) {
      if (ids.has(route.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate route id ${route.id}`, path: [index, "id"] });
      }
      if (paths.has(route.path)) {
        ctx.addIssue({ code: "custom", message: `duplicate route path ${route.path}`, path: [index, "path"] });
      }
      ids.add(route.id);
      paths.add(route.path);
      if (route.status !== "hidden" && !route.recipe) {
        ctx.addIssue({ code: "custom", message: "recipe is required unless route is hidden/imported", path: [index, "recipe"] });
      }
    }
  })
});

export const sectionSchema = z.object({
  id: z.string().regex(kebab),
  primitive: z.string().regex(qualified),
  layout: z.string().regex(qualified),
  variant: z.string().optional(),
  content: z.union([z.string(), z.record(z.string(), z.unknown())]),
  visibility: z.enum(["visible", "hidden"]).optional(),
  states: z.array(z.string()).optional(),
  interactions: z.array(z.string()).optional(),
  evalHints: z.record(z.string(), z.unknown()).optional()
});

export const recipeSchema = z.object({
  schemaVersion: z.literal("2.0"),
  routeId: z.string().regex(kebab),
  routeType: routeTypeNameSchema,
  profile: z.string().min(1),
  sections: z.array(sectionSchema).min(1).superRefine((sections, ctx) => {
    const ids = new Set<string>();
    for (const [index, section] of sections.entries()) {
      if (ids.has(section.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate section id ${section.id}`, path: [index, "id"] });
      }
      ids.add(section.id);
    }
  }),
  states: z.array(z.string()).optional(),
  interactions: z.array(z.string()).optional()
});

export const slotDefinitionSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    type: z.enum([
      "string",
      "text",
      "richText",
      "number",
      "boolean",
      "enum",
      "action",
      "link",
      "image",
      "icon",
      "code",
      "metric",
      "table",
      "array",
      "object",
      "reference"
    ]),
    required: z.boolean().optional(),
    values: z.array(z.string()).optional(),
    variants: z.array(z.string()).optional(),
    items: slotDefinitionSchema.optional(),
    default: z.unknown().optional()
  })
);

export const primitiveManifestSchema = z.object({
  schemaVersion: z.literal("2.0"),
  name: z.string().min(1),
  namespace: z.enum(["core", "project", "workspace"]),
  type: z.literal("primitive"),
  description: z.string().min(1),
  slots: z.record(z.string(), slotDefinitionSchema),
  variants: z.array(z.string()),
  layouts: z.array(z.string().regex(qualified)),
  interactions: z.array(z.string()),
  states: z.array(z.string()),
  accessibility: z
    .object({
      requiresHeading: z.boolean().optional(),
      requiresPrimaryAction: z.boolean().optional()
    })
    .optional(),
  responsive: z.record(z.string(), z.string()).optional()
});

export const layoutManifestSchema = z.object({
  schemaVersion: z.literal("2.0"),
  name: z.string().min(1),
  namespace: z.enum(["core", "project", "workspace"]),
  description: z.string().min(1),
  parameters: z.record(z.string(), slotDefinitionSchema).optional(),
  responsive: z.record(z.string(), z.string()).optional(),
  overflow: z.enum(["forbidden", "allowed", "conditional"])
});

export const exceptionsSchema = z
  .object({
    exceptions: z.array(
      z.object({
        rule: z.string().min(1),
        file: z.string().min(1),
        reason: z.string().min(1),
        expires: z.string().optional(),
        approvedBy: z.string().optional()
      })
    )
  })
  .default({ exceptions: [] });
