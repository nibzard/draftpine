export type Severity = "error" | "warning" | "info";
export type FindingCategory =
  | "source"
  | "compile"
  | "runtime"
  | "layout"
  | "accessibility"
  | "route"
  | "composition"
  | "differentiation"
  | "content"
  | "primitive"
  | "visual"
  | "performance";

export type Status = "pass" | "fail" | "pass-with-review" | "review-required";

export interface DraftpineConfig {
  schemaVersion: string;
  project: {
    name: string;
    description?: string;
    owner?: string;
  };
  source: {
    routes: string;
    contentDir: string;
    recipesDir: string;
    primitivesDir: string;
    layoutsDir: string;
    overrides?: string;
  };
  output: {
    dir: string;
    clean: boolean;
    assetsDir: string;
  };
  theme: {
    profile: string;
    tokens?: string;
    defaultMode: "light" | "dark" | "system";
    allowThemeToggle: boolean;
  };
  routeBudget: {
    defaultMaxRoutes: number;
    largePrototypeRequiresApproval: boolean;
    representativeRoutesRequired: boolean;
  };
  eval: {
    required: boolean;
    strict: boolean;
    viewports: ViewportName[];
    aiReview: "off" | "manual" | "auto";
    sampleStrategy: "all" | "changed" | "route-type-plus-changed";
  };
}

export type ViewportName = "mobileSmall" | "mobile" | "tablet" | "desktop" | "desktopWide";

export interface RoutesFile {
  routes: Route[];
}

export interface Route {
  id: string;
  path: string;
  title: string;
  file: string;
  routeType: RouteTypeName;
  profile: string;
  recipe?: string;
  content?: string;
  priority: number;
  status: "draft" | "ready" | "hidden" | "deprecated";
  tags?: string[];
}

export type RouteTypeName =
  | "home"
  | "hub"
  | "detail"
  | "pricing"
  | "comparison"
  | "directory"
  | "docs"
  | "editorial"
  | "article"
  | "legal"
  | "contact"
  | "support"
  | "appDashboard"
  | "settings"
  | "checkout"
  | "onboarding"
  | "utility";

export interface Recipe {
  schemaVersion: string;
  routeId: string;
  routeType: RouteTypeName;
  profile: string;
  sections: Section[];
  states?: string[];
  interactions?: string[];
}

export interface Section {
  id: string;
  primitive: string;
  layout: string;
  variant?: string;
  content: string | Record<string, unknown>;
  visibility?: "visible" | "hidden";
  states?: string[];
  interactions?: string[];
  evalHints?: Record<string, unknown>;
}

export interface SlotDefinition {
  type:
    | "string"
    | "text"
    | "richText"
    | "number"
    | "boolean"
    | "enum"
    | "action"
    | "link"
    | "image"
    | "icon"
    | "code"
    | "metric"
    | "table"
    | "array"
    | "object"
    | "reference";
  required?: boolean;
  values?: string[];
  variants?: string[];
  items?: SlotDefinition;
}

export interface PrimitiveManifest {
  schemaVersion: string;
  name: string;
  namespace: string;
  type: "primitive";
  description: string;
  slots: Record<string, SlotDefinition>;
  variants: string[];
  layouts: string[];
  interactions: string[];
  states: string[];
  accessibility?: {
    requiresHeading?: boolean;
    requiresPrimaryAction?: boolean;
  };
  responsive?: Record<string, string>;
}

export interface LayoutManifest {
  schemaVersion: string;
  name: string;
  namespace: string;
  description: string;
  parameters?: Record<string, SlotDefinition & { default?: unknown }>;
  responsive?: Record<string, string>;
  overflow: "forbidden" | "allowed" | "conditional";
}

export interface RouteTypeContract {
  name: RouteTypeName;
  purpose: string;
  requiredPrimitives: string[];
  forbiddenPrimitives: string[];
  firstViewport: string[];
  requiredInteractions: string[];
}

export interface RegistryEntry<T> {
  id: string;
  manifest: T;
  dir: string;
  template?: string;
  styles?: string;
}

export interface Registry {
  primitives: Map<string, RegistryEntry<PrimitiveManifest>>;
  layouts: Map<string, RegistryEntry<LayoutManifest>>;
  routeTypes: Map<string, RouteTypeContract>;
}

export interface Workspace {
  root: string;
  configPath: string;
  config: DraftpineConfig;
}

export interface Project {
  workspace: Workspace;
  routes: Route[];
  recipes: Map<string, Recipe>;
  content: Map<string, Record<string, unknown>>;
  registry: Registry;
  findings: Finding[];
}

export interface Finding {
  id: string;
  severity: Severity;
  category: FindingCategory;
  message: string;
  route?: string;
  file?: string;
  selector?: string;
  primitive?: string;
  layout?: string;
  viewport?: string;
  evidence?: Record<string, unknown>;
  repair?: RepairAction;
  blocking: boolean;
}

export interface RepairAction {
  priority: number;
  type:
    | "edit-json"
    | "change-recipe"
    | "change-primitive"
    | "wrap-overflow"
    | "choose-layout"
    | "reduce-routes"
    | "add-demo"
    | "fix-template"
    | "fix-css"
    | "manual-review";
  file?: string;
  jsonPointer?: string;
  message: string;
  example?: unknown;
  relatedFindings?: string[];
}

export interface CompileArtifact {
  outputDir: string;
  routesRendered: Route[];
  outputFiles: string[];
  cssAssets: string[];
  jsAssets: string[];
  warnings: Finding[];
}

export interface EvalReport {
  draftpineVersion: string;
  status: Status;
  deterministicStatus: "pass" | "fail";
  manualReviewRequired: boolean;
  summary: {
    errors: number;
    warnings: number;
    routesEvaluated: number;
    screenshots: number;
  };
  findings: Finding[];
  artifacts: {
    screenshots: string[];
  };
}
