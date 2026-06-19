import http from "node:http";
import path from "node:path";
import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { generate } from "../compiler/compiler.js";
import { evalProject } from "../eval/browserEval.js";
import { isPathInside, pathExists } from "../io/fs.js";

export async function dev(options: { port: number; reportPort: number; aiReview: "off" | "manual" | "auto" }): Promise<void> {
  await generate();
  const prototypeRoot = path.resolve(process.cwd(), "prototype");
  const reportRoot = path.resolve(process.cwd(), "reports");
  const preview = await serve(prototypeRoot, options.port);
  const report = await serve(reportRoot, options.reportPort);
  console.log("Draftpine dev");
  console.log(`Prototype: ${preview.url}`);
  console.log(`Report:    ${report.url}/latest.json`);

  let busy = false;
  watch(process.cwd(), { recursive: true }, async (_event, filename) => {
    if (!filename || busy) return;
    if (filename.startsWith("prototype") || filename.startsWith("reports") || filename.startsWith("node_modules")) return;
    busy = true;
    try {
      const result = await evalProject({ aiReview: options.aiReview === "auto" });
      console.log(`${result.status}: ${result.summary.errors} errors, ${result.summary.warnings} warnings`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    } finally {
      busy = false;
    }
  });
}

async function serve(root: string, port: number): Promise<{ url: string }> {
  const server = http.createServer(async (req, res) => {
    const requestPath = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const candidate = requestPath.endsWith("/") ? path.join(root, requestPath, "index.html") : path.join(root, requestPath);
    if (!isPathInside(root, candidate)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    const filePath = candidate;
    if (!(await pathExists(filePath))) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.setHeader("content-type", ext === ".css" ? "text/css" : ext === ".js" ? "text/javascript" : ext === ".json" ? "application/json" : "text/html");
    res.end(await readFile(filePath));
  });
  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${port}` };
}
