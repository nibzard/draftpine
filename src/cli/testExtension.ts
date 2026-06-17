import path from "node:path";
import { finding } from "../domain/findings.js";
import type { Finding } from "../domain/types.js";
import { pathExists, readJson, readText } from "../io/fs.js";
import { layoutManifestSchema, primitiveManifestSchema } from "../schemas/sourceSchemas.js";

export async function testPrimitive(name: string): Promise<Finding[]> {
  const dir = path.resolve(process.cwd(), "primitives", name);
  const findings: Finding[] = [];
  await requireFile(findings, dir, "primitive.json", "primitive");
  await requireFile(findings, dir, "template.html", "primitive");
  await requireFile(findings, dir, "styles.css", "primitive");
  await requireFile(findings, dir, "demo.json", "primitive");
  await requireFile(findings, dir, "eval.json", "primitive");
  await requireFile(findings, dir, "README.md", "primitive");
  if (!findings.length) {
    primitiveManifestSchema.parse(await readJson(path.join(dir, "primitive.json")));
    const styles = await readText(path.join(dir, "styles.css"));
    if (/\b(body|html|section|article)\b/.test(styles)) {
      findings.push(finding({ id: "primitive.cssScopeViolation", severity: "error", category: "primitive", file: path.join("primitives", name, "styles.css"), message: "Primitive CSS must be scoped and cannot target generic page elements." }));
    }
  }
  return findings;
}

export async function testLayout(name: string): Promise<Finding[]> {
  const dir = path.resolve(process.cwd(), "layouts", name);
  const findings: Finding[] = [];
  await requireFile(findings, dir, "layout.json", "layout");
  await requireFile(findings, dir, "template.html", "layout");
  await requireFile(findings, dir, "styles.css", "layout");
  await requireFile(findings, dir, "demo.json", "layout");
  await requireFile(findings, dir, "eval.json", "layout");
  await requireFile(findings, dir, "README.md", "layout");
  if (!findings.length) {
    layoutManifestSchema.parse(await readJson(path.join(dir, "layout.json")));
  }
  return findings;
}

async function requireFile(findings: Finding[], dir: string, file: string, kind: "primitive" | "layout") {
  if (!(await pathExists(path.join(dir, file)))) {
    findings.push(finding({ id: `extension.missing${kind === "primitive" ? "Primitive" : "Layout"}Fixture`, severity: "error", category: kind, file: path.join(dir, file), message: `${kind} extension is missing ${file}.` }));
  }
}
