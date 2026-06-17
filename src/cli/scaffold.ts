import path from "node:path";
import { mkdir, cp } from "node:fs/promises";
import { pathExists, writeJson, writeText } from "../io/fs.js";

export async function initProject(targetPath: string, starter: "single-screen" | "browsable" | "docs", force = false, prompt = ""): Promise<void> {
  const root = path.resolve(process.cwd(), targetPath);
  if ((await pathExists(root)) && !force && (await pathExists(path.join(root, "draftpine.config.json")))) {
    throw new Error(`Refusing to overwrite existing Draftpine project at ${root}. Pass --force to overwrite.`);
  }
  await mkdir(root, { recursive: true });
  const starterDir = path.resolve(import.meta.dirname, "../../starters", starter);
  if ((await pathExists(starterDir)) && (await pathExists(path.join(starterDir, "draftpine.config.json")))) {
    await cp(starterDir, root, { recursive: true, force });
  } else {
    await writeStarter(root, starter, prompt);
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

async function writeStarter(root: string, starter: string, prompt = ""): Promise<void> {
  await mkdir(path.join(root, "content/pages"), { recursive: true });
  await mkdir(path.join(root, "recipes"), { recursive: true });
  await mkdir(path.join(root, "primitives"), { recursive: true });
  await mkdir(path.join(root, "layouts"), { recursive: true });
  const projectName = inferProjectName(prompt, starter);
  const domain = promptDomain(prompt);
  await writeJson(path.join(root, "draftpine.config.json"), defaultConfig(starter, projectName));
  const browsable = starter === "browsable";
  const browsableRoutes = [
    route("dashboard", "/dashboard/", "Dashboard", "dashboard/index.html", "appDashboard", 2),
    route("directory", "/directory/", "Directory", "directory/index.html", "directory", 3),
    route("detail", "/detail/", "Detail", "detail/index.html", "detail", 4),
    route("pricing", "/pricing/", "Pricing", "pricing/index.html", "pricing", 5),
    route("compare", "/compare/", "Compare", "compare/index.html", "comparison", 6),
    route("checkout", "/checkout/", "Checkout", "checkout/index.html", "checkout", 7),
    route("settings", "/settings/", "Settings", "settings/index.html", "settings", 8),
    route("support", "/support/", "Support", "support/index.html", "support", 9),
    route("editorial", "/editorial/", "Editorial", "editorial/index.html", "editorial", 10)
  ];
  await writeJson(path.join(root, "routes.json"), {
    routes: [
      route("home", "/", "Home", "index.html", "home", 1),
      ...(browsable ? browsableRoutes : [])
    ]
  });
  await writeJson(path.join(root, "recipes/home.json"), richHomeRecipe());
  await writeJson(path.join(root, "content/pages/home.json"), richHomeContent(browsable, domain));
  if (browsable) {
    await writeJson(path.join(root, "recipes/dashboard.json"), dashboardRecipe());
    await writeJson(path.join(root, "recipes/directory.json"), directoryRecipe());
    await writeJson(path.join(root, "recipes/detail.json"), detailRecipe());
    await writeJson(path.join(root, "recipes/pricing.json"), pricingRecipe());
    await writeJson(path.join(root, "recipes/compare.json"), comparisonRecipe());
    await writeJson(path.join(root, "recipes/checkout.json"), checkoutRecipe());
    await writeJson(path.join(root, "recipes/settings.json"), settingsRecipe());
    await writeJson(path.join(root, "recipes/support.json"), supportRecipe());
    await writeJson(path.join(root, "recipes/editorial.json"), editorialRecipe());
    await writeJson(path.join(root, "content/pages/dashboard.json"), dashboardContent(domain));
    await writeJson(path.join(root, "content/pages/directory.json"), directoryContent(domain));
    await writeJson(path.join(root, "content/pages/detail.json"), detailContent(domain));
    await writeJson(path.join(root, "content/pages/pricing.json"), pricingContent(domain));
    await writeJson(path.join(root, "content/pages/compare.json"), comparisonContent(domain));
    await writeJson(path.join(root, "content/pages/checkout.json"), checkoutContent(domain));
    await writeJson(path.join(root, "content/pages/settings.json"), settingsContent(domain));
    await writeJson(path.join(root, "content/pages/support.json"), supportContent(domain));
    await writeJson(path.join(root, "content/pages/editorial.json"), editorialContent(domain));
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

function richHomeContent(browsable: boolean, domain: PromptDomain = promptDomain("")) {
  return {
    description: `Static Draftpine v2 starter for ${domain.subject}.`,
    hero: {
      eyebrow: domain.eyebrow,
      title: domain.homeTitle,
      description: domain.homeDescription,
      primaryAction: { label: domain.primaryAction, href: browsable ? "./directory/" : "#" },
      secondaryAction: { label: browsable ? "View dashboard" : "Read report", href: browsable ? "./dashboard/" : "#" },
      proof: {
        title: `${domain.artifact} snapshot`,
        code: domain.proofCode,
        metrics: [
          { label: domain.metricA.label, value: domain.metricA.value },
          { label: domain.metricB.label, value: domain.metricB.value }
        ]
      }
    },
    metrics: {
      items: [
        { label: domain.metricA.label, value: domain.metricA.value },
        { label: domain.metricB.label, value: domain.metricB.value },
        { label: "Routes", value: browsable ? "10" : "2" },
        { label: "Backend", value: "None" }
      ]
    },
    features: {
      title: `${domain.itemPlural} and workflows`,
      description: `The starter turns ${domain.subject} into concrete browsable screens.`,
      items: [
        { title: domain.examples[0], body: domain.exampleBodies[0], href: browsable ? "./directory/" : "#", linkLabel: "Browse" },
        { title: domain.examples[1], body: domain.exampleBodies[1], href: browsable ? "./checkout/" : "#", linkLabel: "Start flow" },
        { title: domain.examples[2], body: domain.exampleBodies[2], href: browsable ? "./support/" : "#", linkLabel: "Get help" }
      ]
    },
    workflow: {
      title: `${domain.workflowName} artifact`,
      description: `Product proof shows ${domain.workflowObject} state directly inside a bounded card.`,
      toolbar: domain.workflowTabs.map((label) => ({ label })),
      panels: [
        { title: domain.workflowPanels[0].title, body: domain.workflowPanels[0].body, meta: domain.workflowPanels[0].meta },
        { title: domain.workflowPanels[1].title, body: domain.workflowPanels[1].body, meta: domain.workflowPanels[1].meta },
        { title: domain.workflowPanels[2].title, body: domain.workflowPanels[2].body, meta: domain.workflowPanels[2].meta }
      ],
      activity: [
        { time: "09:10", label: domain.activity[0] },
        { time: "10:25", label: domain.activity[1] },
        { time: "11:40", label: domain.activity[2] }
      ]
    },
    paths: {
      title: `${domain.subjectTitle} paths`,
      description: "Representative routes cover browsing, operations, comparison, setup, and support.",
      items: [
        { name: "Browse", price: domain.priceA, description: domain.planA, features: domain.planFeaturesA, action: { label: "Open directory", href: browsable ? "./directory/" : "#" } },
        { name: "Operate", price: domain.priceB, description: domain.planB, features: domain.planFeaturesB, action: { label: "Open dashboard", href: browsable ? "./dashboard/" : "#" } },
        { name: "Support", price: domain.priceC, description: domain.planC, features: domain.planFeaturesC, action: { label: "Open support", href: browsable ? "./support/" : "#" } }
      ]
    },
    comparison: {
      title: `Choosing a ${domain.itemSingular} path`,
      description: "A compact comparison keeps the route decision-oriented.",
      columns: [{ label: "Need" }, { label: domain.optionA }, { label: domain.optionB }],
      rows: [
        { label: "Best for", first: domain.compareA.best, second: domain.compareB.best },
        { label: "Risk", first: domain.compareA.risk, second: domain.compareB.risk },
        { label: "Next step", first: domain.compareA.next, second: domain.compareB.next }
      ]
    },
    faq: {
      title: `${domain.subjectTitle} questions`,
      items: [
        { question: domain.faq[0].question, answer: domain.faq[0].answer },
        { question: domain.faq[1].question, answer: domain.faq[1].answer }
      ]
    },
    cta: {
      title: `Ready to test ${domain.subject}.`,
      description: `Move from prompt to ${domain.itemPlural}, workflow state, and support paths without a backend.`,
      primaryAction: { label: domain.primaryAction, href: browsable ? "./directory/" : "#" },
      secondaryAction: { label: browsable ? "Open support" : "Read report", href: browsable ? "./support/" : "#" }
    }
  };
}

function dashboardRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "dashboard",
    routeType: "appDashboard",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.decisionHero", layout: "core.appShell", variant: "compact", content: "hero" },
      { id: "metrics", primitive: "core.metricBand", layout: "core.gridAuto", variant: "compact", content: "metrics" },
      { id: "queue", primitive: "core.dataTable", layout: "core.tableList", variant: "status", content: "queue" },
      { id: "activity", primitive: "core.timelineFeed", layout: "core.timeline", variant: "activity", content: "activity" }
    ],
    states: ["default"],
    interactions: ["theme"]
  };
}

function directoryRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "directory",
    routeType: "directory",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.decisionHero", layout: "core.stack", variant: "compact", content: "hero" },
      { id: "browse", primitive: "core.filterableList", layout: "core.tableList", variant: "directory", content: "browse" },
      { id: "table", primitive: "core.dataTable", layout: "core.tableList", variant: "compact", content: "table" }
    ],
    states: ["default", "empty"],
    interactions: ["theme", "filter"]
  };
}

function detailRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "detail",
    routeType: "detail",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.heroProof", layout: "core.inspectorSidebar", variant: "detail", content: "hero" },
      { id: "workflow", primitive: "core.productMockup", layout: "core.inspectorSidebar", variant: "workflow", content: "workflow" },
      { id: "timeline", primitive: "core.timelineFeed", layout: "core.timeline", variant: "activity", content: "timeline" }
    ],
    states: ["default"],
    interactions: ["theme"]
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
      { id: "workflow", primitive: "core.productMockup", layout: "core.inspectorSidebar", variant: "workflow", content: "workflow" },
      { id: "cta", primitive: "core.finalCta", layout: "core.stack", variant: "default", content: "cta" }
    ],
    states: ["default"],
    interactions: ["theme"]
  };
}

function checkoutRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "checkout",
    routeType: "checkout",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.decisionHero", layout: "core.splitForm", variant: "compact", content: "hero" },
      { id: "steps", primitive: "core.stepperFlow", layout: "core.stepper", variant: "checkout", content: "steps" },
      { id: "success", primitive: "core.statePanel", layout: "core.stack", variant: "success", content: "success" }
    ],
    states: ["default", "success"],
    interactions: ["theme"]
  };
}

function settingsRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "settings",
    routeType: "settings",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.decisionHero", layout: "core.stack", variant: "compact", content: "hero" },
      { id: "settings", primitive: "core.settingsList", layout: "core.inspectorSidebar", variant: "product", content: "settings" },
      { id: "state", primitive: "core.statePanel", layout: "core.stack", variant: "success", content: "state" }
    ],
    states: ["default", "success"],
    interactions: ["theme"]
  };
}

function supportRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "support",
    routeType: "support",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.decisionHero", layout: "core.stack", variant: "compact", content: "hero" },
      { id: "support", primitive: "core.supportPanel", layout: "core.gridTwo", variant: "triage", content: "support" },
      { id: "contact", primitive: "core.modalForm", layout: "core.splitForm", variant: "default", content: "contact" }
    ],
    states: ["default", "warning", "success"],
    interactions: ["theme", "modal"]
  };
}

function editorialRecipe() {
  return {
    schemaVersion: "2.0",
    routeId: "editorial",
    routeType: "editorial",
    profile: "productMarketing",
    sections: [
      { id: "hero", primitive: "core.decisionHero", layout: "core.stack", variant: "editorial", content: "hero" },
      { id: "timeline", primitive: "core.timelineFeed", layout: "core.timeline", variant: "editorial", content: "timeline" },
      { id: "related", primitive: "core.cardGrid", layout: "core.gridAuto", variant: "compact", content: "related" }
    ],
    states: ["default"],
    interactions: ["theme"]
  };
}

function dashboardContent(domain: PromptDomain = promptDomain("")) {
  return {
    description: `${domain.subjectTitle} operational dashboard route.`,
    hero: {
      eyebrow: "Dashboard",
      title: `Track ${domain.itemPlural} and work in motion.`,
      description: `${domain.subjectTitle} operations open with compact metrics, a queue, and recent activity.`,
      signal: domain.dashboardSignal,
      primaryAction: { label: "Review queue", href: "#" },
      secondaryAction: { label: "Open settings", href: "../settings/" }
    },
    metrics: { items: domain.dashboardMetrics },
    queue: {
      title: `${domain.queueName} queue`,
      description: `A dense table keeps ${domain.subject} operations distinct from card grids.`,
      columns: [{ label: "Record" }, { label: "Status" }, { label: "Owner" }, { label: "Updated" }],
      rows: domain.queueRows
    },
    activity: {
      title: "Activity",
      description: "Recent state changes stay visible below the queue.",
      items: domain.timelineItems
    }
  };
}

function directoryContent(domain: PromptDomain = promptDomain("")) {
  return {
    description: `${domain.subjectTitle} directory route.`,
    hero: {
      eyebrow: "Directory",
      title: `Browse ${domain.itemPlural} by need, status, or owner.`,
      description: `${domain.subjectTitle} directory routes prioritize scan, filter, and comparison over persuasion.`,
      signal: "Search narrows the visible list.",
      primaryAction: { label: domain.addItemAction, href: "#" },
      secondaryAction: { label: "Open dashboard", href: "../dashboard/" }
    },
    browse: {
      title: `Browse ${domain.itemPlural}`,
      items: domain.directoryItems,
      empty: { message: `No ${domain.itemPlural} match the current filter.` }
    },
    table: {
      title: "Directory table",
      columns: [{ label: "Record" }, { label: "Status" }, { label: "Owner" }, { label: "Updated" }],
      rows: domain.queueRows
    }
  };
}

function detailContent(domain: PromptDomain = promptDomain("")) {
  return {
    description: `${domain.subjectTitle} detail route.`,
    hero: {
      eyebrow: "Detail",
      title: `Explain one ${domain.itemSingular} workflow with proof beside it.`,
      description: `Detail routes pair focused ${domain.subject} copy with a compact artifact instead of a broad grid.`,
      primaryAction: { label: domain.primaryAction, href: "#" },
      secondaryAction: { label: "Compare", href: "../compare/" },
      proof: {
        title: `${domain.artifact} snapshot`,
        code: domain.proofCode,
        metrics: [{ label: domain.metricA.label, value: domain.metricA.value }, { label: "State", value: "Ready" }]
      }
    },
    workflow: richHomeContent(true, domain).workflow,
    timeline: {
      title: `How this ${domain.itemSingular} path works`,
      items: [
        { label: "Input", title: domain.timelineItems[0].title, body: domain.timelineItems[0].body },
        { label: "Shape", title: domain.timelineItems[1].title, body: domain.timelineItems[1].body },
        { label: "Review", title: domain.timelineItems[2].title, body: domain.timelineItems[2].body }
      ]
    }
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

function pricingContent(domain: PromptDomain = promptDomain("")) {
  const home = richHomeContent(true, domain);
  const plans = JSON.parse(JSON.stringify(home.paths));
  plans.items[0].action.href = "../directory/";
  plans.items[1].action.href = "../dashboard/";
  plans.items[2].action.href = "../support/";
  return {
    description: "Starter pricing route.",
    hero: {
      eyebrow: "Pricing",
      title: `Pick a ${domain.subject} plan before committing.`,
      description: `Pricing routes show ${domain.priceUnit} context, a plan signal, and actions in the first flow.`,
      signal: domain.pricingSignal,
      primaryAction: { label: domain.pricingAction, href: "#" },
      secondaryAction: { label: "Compare", href: "../compare/" }
    },
    plans,
    faq: home.faq
  };
}

function comparisonContent(domain: PromptDomain = promptDomain("")) {
  const home = richHomeContent(true, domain);
  const cta = JSON.parse(JSON.stringify(home.cta));
  cta.primaryAction.href = "#";
  cta.secondaryAction.href = "../support/";
  return {
    description: "Starter comparison route.",
    hero: {
      eyebrow: "Comparison",
      title: `Compare ${domain.optionA} and ${domain.optionB}.`,
      description: `Comparison routes help users choose the right ${domain.itemSingular} path with evidence and next steps.`,
      signal: domain.compareSignal,
      primaryAction: { label: "Compare options", href: "#" },
      secondaryAction: { label: "Support", href: "../support/" }
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

function checkoutContent(domain: PromptDomain = promptDomain("")) {
  return {
    description: `${domain.subjectTitle} checkout route.`,
    hero: {
      eyebrow: "Checkout",
      title: `Confirm the ${domain.itemSingular} path before committing.`,
      description: `Checkout routes show ${domain.subject} progress, summary, and next action in a compact flow.`,
      signal: "Static flow; no real payment, scheduling, or backend calls.",
      primaryAction: { label: "Continue", href: "#" },
      secondaryAction: { label: "Change plan", href: "../pricing/" }
    },
    steps: {
      title: `${domain.checkoutName} steps`,
      description: "The visible sequence prevents checkout pages from looking like marketing pages.",
      steps: domain.checkoutSteps,
      summary: { title: "Summary", body: domain.checkoutSummary, meta: "Prototype only" },
      primaryAction: { label: domain.checkoutAction, href: "#" }
    },
    success: { state: "success", title: "Success state", description: "A visible success marker appears after confirmation.", action: { label: "Open dashboard", href: "../dashboard/" } }
  };
}

function settingsContent(domain: PromptDomain = promptDomain("")) {
  return {
    description: `${domain.subjectTitle} settings route.`,
    hero: {
      eyebrow: "Settings",
      title: `Configure ${domain.subject} defaults in grouped rows.`,
      description: "Settings routes should feel dense, stable, and reviewable.",
      signal: domain.settingsSignal,
      primaryAction: { label: "Save changes", href: "#" },
      secondaryAction: { label: "Open support", href: "../support/" }
    },
    settings: {
      title: "Configuration",
      description: "Grouped settings create a different rhythm from cards and pricing.",
      groups: domain.settingsGroups
    },
    state: { state: "success", title: "Saved state", description: "Settings include a visible success state.", action: { label: "Return home", href: "../" } }
  };
}

function supportContent(domain: PromptDomain = promptDomain("")) {
  return {
    description: `${domain.subjectTitle} support route.`,
    hero: {
      eyebrow: "Support",
      title: `Pick a ${domain.subject} help path based on urgency.`,
      description: "Support routes combine triage options, current status, and contact intent.",
      signal: domain.supportSignal,
      primaryAction: { label: "Start triage", href: "#" },
      secondaryAction: { label: "Open dashboard", href: "../dashboard/" }
    },
    support: {
      title: "Help paths",
      description: "Different help intents sit side by side with status.",
      options: domain.supportOptions,
      status: domain.supportStatus
    },
    contact: {
      title: "Send support context",
      description: "Support route exercises the modal form interaction.",
      buttonLabel: "Open request",
      success: "Request state captured."
    }
  };
}

function editorialContent(domain: PromptDomain = promptDomain("")) {
  return {
    description: `${domain.subjectTitle} editorial route.`,
    hero: {
      eyebrow: "Editorial",
      title: `Tell the ${domain.subject} story without a product grid.`,
      description: "Editorial routes use narrative structure and related links rather than app chrome.",
      signal: domain.editorialSignal,
      primaryAction: { label: "Read timeline", href: "#" },
      secondaryAction: { label: "Open detail", href: "../detail/" }
    },
    timeline: {
      title: `${domain.subjectTitle} story`,
      description: "A timeline makes the page structurally different from dashboards and directories.",
      items: domain.editorialItems
    },
    related: {
      title: "Related routes",
      items: [
        { title: "Detail", body: "Inspect one workflow.", href: "../detail/", linkLabel: "Open detail" },
        { title: "Directory", body: "Browse records.", href: "../directory/", linkLabel: "Open directory" },
        { title: "Support", body: "Resolve an issue.", href: "../support/", linkLabel: "Open support" }
      ]
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

function defaultConfig(starter: string, projectName?: string) {
  return {
    schemaVersion: "2.0",
    project: { name: projectName ?? (starter === "docs" ? "Draftpine Docs Prototype" : "Draftpine Prototype") },
    source: {
      routes: "routes.json",
      contentDir: "content",
      recipesDir: "recipes",
      primitivesDir: "primitives",
      layoutsDir: "layouts"
    },
    output: { dir: "prototype", clean: true, assetsDir: "assets" },
    theme: { profile: "productMarketing", defaultMode: "light", allowThemeToggle: true },
    routeBudget: { defaultMaxRoutes: starter === "browsable" ? 10 : 7, largePrototypeRequiresApproval: true, representativeRoutesRequired: true },
    eval: { required: true, strict: true, viewports: ["mobile", "desktop"], aiReview: "manual", sampleStrategy: "route-type-plus-changed" }
  };
}

interface PromptDomain {
  subject: string;
  subjectTitle: string;
  eyebrow: string;
  itemSingular: string;
  itemPlural: string;
  artifact: string;
  primaryAction: string;
  addItemAction: string;
  homeTitle: string;
  homeDescription: string;
  proofCode: string;
  metricA: { label: string; value: string };
  metricB: { label: string; value: string };
  examples: string[];
  exampleBodies: string[];
  workflowName: string;
  workflowObject: string;
  workflowTabs: string[];
  workflowPanels: Array<{ title: string; body: string; meta: string }>;
  activity: string[];
  priceA: string;
  priceB: string;
  priceC: string;
  priceUnit: string;
  planA: string;
  planB: string;
  planC: string;
  planFeaturesA: string[];
  planFeaturesB: string[];
  planFeaturesC: string[];
  optionA: string;
  optionB: string;
  compareSignal: string;
  compareA: { best: string; risk: string; next: string };
  compareB: { best: string; risk: string; next: string };
  faq: Array<{ question: string; answer: string }>;
  dashboardSignal: string;
  dashboardMetrics: Array<{ label: string; value: string }>;
  queueName: string;
  queueRows: Array<{ label: string; status: string; owner: string; updated: string }>;
  timelineItems: Array<{ label: string; title: string; body: string }>;
  directoryItems: Array<{ title: string; body: string }>;
  pricingSignal: string;
  pricingAction: string;
  checkoutName: string;
  checkoutSteps: Array<{ title: string; body: string }>;
  checkoutSummary: string;
  checkoutAction: string;
  settingsSignal: string;
  settingsGroups: Array<{ title: string; rows: Array<{ label: string; value: string }> }>;
  supportSignal: string;
  supportOptions: Array<{ title: string; body: string; label: string; href: string }>;
  supportStatus: Array<{ label: string; value: string }>;
  editorialSignal: string;
  editorialItems: Array<{ label: string; title: string; body: string }>;
}

function promptDomain(prompt: string): PromptDomain {
  const lower = prompt.toLowerCase();
  if (/(music|teacher|lesson|tutor)/.test(lower)) {
    return domain({
      subject: "independent music teacher marketplace",
      eyebrow: "Teacher marketplace",
      itemSingular: "teacher",
      itemPlural: "teachers",
      artifact: "Lesson match",
      primaryAction: "Find teachers",
      addItemAction: "Add teacher",
      homeTitle: "Help students find the right independent music teacher.",
      homeDescription: "Browse teachers by instrument, format, availability, and student goal before starting a booking flow.",
      proofCode: "student goal -> teacher match -> trial lesson",
      metricA: { label: "Teachers", value: "128" },
      metricB: { label: "Trial slots", value: "42" },
      examples: ["Piano teachers", "Voice coaches", "Beginner-friendly lessons"],
      exampleBodies: ["Compare style, format, and next openings.", "Match vocal range, genre, and studio setup.", "Surface teachers who work well with first-time students."],
      workflowName: "Lesson booking",
      workflowObject: "teacher availability",
      workflowTabs: ["Instrument", "Teacher", "Trial"],
      activity: ["New piano teacher approved", "Voice coach added evening slots", "Trial lesson request moved to ready"],
      optionA: "Trial lesson",
      optionB: "Monthly plan",
      priceUnit: "lesson",
      queueName: "teacher"
    });
  }
  if (/(clinic|nurse|medical|patient|care)/.test(lower)) {
    return domain({
      subject: "clinic operations portal for mobile nurses",
      eyebrow: "Clinic operations",
      itemSingular: "visit",
      itemPlural: "visits",
      artifact: "Visit route",
      primaryAction: "Assign visit",
      addItemAction: "Add visit",
      homeTitle: "Coordinate mobile nurse visits without losing field context.",
      homeDescription: "Review routes, patient readiness, supply needs, and escalation state from one static operations prototype.",
      proofCode: "patient ready -> nurse route -> visit complete",
      metricA: { label: "Visits", value: "34" },
      metricB: { label: "At risk", value: "5" },
      examples: ["Morning routes", "Supply checks", "Patient readiness"],
      exampleBodies: ["Group visits by geography and appointment window.", "Flag missing kits before a nurse leaves.", "Show readiness, contact state, and escalation notes."],
      workflowName: "Visit assignment",
      workflowObject: "route and patient",
      workflowTabs: ["Route", "Patient", "Supplies"],
      activity: ["Route A reassigned", "Wound-care kit confirmed", "Patient callback required"],
      optionA: "Standard visit",
      optionB: "Escalated visit",
      priceUnit: "visit",
      queueName: "visit"
    });
  }
  if (/(museum|exhibit|donor|gallery|curator)/.test(lower)) {
    return domain({
      subject: "museum exhibit planning and donor preview tool",
      eyebrow: "Exhibit planning",
      itemSingular: "exhibit",
      itemPlural: "exhibits",
      artifact: "Exhibit preview",
      primaryAction: "Review exhibits",
      addItemAction: "Add exhibit",
      homeTitle: "Plan exhibits and donor previews from one shared prototype.",
      homeDescription: "Track galleries, object readiness, donor notes, and preview milestones without building a backend.",
      proofCode: "gallery plan -> object list -> donor preview",
      metricA: { label: "Exhibits", value: "9" },
      metricB: { label: "Objects", value: "184" },
      examples: ["Gallery concepts", "Object readiness", "Donor preview notes"],
      exampleBodies: ["Compare exhibit themes and target openings.", "Track conservation, photography, and label state.", "Prepare sponsor-facing summaries and open questions."],
      workflowName: "Preview planning",
      workflowObject: "gallery readiness",
      workflowTabs: ["Gallery", "Objects", "Donors"],
      activity: ["Textile case approved", "Donor preview moved to Friday", "Object photography flagged"],
      optionA: "Public opening",
      optionB: "Donor preview",
      priceUnit: "program",
      queueName: "exhibit"
    });
  }
  const subject = inferSubject(prompt);
  return domain({
    subject,
    eyebrow: "Prototype",
    itemSingular: "record",
    itemPlural: "records",
    artifact: "Workflow",
    primaryAction: "Browse records",
    addItemAction: "Add record",
    homeTitle: `Browse and operate ${subject} from one prototype.`,
    homeDescription: `Turn ${subject} into directory, dashboard, checkout, settings, support, and editorial routes.`,
    proofCode: "record -> workflow -> reviewed",
    metricA: { label: "Records", value: "24" },
    metricB: { label: "Ready", value: "18" },
    examples: ["Active records", "Workflow steps", "Support needs"],
    exampleBodies: ["Browse the important entries.", "Move one path through a static flow.", "Surface issues and help options."],
    workflowName: "Workflow",
    workflowObject: "record",
    workflowTabs: ["Browse", "Review", "Act"],
    activity: ["Record approved", "Workflow updated", "Support note added"],
    optionA: "Self-serve",
    optionB: "Assisted",
    priceUnit: "record",
    queueName: "record"
  });
}

function domain(input: {
  subject: string;
  eyebrow: string;
  itemSingular: string;
  itemPlural: string;
  artifact: string;
  primaryAction: string;
  addItemAction: string;
  homeTitle: string;
  homeDescription: string;
  proofCode: string;
  metricA: { label: string; value: string };
  metricB: { label: string; value: string };
  examples: string[];
  exampleBodies: string[];
  workflowName: string;
  workflowObject: string;
  workflowTabs: string[];
  activity: string[];
  optionA: string;
  optionB: string;
  priceUnit: string;
  queueName: string;
}): PromptDomain {
  const subjectTitle = titleCase(input.subject);
  return {
    ...input,
    subjectTitle,
    workflowPanels: [
      { title: input.examples[0], body: input.exampleBodies[0], meta: input.workflowTabs[0] },
      { title: input.examples[1], body: input.exampleBodies[1], meta: input.workflowTabs[1] },
      { title: input.examples[2], body: input.exampleBodies[2], meta: input.workflowTabs[2] }
    ],
    priceA: "Basic",
    priceB: "Team",
    priceC: "Guided",
    planA: `Browse ${input.itemPlural} and compare fit.`,
    planB: `Coordinate ${input.itemPlural} with shared operations state.`,
    planC: `Add support paths for complex ${input.priceUnit} decisions.`,
    planFeaturesA: [`${input.examples[0]}`, "Directory", "Comparison"],
    planFeaturesB: [`${input.examples[1]}`, "Dashboard", "Settings"],
    planFeaturesC: [`${input.examples[2]}`, "Support", "Editorial notes"],
    compareSignal: `Compare ${input.optionA.toLowerCase()} against ${input.optionB.toLowerCase()} before choosing.`,
    compareA: { best: input.examples[0], risk: "May need manual review", next: input.primaryAction },
    compareB: { best: input.examples[1], risk: "Needs setup context", next: "Open checkout" },
    faq: [
      { question: `Is this real ${input.subject} software?`, answer: "No. It is a static prototype for reviewing structure and flow." },
      { question: "Does it call a backend?", answer: "No. All data is local fixture content for wireframe evaluation." }
    ],
    dashboardSignal: `${input.metricA.value} ${input.itemPlural} and ${input.metricB.value} ready signals need review.`,
    dashboardMetrics: [
      input.metricA,
      input.metricB,
      { label: "Blocked", value: "3" },
      { label: "Updated", value: "Today" }
    ],
    queueName: input.queueName,
    queueRows: [
      { label: input.examples[0], status: "Ready", owner: "Avery", updated: "Today" },
      { label: input.examples[1], status: "Review", owner: "Mina", updated: "Yesterday" },
      { label: input.examples[2], status: "Blocked", owner: "Noor", updated: "Monday" }
    ],
    timelineItems: [
      { label: "Input", title: input.activity[0], body: `The ${input.itemSingular} path starts with concrete user context.` },
      { label: "Review", title: input.activity[1], body: `Operational state is visible before action.` },
      { label: "Next", title: input.activity[2], body: `The route points to the next static workflow.` }
    ],
    directoryItems: input.examples.map((title, index) => ({ title, body: input.exampleBodies[index] })),
    pricingSignal: `Plans are fictional and priced around ${input.priceUnit} complexity.`,
    pricingAction: `Choose ${input.optionA.toLowerCase()}`,
    checkoutName: input.optionA,
    checkoutSteps: [
      { title: "Review", body: `Confirm the selected ${input.itemSingular}.` },
      { title: "Details", body: `Check ${input.workflowObject} context.` },
      { title: "Confirm", body: "Move the prototype into success state." }
    ],
    checkoutSummary: `${input.optionA}, ${input.examples[0]}, owner Avery.`,
    checkoutAction: "Confirm",
    settingsSignal: `Defaults affect ${input.itemPlural}, notifications, and support routing.`,
    settingsGroups: [
      { title: subjectTitle, rows: [{ label: "Default view", value: input.workflowTabs[0] }, { label: "Review mode", value: "Team" }, { label: "Region", value: "Local" }] },
      { title: "Automation", rows: [{ label: "Alerts", value: "Critical" }, { label: "Digest", value: "Weekly" }, { label: "Escalation", value: "Manual" }] }
    ],
    supportSignal: `Expected response depends on ${input.priceUnit} urgency and available context.`,
    supportOptions: [
      { title: `Troubleshoot ${input.itemSingular}`, body: input.exampleBodies[0], label: "Start guide", href: "#" },
      { title: "Ask support", body: input.exampleBodies[1], label: "Open request", href: "#" },
      { title: "Read notes", body: input.exampleBodies[2], label: "Open notes", href: "../editorial/" }
    ],
    supportStatus: [{ label: "State", value: "Operational" }, { label: "Response", value: "2 hours" }, { label: "Priority", value: "Normal" }],
    editorialSignal: `Use for research notes, stakeholder context, and ${input.itemSingular} decisions.`,
    editorialItems: [
      { label: "Context", title: input.examples[0], body: input.exampleBodies[0] },
      { label: "Decision", title: input.examples[1], body: input.exampleBodies[1] },
      { label: "Result", title: input.examples[2], body: input.exampleBodies[2] }
    ]
  };
}

function inferProjectName(prompt: string, starter: string): string {
  const subject = promptDomain(prompt).subjectTitle;
  if (starter === "docs") return `${subject} Docs Prototype`;
  return `${subject} Prototype`;
}

function inferSubject(prompt: string): string {
  const cleaned = prompt
    .trim()
    .replace(/wireframe|prototype|website|app|page|for|create|build|make/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "product intent";
  return cleaned.split(" ").slice(0, 4).join(" ");
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function camel(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}
