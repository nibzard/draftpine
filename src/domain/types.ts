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
  | "theme"
  | "visual"
  | "performance";

export type Status = "pass" | "fail" | "pass-with-review" | "review-required";
export type ViewportName = "mobileSmall" | "mobile" | "tablet" | "desktop" | "desktopWide";

export interface DraftpineConfig {
  schemaVersion: "3.0";
  project: {
    name: string;
    description?: string;
    owner?: string;
  };
  source: {
    mode: "pages";
    pagesDir: string;
    theme: string;
    themesDir: string;
  };
  output: {
    dir: string;
    clean: boolean;
    assetsDir: string;
  };
  theme: {
    defaultMode: "light" | "dark" | "system";
    allowThemeToggle: boolean;
  };
  eval: {
    required: boolean;
    strict: boolean;
    viewports: ViewportName[];
    aiReview: "off" | "manual" | "auto";
  };
}

export interface PrimaryAction {
  label: string;
  href: string;
}

export interface PageSection {
  id: string;
  block: string;
  props: Record<string, unknown>;
  slot?: string;
  visibility?: "visible" | "hidden";
  states?: string[];
  interactions?: string[];
  evalHints?: Record<string, unknown>;
}

export interface Page {
  schemaVersion: "3.0";
  id: string;
  path: string;
  title: string;
  type: string;
  description?: string;
  audience?: string;
  userGoal?: string;
  primaryAction?: PrimaryAction;
  status: "draft" | "ready" | "hidden" | "deprecated";
  priority: number;
  tags?: string[];
  navLabel?: string;
  theme?: string;
  layout?: string;
  sections: PageSection[];
  sourceFile: string;
  outputFile: string;
}

export interface BlockMetadata {
  file: string;
  description?: string;
  requires?: string[];
  optional?: string[];
  markers?: string[];
  states?: string[];
  interactions?: string[];
  allowedRawHtml?: string[];
  overflow?: "forbidden" | "allowed" | "conditional";
  accessibility?: {
    requiresHeading?: boolean;
    requiresLabels?: boolean;
  };
}

export interface ThemeConfig {
  schemaVersion: "3.0";
  name: string;
  description?: string;
  shell?: string;
  styles?: string;
  scripts?: string[];
  tokens?: Record<string, unknown>;
  supportsDarkMode?: boolean;
  requiredRuntime?: string[];
  blocks: Record<string, BlockMetadata>;
}

export interface LoadedBlock {
  name: string;
  metadata: BlockMetadata;
  sourceFile: string;
  template: string;
}

export interface LoadedTheme {
  id: string;
  root: string;
  sourceFile: string;
  config: ThemeConfig;
  shellFile?: string;
  shell?: string;
  stylesFile?: string;
  styles?: string;
  blocks: Map<string, LoadedBlock>;
}

export interface Route {
  id: string;
  path: string;
  title: string;
  type: string;
  file: string;
  sourceFile: string;
  priority: number;
  status: Page["status"];
  navLabel?: string;
}

export interface Workspace {
  root: string;
  configPath: string;
  config: DraftpineConfig;
}

export interface Project {
  workspace: Workspace;
  pages: Page[];
  routes: Route[];
  theme: LoadedTheme;
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
  block?: string;
  viewport?: string;
  evidence?: Record<string, unknown>;
  repair?: RepairAction;
  blocking: boolean;
}

export interface RepairAction {
  priority: number;
  type:
    | "edit-json"
    | "change-page"
    | "change-block"
    | "wrap-overflow"
    | "choose-layout"
    | "reduce-routes"
    | "add-block"
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
  sourceMode: "pages";
  activeTheme: string;
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
