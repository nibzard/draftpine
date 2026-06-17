import path from "node:path";
import type { LayoutManifest, PrimitiveManifest, Registry, RegistryEntry, Workspace } from "../domain/types.js";
import { layoutManifestSchema, primitiveManifestSchema } from "../schemas/sourceSchemas.js";
import { listDirectories, pathExists, readJson, readText } from "../io/fs.js";
import { routeTypeContracts } from "./routeTypes.js";

async function loadPrimitiveDir(dir: string): Promise<RegistryEntry<PrimitiveManifest> | undefined> {
  const manifestPath = path.join(dir, "primitive.json");
  if (!(await pathExists(manifestPath))) return undefined;
  const manifest = primitiveManifestSchema.parse(await readJson<unknown>(manifestPath)) as PrimitiveManifest;
  const template = await readOptional(path.join(dir, "template.html"));
  const styles = await readOptional(path.join(dir, "styles.css"));
  return {
    id: `${manifest.namespace}.${manifest.name}`,
    manifest,
    dir,
    template,
    styles
  };
}

async function loadLayoutDir(dir: string): Promise<RegistryEntry<LayoutManifest> | undefined> {
  const manifestPath = path.join(dir, "layout.json");
  if (!(await pathExists(manifestPath))) return undefined;
  const manifest = layoutManifestSchema.parse(await readJson<unknown>(manifestPath)) as LayoutManifest;
  const template = await readOptional(path.join(dir, "template.html"));
  const styles = await readOptional(path.join(dir, "styles.css"));
  return {
    id: `${manifest.namespace}.${manifest.name}`,
    manifest,
    dir,
    template,
    styles
  };
}

async function readOptional(filePath: string): Promise<string | undefined> {
  return (await pathExists(filePath)) ? readText(filePath) : undefined;
}

export async function loadRegistry(workspace: Workspace): Promise<Registry> {
  const primitives = new Map<string, RegistryEntry<PrimitiveManifest>>();
  const layouts = new Map<string, RegistryEntry<LayoutManifest>>();
  const routeTypes = new Map(routeTypeContracts.map((contract) => [contract.name, contract]));
  const coreDir = await findPackageCoreDir();

  const primitiveDirs = [
    ...(await listDirectories(path.join(coreDir, "primitives"))),
    ...(await listDirectories(path.resolve(workspace.root, workspace.config.source.primitivesDir)))
  ];
  const layoutDirs = [
    ...(await listDirectories(path.join(coreDir, "layouts"))),
    ...(await listDirectories(path.resolve(workspace.root, workspace.config.source.layoutsDir)))
  ];

  for (const dir of primitiveDirs) {
    const entry = await loadPrimitiveDir(dir);
    if (entry) primitives.set(entry.id, entry);
  }
  for (const dir of layoutDirs) {
    const entry = await loadLayoutDir(dir);
    if (entry) layouts.set(entry.id, entry);
  }

  return { primitives, layouts, routeTypes };
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
