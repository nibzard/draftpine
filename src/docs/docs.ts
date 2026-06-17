import path from "node:path";
import { loadProject } from "../io/workspace.js";
import { writeText } from "../io/fs.js";

export async function generateDocs(out = "docs/generated"): Promise<void> {
  const project = await loadProject();
  const lines = ["# Draftpine Catalog", ""];
  lines.push("## Primitives", "");
  for (const primitive of [...project.registry.primitives.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`### ${primitive.id}`, "", primitive.manifest.description, "");
    lines.push(`Variants: ${primitive.manifest.variants.join(", ") || "none"}`, "");
    lines.push(`Layouts: ${primitive.manifest.layouts.join(", ") || "none"}`, "");
    lines.push("Slots:", "");
    for (const [name, slot] of Object.entries(primitive.manifest.slots)) {
      lines.push(`- \`${name}\`: ${slot.type}${slot.required ? " required" : ""}`);
    }
    lines.push("");
  }
  lines.push("## Layouts", "");
  for (const layout of [...project.registry.layouts.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`### ${layout.id}`, "", layout.manifest.description, "", `Overflow: ${layout.manifest.overflow}`, "");
  }
  lines.push("## Route Types", "");
  for (const routeType of [...project.registry.routeTypes.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`### ${routeType.name}`, "", routeType.purpose, "", `Required primitives: ${routeType.requiredPrimitives.join(", ") || "none"}`, "");
  }
  await writeText(path.resolve(process.cwd(), out, "catalog.md"), `${lines.join("\n")}\n`);
}
