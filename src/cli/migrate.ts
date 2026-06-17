import path from "node:path";
import { cp, mkdir } from "node:fs/promises";
import { initProject } from "./scaffold.js";
import { pathExists, writeJson, writeText } from "../io/fs.js";

export async function migrateV1(sourcePath: string, out: string): Promise<void> {
  const source = path.resolve(process.cwd(), sourcePath);
  const target = path.resolve(process.cwd(), out);
  await initProject(target, "single-screen", true);
  await mkdir(path.join(target, "imported"), { recursive: true });
  for (const file of ["index.html", "styles.css", "app.js", "draftpine.config.json"]) {
    if (await pathExists(path.join(source, file))) {
      await cp(path.join(source, file), path.join(target, "imported", file), { force: true });
    }
  }
  await writeJson(path.join(target, "migration-findings.json"), {
    findings: [
      {
        severity: "warning",
        message: "v1 files were copied into imported/. Convert them into routes, recipes, content, primitives, and layouts before treating the migration as complete."
      }
    ]
  });
  await writeText(path.join(target, "imported/README.md"), "Imported v1 output. This is reference material, not compiler-owned v2 source.\n");
}
