import path from "node:path";
import { createHash } from "node:crypto";
import type { CompileArtifact, Finding, Project, Recipe } from "../domain/types.js";
import { finding } from "../domain/findings.js";
import { cleanDir, listFilesRecursive, pathExists, readText, toPosix, writeJson, writeText } from "../io/fs.js";
import { loadProject } from "../io/workspace.js";
import { renderRouteHtml, routeOutputPath } from "./html.js";
import { runtimeJs, siteDataJs } from "../runtime/runtime.js";

export async function generate(configPath = "draftpine.config.json"): Promise<{ project: Project; artifact: CompileArtifact; findings: Finding[] }> {
  const project = await loadProject(configPath);
  const outputDir = path.resolve(project.workspace.root, project.workspace.config.output.dir);
  const assetsDir = path.join(outputDir, project.workspace.config.output.assetsDir);
  const findings = [...project.findings, ...validateProjectContracts(project)];

  if (project.workspace.config.output.clean) {
    await cleanDir(outputDir);
  }

  const routesRendered = [];
  const outputFiles: string[] = [];
  if (!findings.some((item) => item.blocking)) {
    for (const route of project.routes.filter((item) => item.status !== "hidden" && item.status !== "deprecated")) {
      const recipe = project.recipes.get(route.id);
      if (!recipe) continue;
      const html = renderRouteHtml(project, route, recipe);
      const outputPath = routeOutputPath(outputDir, route);
      await writeText(outputPath, html);
      outputFiles.push(toPosix(path.relative(project.workspace.root, outputPath)));
      routesRendered.push(route);
    }
  }

  const css = await bundleCss(project);
  const nav = project.routes
    .filter((route) => route.status !== "hidden" && route.status !== "deprecated")
    .map((route) => ({ label: route.title, path: route.path }));
  await writeText(path.join(assetsDir, "draftpine.css"), css);
  await writeText(path.join(assetsDir, "draftpine.js"), `${siteDataJs(nav)}\n${runtimeJs}`);
  outputFiles.push(toPosix(path.relative(project.workspace.root, path.join(assetsDir, "draftpine.css"))));
  outputFiles.push(toPosix(path.relative(project.workspace.root, path.join(assetsDir, "draftpine.js"))));

  const sourceFiles = await listFilesRecursive(project.workspace.root);
  const manifest = {
    compileTimestamp: new Date().toISOString(),
    draftpineVersion: "2.0.0",
    sourceHashes: await hashSources(project.workspace.root, sourceFiles),
    routesRendered: routesRendered.map((route) => route.path),
    primitivesUsed: unique([...project.recipes.values()].flatMap((recipe) => recipe.sections.map((section) => section.primitive))),
    layoutsUsed: unique(
      [...project.recipes.values()].flatMap((recipe) => [
        ...recipe.sections.map((section) => section.layout),
        ...(recipe.pageLayout ? [recipe.pageLayout] : [])
      ])
    ),
    cssAssets: ["assets/draftpine.css"],
    jsAssets: ["assets/draftpine.js"],
    warnings: findings.filter((item) => item.severity === "warning"),
    outputFiles
  };
  await writeJson(path.join(outputDir, "draftpine.manifest.json"), manifest);
  outputFiles.push(toPosix(path.relative(project.workspace.root, path.join(outputDir, "draftpine.manifest.json"))));

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

  if (
    project.workspace.config.routeBudget.largePrototypeRequiresApproval &&
    project.routes.filter((route) => route.status !== "hidden" && route.status !== "deprecated").length >
      project.workspace.config.routeBudget.defaultMaxRoutes
  ) {
    findings.push(
      finding({
        id: "route.budgetExceeded",
        severity: "error",
        category: "route",
        message: `Route count exceeds defaultMaxRoutes (${project.workspace.config.routeBudget.defaultMaxRoutes}).`,
        repair: {
          priority: 1,
          type: "reduce-routes",
          file: project.workspace.config.source.routes,
          message: "Generate representative routes first or increase the route budget intentionally."
        }
      })
    );
  }

  for (const route of project.routes) {
    const recipe = project.recipes.get(route.id);
    const contract = project.registry.routeTypes.get(route.routeType);
    if (!recipe || !contract) continue;
    if (recipe.routeId !== route.id || recipe.routeType !== route.routeType) {
      findings.push(
        finding({
          id: "source.recipeRouteMismatch",
          severity: "error",
          category: "source",
          route: route.path,
          file: route.recipe,
          message: `Recipe for ${route.id} does not match the route id/type.`,
          repair: {
            priority: 1,
            type: "edit-json",
            file: route.recipe,
            message: "Set routeId and routeType to match routes.json."
          }
        })
      );
    }

    const primitiveIds = recipe.sections.map((section) => section.primitive);
    for (const primitiveId of primitiveIds) {
      if (!project.registry.primitives.has(primitiveId)) {
        findings.push(
          finding({
            id: "registry.missingPrimitive",
            severity: "error",
            category: "primitive",
            route: route.path,
            file: route.recipe,
            primitive: primitiveId,
            message: `Primitive ${primitiveId} does not exist in the registry.`
          })
        );
      }
    }
    for (const section of recipe.sections) {
      if (!project.registry.layouts.has(section.layout)) {
        findings.push(
          finding({
            id: "registry.missingLayout",
            severity: "error",
            category: "layout",
            route: route.path,
            file: route.recipe,
            layout: section.layout,
            message: `Layout ${section.layout} does not exist in the registry.`
          })
        );
      }
    }
    if (recipe.pageLayout && !project.registry.layouts.has(recipe.pageLayout)) {
      findings.push(
        finding({
          id: "registry.missingLayout",
          severity: "error",
          category: "layout",
          route: route.path,
          file: route.recipe,
          layout: recipe.pageLayout,
          message: `Page layout ${recipe.pageLayout} does not exist in the registry.`
        })
      );
    }
    for (const requiredPrimitive of contract.requiredPrimitives) {
      if (!primitiveIds.includes(requiredPrimitive)) {
        findings.push(
          finding({
            id: "route.missingRequiredPrimitive",
            severity: "error",
            category: "composition",
            route: route.path,
            file: route.recipe,
            primitive: requiredPrimitive,
            message: `${route.routeType} routes require ${requiredPrimitive}.`,
            repair: {
              priority: 1,
              type: "change-recipe",
              file: route.recipe,
              message: `Add a section that uses ${requiredPrimitive}.`
            }
          })
        );
      }
    }
    for (const forbiddenPrimitive of contract.forbiddenPrimitives) {
      if (primitiveIds.includes(forbiddenPrimitive)) {
        findings.push(
          finding({
            id: "route.forbiddenPrimitive",
            severity: "error",
            category: "composition",
            route: route.path,
            file: route.recipe,
            primitive: forbiddenPrimitive,
            message: `${route.routeType} routes must not use ${forbiddenPrimitive}.`
          })
        );
      }
    }
  }

  const fingerprints = new Map<string, string[]>();
  for (const route of project.routes) {
    const recipe = project.recipes.get(route.id);
    if (!recipe || route.status === "hidden" || route.status === "deprecated") continue;
    const fingerprint = [
      route.routeType,
      recipe.sections.map((section) => section.primitive).join(">"),
      recipe.sections.map((section) => section.layout).join(">"),
      recipe.pageLayout ?? "",
      (recipe.interactions ?? []).sort().join(",")
    ].join("|");
    fingerprints.set(fingerprint, [...(fingerprints.get(fingerprint) ?? []), route.path]);
  }
  for (const routes of fingerprints.values()) {
    if (routes.length > 2) {
      findings.push(
        finding({
          id: "route.repetitiveFingerprint",
          severity: "warning",
          category: "differentiation",
          message: `Multiple routes share the same route type, primitive sequence, layout sequence, and interaction set: ${routes.join(", ")}.`,
          evidence: { routes },
          blocking: false,
          repair: {
            priority: 3,
            type: "change-recipe",
            message: "Vary route recipes by route type and purpose instead of duplicating the same shell."
          }
        })
      );
    }
  }

  return findings;
}

async function bundleCss(project: Project): Promise<string> {
  const usedPrimitiveIds = unique([...project.recipes.values()].flatMap((recipe: Recipe) => recipe.sections.map((section) => section.primitive)));
  const usedLayoutIds = unique(
    [...project.recipes.values()].flatMap((recipe: Recipe) => [
      ...recipe.sections.map((section) => section.layout),
      ...(recipe.pageLayout ? [recipe.pageLayout] : [])
    ])
  );
  const chunks = [await readText(path.resolve((await findPackageCoreDir()), "tokens/draftpine.css"))];
  for (const layoutId of usedLayoutIds) {
    const layout = project.registry.layouts.get(layoutId);
    if (layout?.styles) chunks.push(layout.styles);
  }
  for (const primitiveId of usedPrimitiveIds) {
    const primitive = project.registry.primitives.get(primitiveId);
    if (primitive?.styles) chunks.push(primitive.styles);
  }
  const overrides = project.workspace.config.source.overrides;
  if (overrides) {
    const overridesPath = path.resolve(project.workspace.root, overrides);
    if (await pathExists(overridesPath)) {
      chunks.push(await readText(overridesPath));
    }
  }
  return `${chunks.join("\n\n")}\n`;
}

async function findPackageCoreDir(): Promise<string> {
  let current = path.resolve(import.meta.dirname);
  for (let index = 0; index < 8; index += 1) {
    const candidate = path.resolve(current, "core");
    if (await pathExists(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(process.cwd(), "core");
}

async function hashSources(root: string, files: string[]): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  for (const file of files) {
    if (file.includes(`${path.sep}.git${path.sep}`) || file.includes(`${path.sep}node_modules${path.sep}`)) continue;
    if (file.includes(`${path.sep}prototype${path.sep}`) || file.includes(`${path.sep}reports${path.sep}`)) continue;
    if (!(await pathExists(file))) continue;
    const hash = createHash("sha256").update(await readText(file)).digest("hex");
    hashes[toPosix(path.relative(root, file))] = hash;
  }
  return hashes;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
