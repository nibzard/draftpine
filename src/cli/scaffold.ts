import path from "node:path";
import { mkdir, cp } from "node:fs/promises";
import { pathExists, writeJson, writeText } from "../io/fs.js";

export async function initProject(targetPath: string, starter: "single-screen" | "browsable" | "docs", force = false): Promise<void> {
  const root = path.resolve(process.cwd(), targetPath);
  if ((await pathExists(root)) && !force && (await pathExists(path.join(root, "draftpine.config.json")))) {
    throw new Error(`Refusing to overwrite existing Draftpine project at ${root}. Pass --force to overwrite.`);
  }
  await mkdir(root, { recursive: true });
  const starterDir = path.resolve(import.meta.dirname, "../../starters", starter);
  if ((await pathExists(starterDir)) && (await pathExists(path.join(starterDir, "draftpine.config.json")))) {
    await cp(starterDir, root, { recursive: true, force });
  } else {
    await writeStarter(root, starter);
  }
}

export async function scaffoldPrimitive(name: string, namespace = "project", variant = "default"): Promise<void> {
  const dir = path.resolve(process.cwd(), "primitives", name);
  await mkdir(dir, { recursive: true });
  const manifestName = camel(name);
  await writeJson(path.join(dir, "primitive.json"), {
    schemaVersion: "2.0",
    name: manifestName,
    namespace,
    type: "primitive",
    description: `${manifestName} primitive.`,
    slots: {
      title: { type: "string", required: true },
      description: { type: "text", required: false }
    },
    variants: [variant],
    layouts: ["core.stack"],
    interactions: [],
    states: ["default"],
    accessibility: { requiresHeading: true }
  });
  await writeText(path.join(dir, "template.html"), `<section class="dp-section dp-${name}" data-primitive="${namespace}.${manifestName}">\n  <div class="dp-container dp-stack">\n    <h2>{{title}}</h2>\n    {{#if description}}<p>{{description}}</p>{{/if}}\n  </div>\n</section>\n`);
  await writeText(path.join(dir, "styles.css"), `[data-primitive="${namespace}.${manifestName}"] {\n  border-block-start: 1px solid var(--dp-line);\n}\n`);
  await writeJson(path.join(dir, "demo.json"), { title: "Demo title", description: "Demo description." });
  await writeJson(path.join(dir, "eval.json"), { viewports: ["mobile", "desktop"], expected: "pass" });
  await writeText(path.join(dir, "README.md"), `# ${manifestName}\n\nProject primitive scaffold.\n`);
}

export async function scaffoldLayout(name: string, namespace = "project"): Promise<void> {
  const dir = path.resolve(process.cwd(), "layouts", name);
  await mkdir(dir, { recursive: true });
  const manifestName = camel(name);
  await writeJson(path.join(dir, "layout.json"), {
    schemaVersion: "2.0",
    name: manifestName,
    namespace,
    description: `${manifestName} layout.`,
    parameters: {},
    responsive: { mobile: "stack" },
    overflow: "forbidden"
  });
  await writeText(path.join(dir, "template.html"), `<div class="dp-${name}">{{{children}}}</div>\n`);
  await writeText(path.join(dir, "styles.css"), `.dp-${name} {\n  display: grid;\n  gap: var(--dp-space-5);\n}\n`);
  await writeJson(path.join(dir, "demo.json"), { children: [] });
  await writeJson(path.join(dir, "eval.json"), { viewports: ["mobile", "desktop"], expected: "pass" });
  await writeText(path.join(dir, "README.md"), `# ${manifestName}\n\nProject layout scaffold.\n`);
}

async function writeStarter(root: string, starter: string): Promise<void> {
  await mkdir(path.join(root, "content/pages"), { recursive: true });
  await mkdir(path.join(root, "recipes"), { recursive: true });
  await mkdir(path.join(root, "primitives"), { recursive: true });
  await mkdir(path.join(root, "layouts"), { recursive: true });
  await writeJson(path.join(root, "draftpine.config.json"), defaultConfig(starter));
  const browsable = starter === "browsable";
  await writeJson(path.join(root, "routes.json"), {
    routes: [
      route("home", "/", "Home", "index.html", "home", 1),
      ...(browsable
        ? [
            route("pricing", "/pricing/", "Pricing", "pricing/index.html", "pricing", 2),
            route("compare", "/compare/", "Compare", "compare/index.html", "comparison", 3),
            route("contact", "/contact/", "Contact", "contact/index.html", "contact", 4)
          ]
        : [])
    ]
  });
  await writeJson(path.join(root, "recipes/home.json"), richHomeRecipe());
  await writeJson(path.join(root, "content/pages/home.json"), richHomeContent(browsable));
  if (browsable) {
    await writeJson(path.join(root, "recipes/pricing.json"), pricingRecipe());
    await writeJson(path.join(root, "recipes/compare.json"), comparisonRecipe());
    await writeJson(path.join(root, "recipes/contact.json"), contactRecipe());
    await writeJson(path.join(root, "content/pages/pricing.json"), pricingContent());
    await writeJson(path.join(root, "content/pages/compare.json"), comparisonContent());
    await writeJson(path.join(root, "content/pages/contact.json"), contactContent());
  }
}

function richHomeRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "home",
    routeType: "home",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.heroProof", layout: "core.split", variant: "developer", content: "hero" },
      { id: "metrics", primitive: "core.metricBand", layout: "core.gridAuto", variant: "compact", content: "metrics" },
      { id: "features", primitive: "core.cardGrid", layout: "core.gridAuto", variant: "compact", content: "features" },
      { id: "workflow", primitive: "core.productMockup", layout: "core.stack", variant: "workflow", content: "workflow" },
      { id: "paths", primitive: "core.pricingTable", layout: "core.gridAuto", variant: "threePlan", content: "paths" },
      { id: "comparison", primitive: "core.comparisonTable", layout: "core.scrollX", variant: "compact", content: "comparison" },
      { id: "faq", primitive: "core.faq", layout: "core.stack", variant: "default", content: "faq" },
      { id: "cta", primitive: "core.finalCta", layout: "core.stack", variant: "default", content: "cta" }
    ],
    states: ["default"],
    interactions: ["theme"]
  };
}

function richHomeContent(browsable: boolean) {
  return {
    description: "Static Draftpine v2 starter with route-ready product composition.",
    hero: {
      eyebrow: "Draftpine v2",
      title: "Compile product intent into static prototypes with strict feedback.",
      description: "Agents edit source JSON, choose route recipes, and Draftpine renders bounded pages with deterministic layout and browser evals.",
      primaryAction: { label: "Run eval", href: "#" },
      secondaryAction: { label: browsable ? "Compare paths" : "Read report", href: browsable ? "./compare/" : "#" },
      proof: {
        title: "Agent repair loop",
        code: "draftpine generate\\ndraftpine eval --strict\\nreports/latest.json",
        metrics: [
          { label: "Output", value: "Static" },
          { label: "Gate", value: "Strict" }
        ]
      }
    },
    metrics: {
      items: [
        { label: "Compile target", value: "<1s" },
        { label: "Default viewports", value: "2" },
        { label: "Core primitives", value: "16" },
        { label: "Runtime backend", value: "None" }
      ]
    },
    features: {
      title: "Core kit",
      description: "The starter shows real composition rather than a bare hero.",
      items: [
        { title: "Route contracts", body: "Home, pricing, comparison, contact, app, and docs routes each define required composition.", href: browsable ? "./compare/" : "#", linkLabel: "See comparison" },
        { title: "Bounded grids", body: "Cards live inside capped containers with hairline borders and responsive grid primitives.", href: "#", linkLabel: "Inspect layout" },
        { title: "Repair actions", body: "Eval findings include route, file, evidence, and source-oriented repair instructions.", href: "#", linkLabel: "Open report" }
      ]
    },
    workflow: {
      title: "Product artifact, not placeholder art",
      description: "Core product mockups show workflow state directly inside a bounded card.",
      toolbar: [{ label: "Source" }, { label: "Compile" }, { label: "Evaluate" }],
      panels: [
        { title: "Recipe", body: "Sections resolve primitives and content slots.", meta: "recipes/home.json" },
        { title: "Render", body: "Static HTML, CSS, and minimal JS are generated.", meta: "prototype/" },
        { title: "Report", body: "Browser findings become repair actions.", meta: "reports/latest.json" }
      ],
      activity: [
        { time: "00:01", label: "Schemas validated" },
        { time: "00:02", label: "Screenshots captured" },
        { time: "00:03", label: "No overflow found" }
      ]
    },
    paths: {
      title: "Prototype paths",
      description: "Starter sections model common product routes without needing a backend.",
      items: [
        { name: "Single screen", price: "Fast", description: "A focused disposable screen.", features: ["Home recipe", "Static report", "Theme toggle"], action: { label: "Use starter", href: "#" } },
        { name: "Browsable", price: "Richer", description: "Representative routes for an IA.", features: ["Pricing", "Comparison", "Contact"], action: { label: "Open routes", href: browsable ? "./pricing/" : "#" } },
        { name: "Extension", price: "Custom", description: "Add a primitive with fixtures.", features: ["Manifest", "Demo", "Eval"], action: { label: "Scaffold", href: "#" } }
      ]
    },
    comparison: {
      title: "Why structured source",
      description: "A compact comparison keeps the page decision-oriented.",
      columns: [{ label: "Need" }, { label: "Draftpine" }, { label: "Hand HTML" }],
      rows: [
        { label: "Mobile layout", first: "Eval-gated", second: "Manual inspection" },
        { label: "Route consistency", first: "Recipe contracts", second: "Copy-paste risk" },
        { label: "Agent repair", first: "Source action", second: "Screenshot guesswork" }
      ]
    },
    faq: {
      title: "Starter questions",
      items: [
        { question: "Does output need Node?", answer: "No. The generated prototype is static HTML, CSS, and JavaScript." },
        { question: "Can agents add components?", answer: "Yes. Primitive and layout extensions require manifests, templates, styles, demos, eval fixtures, and docs." }
      ]
    },
    cta: {
      title: "Ready for a stricter prototype loop.",
      description: "Start with the rich default, then swap content and route recipes instead of rebuilding layout by hand.",
      primaryAction: { label: "Run strict eval", href: "#" },
      secondaryAction: { label: browsable ? "Open contact" : "Read report", href: browsable ? "./contact/" : "#" }
    }
  };
}

function pricingRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "pricing",
    routeType: "pricing",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.decisionHero", layout: "core.stack", variant: "compact", content: "hero" },
      { id: "plans", primitive: "core.pricingTable", layout: "core.gridAuto", variant: "threePlan", content: "plans" },
      { id: "faq", primitive: "core.faq", layout: "core.stack", variant: "default", content: "faq" }
    ],
    states: ["default"],
    interactions: ["theme"]
  };
}

function comparisonRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "compare",
    routeType: "comparison",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.decisionHero", layout: "core.stack", variant: "compact", content: "hero" },
      { id: "comparison", primitive: "core.comparisonTable", layout: "core.scrollX", variant: "compact", content: "comparison" },
      { id: "workflow", primitive: "core.productMockup", layout: "core.stack", variant: "workflow", content: "workflow" },
      { id: "cta", primitive: "core.finalCta", layout: "core.stack", variant: "default", content: "cta" }
    ],
    states: ["default"],
    interactions: ["theme"]
  };
}

function contactRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "contact",
    routeType: "contact",
    profile: "productMarketing",
    sections: [
      { id: "contact", primitive: "core.modalForm", layout: "core.stack", variant: "default", content: "contact" },
      { id: "details", primitive: "core.cardGrid", layout: "core.gridAuto", variant: "compact", content: "details" },
      { id: "success", primitive: "core.statePanel", layout: "core.stack", variant: "default", content: "success" }
    ],
    states: ["default", "success"],
    interactions: ["theme", "modal"]
  };
}

function pricingContent() {
  const home = richHomeContent(true);
  const plans = JSON.parse(JSON.stringify(home.paths));
  plans.items[1].action.href = "#";
  return {
    description: "Starter pricing route.",
    hero: {
      eyebrow: "Pricing",
      title: "Pick a prototype depth before expanding routes.",
      description: "Pricing routes show decision context, at least one price signal, and plan actions in the first flow.",
      signal: "Representative plan signal visible before the table.",
      primaryAction: { label: "Choose starter", href: "#" },
      secondaryAction: { label: "Compare", href: "../compare/" }
    },
    plans,
    faq: home.faq
  };
}

function comparisonContent() {
  const home = richHomeContent(true);
  const cta = JSON.parse(JSON.stringify(home.cta));
  cta.primaryAction.href = "#";
  cta.secondaryAction.href = "../contact/";
  return {
    description: "Starter comparison route.",
    hero: {
      eyebrow: "Comparison",
      title: "Structured source versus hand-edited output.",
      description: "Comparison routes need a decision-framed hero, table, evidence, and next step.",
      signal: "Claims are placeholder product guidance.",
      primaryAction: { label: "Run eval", href: "#" },
      secondaryAction: { label: "Contact", href: "../contact/" }
    },
    comparison: home.comparison,
    workflow: home.workflow,
    cta
  };
}

function contactContent() {
  return {
    description: "Starter contact route.",
    contact: {
      title: "Send prototype intent.",
      description: "Contact routes exercise modal, form labels, and success states.",
      buttonLabel: "Open request",
      success: "Request state captured for the prototype."
    },
    details: {
      title: "Contact paths",
      items: [
        { title: "Product review", body: "Send the screen packet and target route type." },
        { title: "Extension review", body: "Include primitive manifest, demo, and eval fixture." },
        { title: "Deployment", body: "Publish only after strict eval passes." }
      ]
    },
    success: {
      state: "success",
      title: "Success state",
      description: "The contact route includes a visible success state marker.",
      action: { label: "Back home", href: "../" }
    }
  };
}

function route(id: string, routePath: string, title: string, file: string, routeType: string, priority: number) {
  return {
    id,
    path: routePath,
    title,
    file,
    routeType,
    profile: "productMarketing",
    recipe: `recipes/${id}.json`,
    content: `content/pages/${id}.json`,
    priority,
    status: "ready"
  };
}

function defaultConfig(starter: string) {
  return {
    schemaVersion: "2.0",
    project: { name: starter === "docs" ? "Draftpine Docs Prototype" : "Draftpine Prototype" },
    source: {
      routes: "routes.json",
      contentDir: "content",
      recipesDir: "recipes",
      primitivesDir: "primitives",
      layoutsDir: "layouts"
    },
    output: { dir: "prototype", clean: true, assetsDir: "assets" },
    theme: { profile: "productMarketing", defaultMode: "light", allowThemeToggle: true },
    routeBudget: { defaultMaxRoutes: 7, largePrototypeRequiresApproval: true, representativeRoutesRequired: true },
    eval: { required: true, strict: true, viewports: ["mobile", "desktop"], aiReview: "manual", sampleStrategy: "route-type-plus-changed" }
  };
}

function camel(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}
