import path from "node:path";
import type { Finding, Project } from "../domain/types.js";
import { finding } from "../domain/findings.js";
import { isPathInside, listFilesRecursive, pathExists, readText, toPosix } from "../io/fs.js";
import { loadProject } from "../io/workspace.js";
import { validateProjectContracts } from "../compiler/compiler.js";

export async function check(configPath = "draftpine.config.json", scope: "source" | "generated" | "all" = "all"): Promise<{ project: Project; findings: Finding[] }> {
  const project = await loadProject(configPath);
  const findings = [...project.findings, ...validateProjectContracts(project)];
  findings.push(...(await checkThemeSafety(project)));
  if (scope !== "source" && !findings.some((item) => item.id.startsWith("config.unsafeOutput"))) {
    findings.push(...(await checkGenerated(project)));
  }
  return { project, findings };
}

async function checkThemeSafety(project: Project): Promise<Finding[]> {
  const findings: Finding[] = [];
  const htmlFiles: Array<{ file: string; html: string; block?: string }> = [
    ...(project.theme.shellFile ? [{ file: project.theme.shellFile, html: project.theme.shell ?? "" }] : []),
    ...[...project.theme.blocks.values()].map((block) => ({ file: block.sourceFile, html: block.template, block: block.name }))
  ];

  for (const item of htmlFiles) {
    if (item.block && /<script[\s>]/i.test(item.html)) {
      findings.push(themeFinding("theme.scriptTag", item.file, "Theme shell and blocks must not include script tags.", item.block));
    }
    if (/\son[a-z]+\s*=/i.test(item.html)) {
      findings.push(themeFinding("theme.inlineEventHandler", item.file, "Inline event handlers are disallowed in theme HTML.", item.block));
    }
    if (/(?:href|src)=["']\/(?!\/)/i.test(item.html)) {
      findings.push(themeFinding("theme.rootAbsoluteLocalPath", item.file, "Theme HTML must use relative local paths for GitHub Pages safety.", item.block));
    }
    if (/\bfetch\s*\(/i.test(item.html)) {
      findings.push(themeFinding("theme.remoteFetch", item.file, "Theme HTML must not call fetch or remote APIs.", item.block));
    }
  }

  if (project.theme.styles) {
    findings.push(...checkCssRestrictions(project.theme.styles, project.theme.stylesFile ?? project.theme.sourceFile));
  }

  return findings;
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
      if (/\{\{[#/^!]?\s*[\w.]+\s*}}/.test(html)) {
        findings.push(
          finding({
            id: "content.unresolvedTemplateMarker",
            severity: "error",
            category: "content",
            file: relative,
            message: "Generated output contains unresolved template markers."
          })
        );
      }
      findings.push(...(await checkLocalLinks(project, file, html)));
    }
  }

  for (const route of project.routes) {
    const routeFile = path.join(outputDir, route.file);
    if (!(await pathExists(routeFile))) {
      findings.push(
        finding({
          id: "generated.missingRouteFile",
          severity: "error",
          category: "compile",
          route: route.path,
          file: toPosix(path.relative(project.workspace.root, routeFile)),
          message: `Route file for ${route.path} is missing.`,
          repair: { priority: 1, type: "edit-json", file: route.sourceFile, message: "Run generate and fix any source errors for this page." }
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
    if (!isPathInside(outputDir, target)) {
      findings.push(
        finding({
          id: "route.localLinkEscapesOutput",
          severity: "error",
          category: "route",
          file: toPosix(path.relative(project.workspace.root, htmlFile)),
          message: `Local link ${href} escapes the generated output directory.`,
          evidence: { href, resolved: toPosix(path.relative(project.workspace.root, target)) }
        })
      );
      continue;
    }
    if (!(await pathExists(target))) {
      findings.push(
        finding({
          id: "route.brokenLocalLink",
          severity: "error",
          category: "route",
          file: toPosix(path.relative(project.workspace.root, htmlFile)),
          message: `Local link ${href} does not resolve to a generated file.`,
          evidence: { href, resolved: toPosix(path.relative(project.workspace.root, target)) }
        })
      );
    }
  }
  return findings;
}

function checkCssRestrictions(css: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const rules = [
    { id: "css.width100vw", pattern: /width\s*:\s*100vw\b/, message: "Theme CSS must not use width: 100vw because it commonly creates mobile overflow." },
    { id: "css.negativeMargin", pattern: /margin(?:-[\w-]+)?\s*:\s*-[\d.]/, message: "Theme CSS must not use negative margins without an explicit exception." },
    { id: "css.fixedWideWidth", pattern: /(^|[;{\s])width\s*:\s*(?:[4-9]\d{2,}|\d{4,})px\b/, message: "Theme CSS must not use fixed widths above mobile viewport without max-width containment." },
    { id: "css.rootAbsoluteAsset", pattern: /url\(["']?\/(?!\/)/, message: "Theme CSS must not use root-absolute local asset URLs." }
  ];
  for (const rule of rules) {
    if (rule.pattern.test(css)) {
      findings.push(
        finding({
          id: rule.id,
          severity: "error",
          category: "theme",
          file,
          message: rule.message,
          repair: { priority: 2, type: "fix-css", file, message: "Constrain the CSS with responsive max-widths and relative assets." }
        })
      );
    }
  }
  return findings;
}

function themeFinding(id: string, file: string, message: string, block?: string): Finding {
  return finding({
    id,
    severity: "error",
    category: "theme",
    file,
    block,
    message,
    repair: { priority: 1, type: "fix-template", file, message: "Edit this theme file to use static, relative, declarative HTML." }
  });
}
