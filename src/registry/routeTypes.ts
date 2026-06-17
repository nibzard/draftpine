import type { RouteTypeContract } from "../domain/types.js";

export const routeTypeContracts: RouteTypeContract[] = [
  {
    name: "home",
    purpose: "Introduce product/category, show proof, and drive the primary action.",
    requiredPrimitives: ["core.heroProof", "core.productMockup", "core.finalCta"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "primaryAction", "proof"],
    requiredInteractions: []
  },
  {
    name: "pricing",
    purpose: "Help a user make a buying or plan decision.",
    requiredPrimitives: ["core.decisionHero", "core.pricingTable"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "primaryAction", "priceSignal"],
    requiredInteractions: []
  },
  {
    name: "comparison",
    purpose: "Help a user compare a product against an alternative.",
    requiredPrimitives: ["core.decisionHero", "core.comparisonTable"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "primaryAction", "comparison"],
    requiredInteractions: []
  },
  {
    name: "hub",
    purpose: "Organize and link a route group.",
    requiredPrimitives: ["core.cardGrid"],
    forbiddenPrimitives: [],
    firstViewport: ["h1"],
    requiredInteractions: []
  },
  {
    name: "directory",
    purpose: "Help users browse, filter, and compare a set of entries.",
    requiredPrimitives: ["core.filterableList"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "filter", "items"],
    requiredInteractions: ["filter"]
  },
  {
    name: "detail",
    purpose: "Explain one feature, use case, integration, or industry.",
    requiredPrimitives: ["core.heroProof", "core.productMockup"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "proof"],
    requiredInteractions: []
  },
  {
    name: "editorial",
    purpose: "Present narrative content with proof, timeline, or related references.",
    requiredPrimitives: ["core.timelineFeed"],
    forbiddenPrimitives: ["core.pricingTable"],
    firstViewport: ["h1", "summary"],
    requiredInteractions: []
  },
  {
    name: "docs",
    purpose: "Explain usage or implementation.",
    requiredPrimitives: ["core.codePanel"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "code"],
    requiredInteractions: []
  },
  {
    name: "legal",
    purpose: "Present legal or static policy content.",
    requiredPrimitives: [],
    forbiddenPrimitives: ["core.heroProof"],
    firstViewport: ["h1"],
    requiredInteractions: []
  },
  {
    name: "contact",
    purpose: "Let users choose a contact path or submit intent.",
    requiredPrimitives: ["core.modalForm"],
    forbiddenPrimitives: [],
    firstViewport: ["h1"],
    requiredInteractions: []
  },
  {
    name: "support",
    purpose: "Let users diagnose an issue and choose a help path.",
    requiredPrimitives: ["core.supportPanel"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "supportOptions"],
    requiredInteractions: []
  },
  {
    name: "article",
    purpose: "Present long-form narrative content.",
    requiredPrimitives: [],
    forbiddenPrimitives: [],
    firstViewport: ["h1"],
    requiredInteractions: []
  },
  {
    name: "appDashboard",
    purpose: "Present operational app state and primary workflow actions.",
    requiredPrimitives: ["core.metricBand"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "primaryAction"],
    requiredInteractions: []
  },
  {
    name: "settings",
    purpose: "Configure product or account behavior.",
    requiredPrimitives: ["core.settingsList"],
    forbiddenPrimitives: [],
    firstViewport: ["h1"],
    requiredInteractions: []
  },
  {
    name: "checkout",
    purpose: "Guide a user through review, confirmation, or purchase steps.",
    requiredPrimitives: ["core.stepperFlow"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "primaryAction", "steps"],
    requiredInteractions: []
  },
  {
    name: "onboarding",
    purpose: "Guide a user through first setup.",
    requiredPrimitives: ["core.stepperFlow"],
    forbiddenPrimitives: [],
    firstViewport: ["h1", "primaryAction"],
    requiredInteractions: []
  },
  {
    name: "utility",
    purpose: "Support a narrow utility workflow.",
    requiredPrimitives: [],
    forbiddenPrimitives: [],
    firstViewport: ["h1"],
    requiredInteractions: []
  }
];
