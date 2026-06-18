import path from "node:path";
import { loadProject } from "../io/workspace.js";
import { writeText } from "../io/fs.js";

export async function generateDocs(out = "docs/generated"): Promise<void> {
  const project = await loadProject();
  const lines = ["# Draftpine v3 Catalog", ""];
  lines.push("## Pages", "");
  for (const page of project.pages.sort((a, b) => a.priority - b.priority || a.path.localeCompare(b.path))) {
    lines.push(`### ${page.title}`, "", `- Source: \`${page.sourceFile}\``, `- Path: \`${page.path}\``, `- Type: \`${page.type}\``, "");
  }
  lines.push("## Theme", "", `Active theme: \`${project.theme.id}\``, "", `Source: \`${project.theme.sourceFile}\``, "");
  lines.push("## Blocks", "");
  for (const block of [...project.theme.blocks.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`### ${block.name}`, "", block.metadata.description ?? "Editable theme block.", "", `File: \`${block.sourceFile}\``, "");
    if (block.metadata.requires?.length) lines.push(`Required props: ${block.metadata.requires.map((item) => `\`${item}\``).join(", ")}`, "");
    if (block.metadata.markers?.length) lines.push(`Markers: ${block.metadata.markers.join(", ")}`, "");
    if (block.metadata.states?.length) lines.push(`States: ${block.metadata.states.join(", ")}`, "");
    if (block.metadata.interactions?.length) lines.push(`Interactions: ${block.metadata.interactions.join(", ")}`, "");
    if (block.metadata.accessibility?.requiresLabels) lines.push("Accessibility: requires labels", "");
  }
  await writeText(path.resolve(process.cwd(), out, "catalog.md"), `${lines.join("\n")}\n`);
}
