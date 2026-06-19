import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ListFilesOptions {
  ignoreDirs?: string[];
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readText(filePath)) as T;
}

export async function writeText(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function cleanDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

export async function listDirectories(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name));
}

export async function listFilesRecursive(dir: string, options: ListFilesOptions = {}): Promise<string[]> {
  const resolvedDir = path.resolve(dir);
  if (!(await pathExists(resolvedDir))) return [];
  const ignoredDirs = (options.ignoreDirs ?? []).map((item) => path.resolve(item));
  const entries = await readdir(resolvedDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(resolvedDir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.some((ignoredDir) => isPathInside(ignoredDir, fullPath))) continue;
      files.push(...(await listFilesRecursive(fullPath, { ignoreDirs: ignoredDirs })));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export function isPathInside(parentPath: string, candidatePath: string): boolean {
  const relative = path.relative(path.resolve(parentPath), path.resolve(candidatePath));
  return relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

export function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function relativeAssetPrefix(routeFile: string): string {
  const depth = routeFile.split("/").filter(Boolean).length - 1;
  return depth <= 0 ? "./" : "../".repeat(depth);
}
