import path from "node:path";
import type { DraftpineConfig, LoadedBlock, LoadedTheme, Page, Project, Route, ThemeConfig, Workspace } from "../domain/types.js";
import { finding } from "../domain/findings.js";
import { configSchema, pageSchema, themeSchema } from "../schemas/sourceSchemas.js";
import { listFilesRecursive, pathExists, readJson, readText, toPosix } from "./fs.js";

export async function discoverWorkspace(configPath = "draftpine.config.json"): Promise<Workspace> {
  const root = process.cwd();
  const fullConfigPath = path.resolve(root, configPath);
  const raw = await readJson<unknown>(fullConfigPath);
  const config = configSchema.parse(raw) as DraftpineConfig;
  return { root, configPath: fullConfigPath, config };
}

export async function loadProject(configPath = "draftpine.config.json"): Promise<Project> {
  const workspace = await discoverWorkspace(configPath);
  const findings = [];
  const { pages, findings: pageFindings } = await loadPages(workspace);
  findings.push(...pageFindings);
  const { theme, findings: themeFindings } = await loadTheme(workspace);
  findings.push(...themeFindings);
  findings.push(...validatePagesAgainstTheme(workspace, pages, theme));

  const routes = pages
    .filter((page) => page.status !== "hidden" && page.status !== "deprecated")
    .sort((left, right) => left.priority - right.priority || left.path.localeCompare(right.path))
    .map<Route>((page) => ({
      id: page.id,
      path: page.path,
      title: page.title,
      type: page.type,
      file: page.outputFile,
      sourceFile: page.sourceFile,
      priority: page.priority,
      status: page.status,
      navLabel: page.navLabel
    }));

  return { workspace, pages, routes, theme, findings };
}

async function loadPages(workspace: Workspace): Promise<{ pages: Page[]; findings: ReturnType<typeof finding>[] }> {
  const findings: ReturnType<typeof finding>[] = [];
  const pagesDir = path.resolve(workspace.root, workspace.config.source.pagesDir);
  if (!(await pathExists(pagesDir))) {
    return {
      pages: [],
      findings: [
        finding({
          id: "source.missingPagesDir",
          severity: "error",
          category: "source",
          file: workspace.config.source.pagesDir,
          message: `Configured pages directory ${workspace.config.source.pagesDir} is missing.`
        })
      ]
    };
  }

  const pageFiles = (await listFilesRecursive(pagesDir)).filter((file) => file.endsWith(".json")).sort();
  const pages: Page[] = [];
  for (const file of pageFiles) {
    const relative = toPosix(path.relative(workspace.root, file));
    const raw = await readJson<unknown>(file);
    const result = pageSchema.safeParse(raw);
    if (!result.success) {
      findings.push(
        finding({
          id: "source.invalidPage",
          severity: "error",
          category: "source",
          file: relative,
          message: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ")
        })
      );
      continue;
    }
    pages.push({
      ...result.data,
      sourceFile: relative,
      outputFile: routeOutputFile(result.data.path)
    });
  }

  const ids = new Map<string, string>();
  const paths = new Map<string, string>();
  for (const page of pages) {
    const duplicateId = ids.get(page.id);
    if (duplicateId) {
      findings.push(
        finding({
          id: "source.duplicatePageId",
          severity: "error",
          category: "source",
          file: page.sourceFile,
          route: page.path,
          message: `Page id ${page.id} is already used by ${duplicateId}.`
        })
      );
    }
    const duplicatePath = paths.get(page.path);
    if (duplicatePath) {
      findings.push(
        finding({
          id: "source.duplicatePagePath",
          severity: "error",
          category: "source",
          file: page.sourceFile,
          route: page.path,
          message: `Page path ${page.path} is already used by ${duplicatePath}.`
        })
      );
    }
    ids.set(page.id, page.sourceFile);
    paths.set(page.path, page.sourceFile);
  }

  if (!pages.some((page) => page.path === "/" && page.status !== "hidden" && page.status !== "deprecated")) {
    findings.push(
      finding({
        id: "source.missingHomePage",
        severity: "error",
        category: "source",
        file: workspace.config.source.pagesDir,
        message: "A v3 project must include a public page with path \"/\"."
      })
    );
  }

  return { pages, findings };
}

async function loadTheme(workspace: Workspace): Promise<{ theme: LoadedTheme; findings: ReturnType<typeof finding>[] }> {
  const findings: ReturnType<typeof finding>[] = [];
  const themeRoot = path.resolve(workspace.root, workspace.config.source.themesDir, workspace.config.source.theme);
  const themeFile = path.join(themeRoot, "theme.json");
  const relativeThemeFile = toPosix(path.relative(workspace.root, themeFile));
  let config: ThemeConfig = { schemaVersion: "3.0", name: workspace.config.source.theme, blocks: {} };

  if (!(await pathExists(themeFile))) {
    findings.push(
      finding({
        id: "theme.missingThemeFile",
        severity: "error",
        category: "theme",
        file: relativeThemeFile,
        message: `Theme ${workspace.config.source.theme} is missing theme.json.`
      })
    );
  } else {
    const result = themeSchema.safeParse(await readJson<unknown>(themeFile));
    if (result.success) {
      config = result.data;
    } else {
      findings.push(
        finding({
          id: "theme.invalidTheme",
          severity: "error",
          category: "theme",
          file: relativeThemeFile,
          message: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ")
        })
      );
    }
  }

  const theme: LoadedTheme = {
    id: workspace.config.source.theme,
    root: themeRoot,
    sourceFile: relativeThemeFile,
    config,
    blocks: new Map()
  };

  if (config.shell) {
    const resolved = resolveThemeFile(themeRoot, config.shell);
    theme.shellFile = toPosix(path.relative(workspace.root, resolved));
    if (await pathExists(resolved)) theme.shell = await readText(resolved);
    else findings.push(missingThemeAsset("theme.missingShell", theme.shellFile, "Configured shell.html is missing."));
  }
  if (config.styles) {
    const resolved = resolveThemeFile(themeRoot, config.styles);
    theme.stylesFile = toPosix(path.relative(workspace.root, resolved));
    if (await pathExists(resolved)) theme.styles = await readText(resolved);
    else findings.push(missingThemeAsset("theme.missingStyles", theme.stylesFile, "Configured styles.css is missing."));
  }

  for (const [name, metadata] of Object.entries(config.blocks)) {
    const resolved = resolveThemeFile(themeRoot, metadata.file);
    const sourceFile = toPosix(path.relative(workspace.root, resolved));
    if (!(await pathExists(resolved))) {
      findings.push(
        finding({
          id: "theme.missingBlockFile",
          severity: "error",
          category: "theme",
          file: theme.sourceFile,
          block: name,
          message: `Block ${name} points at missing file ${metadata.file}.`,
          repair: { priority: 1, type: "add-block", file: sourceFile, message: `Create ${sourceFile} or update ${theme.sourceFile}.` }
        })
      );
      continue;
    }
    theme.blocks.set(name, {
      name,
      metadata,
      sourceFile,
      template: await readText(resolved)
    } satisfies LoadedBlock);
  }

  return { theme, findings };
}

function validatePagesAgainstTheme(workspace: Workspace, pages: Page[], theme: LoadedTheme): ReturnType<typeof finding>[] {
  const findings: ReturnType<typeof finding>[] = [];
  for (const page of pages) {
    for (const [sectionIndex, section] of page.sections.entries()) {
      const block = theme.blocks.get(section.block);
      if (!block) {
        findings.push(
          finding({
            id: "theme.unknownBlock",
            severity: "error",
            category: "theme",
            file: page.sourceFile,
            route: page.path,
            block: section.block,
            message: `Section ${section.id} references unknown block ${section.block}.`,
            repair: {
              priority: 1,
              type: "edit-json",
              file: page.sourceFile,
              jsonPointer: `/sections/${sectionIndex}/block`,
              message: `Use a block registered in ${theme.sourceFile} or add a ${section.block} block.`
            }
          })
        );
        continue;
      }
      for (const prop of block.metadata.requires ?? []) {
        if (!hasDottedValue(section.props, prop)) {
          findings.push(
            finding({
              id: "theme.missingRequiredProp",
              severity: "error",
              category: "source",
              file: page.sourceFile,
              route: page.path,
              block: section.block,
              message: `Section ${section.id} is missing required prop ${prop} for block ${section.block}.`,
              repair: {
                priority: 1,
                type: "edit-json",
                file: page.sourceFile,
                jsonPointer: `/sections/${sectionIndex}/props/${prop.replaceAll(".", "/")}`,
                message: `Add ${prop} to the section props.`
              }
            })
          );
        }
      }
    }
  }
  void workspace;
  return findings;
}

function routeOutputFile(routePath: string): string {
  if (routePath === "/") return "index.html";
  return `${routePath.replace(/^\/|\/$/g, "")}/index.html`;
}

function resolveThemeFile(themeRoot: string, relativeFile: string): string {
  const resolved = path.resolve(themeRoot, relativeFile);
  if (!resolved.startsWith(themeRoot)) return path.join(themeRoot, "__invalid__");
  return resolved;
}

function missingThemeAsset(id: string, file: string, message: string): ReturnType<typeof finding> {
  return finding({ id, severity: "error", category: "theme", file, message });
}

function hasDottedValue(value: Record<string, unknown>, key: string): boolean {
  const result = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) return (current as Record<string, unknown>)[part];
    return undefined;
  }, value);
  return result !== undefined && result !== null && result !== "";
}
