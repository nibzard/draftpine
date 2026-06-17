import path from "node:path";
import type { Finding, Project } from "../domain/types.js";
import { finding } from "../domain/findings.js";
import { listFilesRecursive, pathExists, readText, toPosix } from "../io/fs.js";
import { loadProject } from "../io/workspace.js";
import { validateProjectContracts } from "../compiler/compiler.js";

export async function check(configPath = "draftpine.config.json", scope: "source" | "generated" | "all" = "all"): Promise<{ project: Project; findings: Finding[] }> {
  const project = await loadProject(configPath);
  const findings = [...project.findings, ...validateProjectContracts(project)];
  findings.push(...(await checkProjectOverrides(project)));
  if (scope !== "source") {
    findings.push(...(await checkGenerated(project)));
  }
  findings.push(...(await checkExtensionFixtures(project)));
  return { project, findings };
}

async function checkProjectOverrides(project: Project): Promise<Finding[]> {
  const overrides = project.workspace.config.source.overrides;
  if (!overrides) return [];
  const overridesPath = path.resolve(project.workspace.root, overrides);
  if (!(await pathExists(overridesPath))) {
    return [
      finding({
        id: "source.missingOverrides",
        severity: "error",
        category: "source",
        file: overrides,
        message: `Configured project CSS overrides file ${overrides} is missing.`
      })
    ];
  }
  const css = await readText(overridesPath);
  return checkCssRestrictions(project, css, overridesPath, "override", "project.overrides");
}

async function checkGenerated(project: Project): Promise<Finding[]> {
  const findings: Finding[] = [];
  const outputDir = path.resolve(project.workspace.root, project.workspace.config.output.dir);
  const assetsDir = path.join(outputDir, project.workspace.config.output.assetsDir);
  if (!(await pathExists(outputDir))) {
    findings.push(
      finding({
        id: "generated.missingOutputDir",
        severity: "error",
        category: "compile",
        message: `Generated output directory ${project.workspace.config.output.dir} does not exist. Run draftpine generate.`
      })
    );
    return findings;
  }
  for (const required of ["draftpine.css", "draftpine.js"]) {
    if (!(await pathExists(path.join(assetsDir, required)))) {
      findings.push(
        finding({
          id: "generated.missingAsset",
          severity: "error",
          category: "compile",
          file: toPosix(path.relative(project.workspace.root, path.join(assetsDir, required))),
          message: `Generated asset ${required} is missing.`
        })
      );
    }
  }

  const files = await listFilesRecursive(outputDir);
  for (const file of files) {
    const relative = toPosix(path.relative(project.workspace.root, file));
    if (/\.(ts|tsx|jsx|vue|svelte)$/.test(file)) {
      findings.push(
        finding({
          id: "generated.disallowedFrameworkArtifact",
          severity: "error",
          category: "compile",
          file: relative,
          message: "Generated output must remain static HTML/CSS/JS and cannot include framework source files."
        })
      );
    }
    if (file.endsWith(".html")) {
      const html = await readText(file);
      if (!html.includes("<!doctype html>")) {
        findings.push(finding({ id: "generated.missingDoctype", severity: "error", category: "compile", file: relative, message: "Generated HTML is missing <!doctype html>." }));
      }
      if (!html.includes("data-draftpine-action=\"primary\"")) {
        findings.push(
          finding({
            id: "generated.missingPrimaryActionMarker",
            severity: "error",
            category: "composition",
            file: relative,
            message: "Generated route is missing data-draftpine-action=\"primary\"."
          })
        );
      }
      if (/href="\/(?!\/)/.test(html) || /src="\/(?!\/)/.test(html)) {
        findings.push(
          finding({
            id: "generated.rootAbsoluteLocalPath",
            severity: "error",
            category: "route",
            file: relative,
            message: "Generated output should use relative local paths for GitHub Pages safety."
          })
        );
      }
      findings.push(...(await checkLocalLinks(project, file, html)));
    }
  }

  for (const route of project.routes.filter((item) => item.status !== "hidden" && item.status !== "deprecated")) {
    const routeFile = path.join(outputDir, route.file);
    if (!(await pathExists(routeFile))) {
      findings.push(
        finding({
          id: "generated.missingRouteFile",
          severity: "error",
          category: "compile",
          route: route.path,
          file: toPosix(path.relative(project.workspace.root, routeFile)),
          message: `Route file for ${route.path} is missing.`
        })
      );
    }
  }
  return findings;
}

async function checkLocalLinks(project: Project, htmlFile: string, html: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const outputDir = path.resolve(project.workspace.root, project.workspace.config.output.dir);
  const hrefs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    if (!href || href.startsWith("#") || /^[a-z]+:/i.test(href) || href.startsWith("//")) continue;
    if (href.includes("cdn.jsdelivr.net") || href.includes("fonts.googleapis.com") || href.includes("fonts.gstatic.com")) continue;
    const withoutHash = href.split("#")[0].split("?")[0];
    const target = withoutHash.endsWith("/")
      ? path.resolve(path.dirname(htmlFile), withoutHash, "index.html")
      : path.resolve(path.dirname(htmlFile), withoutHash);
    const resolved = target.startsWith(outputDir) ? target : path.resolve(outputDir, "index.html");
    if (!(await pathExists(resolved))) {
      findings.push(
        finding({
          id: "route.brokenLocalLink",
          severity: "error",
          category: "route",
          file: toPosix(path.relative(project.workspace.root, htmlFile)),
          message: `Local link ${href} does not resolve to a generated file.`,
          evidence: { href, resolved: toPosix(path.relative(project.workspace.root, resolved)) }
        })
      );
    }
  }
  return findings;
}

async function checkExtensionFixtures(project: Project): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const primitive of project.registry.primitives.values()) {
    if (primitive.manifest.namespace === "core") continue;
    for (const required of ["demo.json", "eval.json", "README.md", "template.html", "styles.css"]) {
      if (!(await pathExists(path.join(primitive.dir, required)))) {
        findings.push(
          finding({
            id: "extension.missingPrimitiveFixture",
            severity: "error",
            category: "primitive",
            primitive: primitive.id,
            file: toPosix(path.relative(project.workspace.root, path.join(primitive.dir, required))),
            message: `Primitive extension ${primitive.id} is missing ${required}.`
          })
        );
      }
    }
    if (primitive.styles) {
      findings.push(...checkCssRestrictions(project, primitive.styles, primitive.dir, "primitive", primitive.id));
    }
  }
  for (const layout of project.registry.layouts.values()) {
    if (layout.manifest.namespace === "core") continue;
    for (const required of ["demo.json", "eval.json", "README.md", "template.html", "styles.css"]) {
      if (!(await pathExists(path.join(layout.dir, required)))) {
        findings.push(
          finding({
            id: "extension.missingLayoutFixture",
            severity: "error",
            category: "layout",
            layout: layout.id,
            file: toPosix(path.relative(project.workspace.root, path.join(layout.dir, required))),
            message: `Layout extension ${layout.id} is missing ${required}.`
          })
        );
      }
    }
    if (layout.styles) {
      findings.push(...checkCssRestrictions(project, layout.styles, layout.dir, "layout", layout.id));
    }
  }
  return findings;
}

function checkCssRestrictions(project: Project, css: string, fileOrDir: string, category: "primitive" | "layout" | "override", id: string): Finding[] {
  const findings: Finding[] = [];
  const rules = [
    { id: "css.width100vw", pattern: /width\s*:\s*100vw\b/, message: "CSS must not use width: 100vw because it commonly creates mobile overflow." },
    { id: "css.negativeMargin", pattern: /margin(?:-[\w-]+)?\s*:\s*-[\d.]/, message: "CSS must not use negative margins without an explicit exception." },
    { id: "css.fixedWideWidth", pattern: /(^|[;{\s])width\s*:\s*(?:[4-9]\d{2,}|\d{4,})px\b/, message: "CSS must not use fixed widths above mobile viewport without max-width containment." }
  ];
  if (category === "primitive") {
    rules.push({ id: "css.rawGridTemplateColumns", pattern: /grid-template-columns\s*:/, message: "Primitive CSS must use layout primitives instead of raw grid-template-columns." });
  }
  if (category === "override") {
    rules.push({ id: "css.overrideGlobalElement", pattern: /(^|})\s*(body|html|section|article|main|header|footer)\s*\{/m, message: "Project override CSS must target Draftpine classes or data attributes, not global elements." });
  }
  const file = category === "override" ? fileOrDir : path.join(fileOrDir, "styles.css");
  for (const rule of rules) {
    if (rule.pattern.test(css)) {
      findings.push(
        finding({
          id: rule.id,
          severity: "error",
          category: category === "override" ? "compile" : category,
          file: toPosix(path.relative(project.workspace.root, file)),
          ...(category === "override" ? {} : { [category]: id }),
          message: rule.message,
          repair: {
            priority: 2,
            type: "fix-css",
            file: toPosix(path.relative(project.workspace.root, file)),
            message: "Move spatial behavior into a layout primitive or add a scoped exception when truly necessary."
          }
        })
      );
    }
  }
  return findings;
}
