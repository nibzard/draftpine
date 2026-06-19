import path from "node:path";
import { createHash } from "node:crypto";
import type { CompileArtifact, Finding, Project } from "../domain/types.js";
import { finding } from "../domain/findings.js";
import { cleanDir, isPathInside, listFilesRecursive, readText, toPosix, writeJson, writeText } from "../io/fs.js";
import { loadProject } from "../io/workspace.js";
import { renderRouteHtml, routeOutputPath } from "./html.js";
import { runtimeJs, siteDataJs } from "../runtime/runtime.js";

export async function generate(configPath = "draftpine.config.json"): Promise<{ project: Project; artifact: CompileArtifact; findings: Finding[] }> {
  const project = await loadProject(configPath);
  const outputDir = path.resolve(project.workspace.root, project.workspace.config.output.dir);
  const assetsDir = path.join(outputDir, project.workspace.config.output.assetsDir);
  const findings = [...project.findings, ...validateProjectContracts(project)];
  const canWriteOutput = !findings.some((item) => item.id.startsWith("config.unsafeOutput"));

  if (canWriteOutput && project.workspace.config.output.clean) {
    await cleanDir(outputDir);
  }

  const routesRendered = [];
  const outputFiles: string[] = [];
  if (canWriteOutput && !findings.some((item) => item.blocking)) {
    for (const route of project.routes) {
      const page = project.pages.find((item) => item.id === route.id);
      if (!page) continue;
      const rendered = renderRouteHtml(project, page);
      for (const error of rendered.templateErrors) {
        findings.push(
          finding({
            id: "theme.templateSyntax",
            severity: "error",
            category: "theme",
            route: page.path,
            file: page.sourceFile,
            message: error,
            repair: { priority: 1, type: "fix-template", message: "Fix the unmatched or unsupported template marker." }
          })
        );
      }
      if (rendered.templateErrors.length) continue;
      const outputPath = routeOutputPath(outputDir, route);
      await writeText(outputPath, rendered.html);
      outputFiles.push(toPosix(path.relative(project.workspace.root, outputPath)));
      routesRendered.push(route);
    }
  }

  const ignoredSourceDirs = [
    path.join(project.workspace.root, ".git"),
    path.join(project.workspace.root, "node_modules"),
    path.join(project.workspace.root, "dist"),
    path.resolve(project.workspace.root, "reports"),
    outputDir
  ];
  const sourceFiles = await listFilesRecursive(project.workspace.root, { ignoreDirs: ignoredSourceDirs });
  const blocksUsed = unique(project.pages.flatMap((page) => page.sections.map((section) => section.block)));
  const manifest = {
    draftpineVersion: "3.0.0",
    sourceMode: "pages",
    activeTheme: project.theme.id,
    sourceHashes: await hashSources(project.workspace.root, sourceFiles),
    routesRendered: routesRendered.map((route) => route.path),
    pagesRendered: routesRendered.map((route) => route.sourceFile),
    blocksUsed,
    cssAssets: ["assets/draftpine.css"],
    jsAssets: ["assets/draftpine.js"],
    warnings: findings.filter((item) => item.severity === "warning"),
    outputFiles
  };
  if (canWriteOutput) {
    const css = await bundleCss(project);
    const nav = project.routes.map((route) => ({ label: route.navLabel ?? route.title, path: route.path }));
    await writeText(path.join(assetsDir, "draftpine.css"), css);
    await writeText(path.join(assetsDir, "draftpine.js"), `${siteDataJs(nav)}\n${runtimeJs}`);
    outputFiles.push(toPosix(path.relative(project.workspace.root, path.join(assetsDir, "draftpine.css"))));
    outputFiles.push(toPosix(path.relative(project.workspace.root, path.join(assetsDir, "draftpine.js"))));
    manifest.outputFiles = outputFiles;
    await writeJson(path.join(outputDir, "draftpine.manifest.json"), manifest);
    outputFiles.push(toPosix(path.relative(project.workspace.root, path.join(outputDir, "draftpine.manifest.json"))));
  }

  return {
    project,
    artifact: {
      outputDir,
      routesRendered,
      outputFiles,
      cssAssets: ["assets/draftpine.css"],
      jsAssets: ["assets/draftpine.js"],
      warnings: findings.filter((item) => item.severity === "warning")
    },
    findings
  };
}

export function validateProjectContracts(project: Project): Finding[] {
  const findings: Finding[] = [];
  const outputDir = path.resolve(project.workspace.root, project.workspace.config.output.dir);
  const assetsDir = path.resolve(outputDir, project.workspace.config.output.assetsDir);
  const configFile = toPosix(path.relative(project.workspace.root, project.workspace.configPath));
  const sourceDirs = [
    path.resolve(project.workspace.root, project.workspace.config.source.pagesDir),
    path.resolve(project.workspace.root, project.workspace.config.source.themesDir)
  ];

  if (outputDir === project.workspace.root || !isPathInside(project.workspace.root, outputDir)) {
    findings.push(
      finding({
        id: "config.unsafeOutputDir",
        severity: "error",
        category: "source",
        file: configFile,
        message: "output.dir must stay inside the workspace and cannot be the workspace root.",
        repair: { priority: 1, type: "edit-json", file: configFile, message: "Set output.dir to a generated directory such as prototype." }
      })
    );
  } else {
    for (const sourceDir of sourceDirs) {
      if (isPathInside(sourceDir, outputDir) || isPathInside(outputDir, sourceDir)) {
        findings.push(
          finding({
            id: "config.unsafeOutputDir",
            severity: "error",
            category: "source",
            file: configFile,
            message: "output.dir must not overlap source pages or theme directories.",
            repair: { priority: 1, type: "edit-json", file: configFile, message: "Set output.dir outside pages/ and themes/, for example prototype." }
          })
        );
        break;
      }
    }
  }

  if (!isPathInside(outputDir, assetsDir)) {
    findings.push(
      finding({
        id: "config.unsafeOutputAssetsDir",
        severity: "error",
        category: "source",
        file: configFile,
        message: "output.assetsDir must stay inside output.dir.",
        repair: { priority: 1, type: "edit-json", file: configFile, message: "Use a relative assets directory such as assets." }
      })
    );
  }

  for (const route of project.routes) {
    const page = project.pages.find((item) => item.id === route.id);
    if (!page) continue;
    const visibleSections = page.sections.filter((section) => section.visibility !== "hidden");
    if (!visibleSections.length) {
      findings.push(
        finding({
          id: "source.noVisibleSections",
          severity: "error",
          category: "source",
          file: page.sourceFile,
          route: page.path,
          message: "Page has no visible sections."
        })
      );
    }
    if (page.primaryAction && !visibleSections.some((section) => JSON.stringify(section.props).includes(page.primaryAction?.label ?? ""))) {
      findings.push(
        finding({
          id: "composition.primaryActionNotRendered",
          severity: "warning",
          category: "composition",
          file: page.sourceFile,
          route: page.path,
          message: "Page declares a primary action, but no section props include the action label.",
          blocking: false
        })
      );
    }
  }
  return findings;
}

async function bundleCss(project: Project): Promise<string> {
  const chunks = [baseCss];
  if (project.theme.styles) chunks.push(project.theme.styles);
  return `${chunks.join("\n\n")}\n`;
}

async function hashSources(root: string, files: string[]): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  for (const file of files) {
    if (file.includes(`${path.sep}.git${path.sep}`) || file.includes(`${path.sep}node_modules${path.sep}`)) continue;
    if (file.includes(`${path.sep}prototype${path.sep}`) || file.includes(`${path.sep}reports${path.sep}`)) continue;
    const hash = createHash("sha256").update(await readText(file)).digest("hex");
    hashes[toPosix(path.relative(root, file))] = hash;
  }
  return hashes;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

const baseCss = `:root {
  --dp-font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --dp-bg: #ffffff;
  --dp-surface: #ffffff;
  --dp-surface-muted: #fafafa;
  --dp-text: #09090b;
  --dp-muted: #71717a;
  --dp-line: #e4e4e7;
  --dp-accent: #0070f3;
  --dp-accent-strong: #005bd1;
  --dp-radius: 8px;
  --pico-font-family: var(--dp-font);
  --pico-primary: var(--dp-accent);
  --pico-primary-hover: var(--dp-accent-strong);
  --pico-border-radius: var(--dp-radius);
}
[data-theme="dark"] {
  --dp-bg: #050505;
  --dp-surface: #0a0a0a;
  --dp-surface-muted: #111113;
  --dp-text: #fafafa;
  --dp-muted: #a1a1aa;
  --dp-line: #27272a;
  --dp-accent: #52a8ff;
  --dp-accent-strong: #8cc8ff;
}
html { font-family: var(--dp-font); background: var(--dp-bg); color: var(--dp-text); }
body { margin: 0; background: var(--dp-bg); color: var(--dp-text); }
.dp-container { width: min(1180px, calc(100% - 32px)); margin-inline: auto; }
.dp-site-header { border-bottom: 1px solid var(--dp-line); background: color-mix(in srgb, var(--dp-bg) 94%, transparent); position: sticky; top: 0; z-index: 10; }
.dp-site-header nav { min-height: 58px; }
.dp-site-footer { border-top: 1px solid var(--dp-line); padding: 28px 0; color: var(--dp-muted); }
.dp-site-footer nav, .dp-site-footer ul, .dp-site-footer li { display: block; margin: 0; padding: 0; }
.dp-site-footer ul { list-style: none; display: flex; gap: 14px; flex-wrap: wrap; }
.dp-section { padding: clamp(36px, 6vw, 76px) 0; }
.dp-panel, .dp-card, .dp-metric, .dp-price, .dp-callout { background: var(--dp-surface); border: 1px solid var(--dp-line); border-radius: var(--dp-radius); }
.dp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; }
.dp-stack { display: grid; gap: 16px; }
.dp-eyebrow { color: var(--dp-accent); font-weight: 700; margin-bottom: 8px; }
.dp-muted { color: var(--dp-muted); }
table { min-width: 100%; }
@media (max-width: 720px) {
  .dp-site-header nav, .dp-site-header ul { align-items: flex-start; }
  .dp-site-nav-links { max-width: 100%; overflow-x: auto; }
}
`;
