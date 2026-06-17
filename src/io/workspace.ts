import path from "node:path";
import type { DraftpineConfig, Project, Recipe, RoutesFile, Workspace } from "../domain/types.js";
import { finding } from "../domain/findings.js";
import { configSchema, recipeSchema, routesFileSchema } from "../schemas/sourceSchemas.js";
import { loadRegistry } from "../registry/registry.js";
import { pathExists, readJson } from "./fs.js";

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
  const routesPath = path.resolve(workspace.root, workspace.config.source.routes);
  const routesRaw = await readJson<unknown>(routesPath);
  const routesFile = routesFileSchema.parse(routesRaw) as RoutesFile;
  const registry = await loadRegistry(workspace);
  const recipes = new Map<string, Recipe>();
  const content = new Map<string, Record<string, unknown>>();

  for (const route of routesFile.routes) {
    if (route.recipe) {
      const recipePath = path.resolve(workspace.root, route.recipe);
      if (await pathExists(recipePath)) {
        const recipe = recipeSchema.parse(await readJson<unknown>(recipePath)) as Recipe;
        recipes.set(route.id, recipe);
      } else {
        findings.push(
          finding({
            id: "source.missingRecipe",
            severity: "error",
            category: "source",
            route: route.path,
            file: route.recipe,
            message: `Route ${route.id} references a missing recipe.`
          })
        );
      }
    }

    if (route.content) {
      const contentPath = path.resolve(workspace.root, route.content);
      if (await pathExists(contentPath)) {
        content.set(route.id, await readJson<Record<string, unknown>>(contentPath));
      } else {
        findings.push(
          finding({
            id: "source.missingContent",
            severity: "error",
            category: "source",
            route: route.path,
            file: route.content,
            message: `Route ${route.id} references a missing content file.`
          })
        );
      }
    }
  }

  return {
    workspace,
    routes: routesFile.routes,
    recipes,
    content,
    registry,
    findings
  };
}
