import { z } from "zod";

const kebab = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const blockName = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const safeRelativeFile = z.string().min(1).refine((value) => !value.startsWith("/") && !value.includes(".."), {
  message: "file path must stay inside the theme directory"
});

export const viewportNameSchema = z.enum(["mobileSmall", "mobile", "tablet", "desktop", "desktopWide"]);

export const configSchema = z.object({
  schemaVersion: z.literal("3.0"),
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    owner: z.string().optional()
  }),
  source: z.object({
    mode: z.literal("pages").default("pages"),
    pagesDir: z.string().min(1).default("pages"),
    theme: z.string().regex(kebab).default("default"),
    themesDir: z.string().min(1).default("themes")
  }),
  output: z.object({
    dir: z.string().default("prototype"),
    clean: z.boolean().default(true),
    assetsDir: z.string().default("assets")
  }),
  theme: z.object({
    defaultMode: z.enum(["light", "dark", "system"]).default("light"),
    allowThemeToggle: z.boolean().default(true)
  }),
  eval: z.object({
    required: z.boolean().default(true),
    strict: z.boolean().default(true),
    viewports: z.array(viewportNameSchema).min(1).default(["mobile", "desktop"]),
    aiReview: z.enum(["off", "manual", "auto"]).default("off")
  })
});

export const primaryActionSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1)
});

export const pageSectionSchema = z.object({
  id: z.string().regex(kebab),
  block: z.string().regex(blockName),
  props: z.record(z.string(), z.unknown()),
  slot: z.string().regex(kebab).optional(),
  visibility: z.enum(["visible", "hidden"]).default("visible"),
  states: z.array(z.string()).optional(),
  interactions: z.array(z.string()).optional(),
  evalHints: z.record(z.string(), z.unknown()).optional()
});

export const pageSchema = z.object({
  schemaVersion: z.literal("3.0"),
  id: z.string().regex(kebab),
  path: z.string().refine((value) => value === "/" || (value.startsWith("/") && value.endsWith("/")), {
    message: "path must be / or start and end with /"
  }),
  title: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  audience: z.string().optional(),
  userGoal: z.string().optional(),
  primaryAction: primaryActionSchema.optional(),
  status: z.enum(["draft", "ready", "hidden", "deprecated"]).default("ready"),
  priority: z.number().int().nonnegative().default(1),
  tags: z.array(z.string()).optional(),
  navLabel: z.string().optional(),
  theme: z.string().regex(kebab).optional(),
  layout: z.string().regex(kebab).optional(),
  sections: z.array(pageSectionSchema).min(1).superRefine((sections, ctx) => {
    const ids = new Set<string>();
    let visibleCount = 0;
    for (const [index, section] of sections.entries()) {
      if (ids.has(section.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate section id ${section.id}`, path: [index, "id"] });
      }
      ids.add(section.id);
      if (section.visibility !== "hidden") visibleCount += 1;
    }
    if (visibleCount === 0) {
      ctx.addIssue({ code: "custom", message: "sections must contain at least one visible section", path: ["sections"] });
    }
  })
});

export const blockMetadataSchema = z.object({
  file: safeRelativeFile,
  description: z.string().optional(),
  requires: z.array(z.string().min(1)).optional(),
  optional: z.array(z.string().min(1)).optional(),
  markers: z.array(z.string().min(1)).optional(),
  states: z.array(z.string().min(1)).optional(),
  interactions: z.array(z.enum(["theme", "tabs", "filter", "modal"])).optional(),
  allowedRawHtml: z.array(z.string().min(1)).optional(),
  overflow: z.enum(["forbidden", "allowed", "conditional"]).optional(),
  accessibility: z
    .object({
      requiresHeading: z.boolean().optional(),
      requiresLabels: z.boolean().optional()
    })
    .optional()
});

export const themeSchema = z.object({
  schemaVersion: z.literal("3.0"),
  name: z.string().min(1),
  description: z.string().optional(),
  shell: safeRelativeFile.optional(),
  styles: safeRelativeFile.optional(),
  scripts: z.array(safeRelativeFile).optional(),
  tokens: z.record(z.string(), z.unknown()).optional(),
  supportsDarkMode: z.boolean().optional(),
  requiredRuntime: z.array(z.enum(["theme", "tabs", "filter", "modal"])).optional(),
  blocks: z.record(z.string().regex(blockName), blockMetadataSchema).superRefine((blocks, ctx) => {
    for (const name of Object.keys(blocks)) {
      if (!blockName.test(name)) {
        ctx.addIssue({ code: "custom", message: `invalid block name ${name}`, path: [name] });
      }
    }
  })
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
