import http from "node:http";
import path from "node:path";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { promisify } from "node:util";
import { chromium, type Browser, type ConsoleMessage } from "@playwright/test";
import type { EvalReport, Finding, Project, Route, ViewportName } from "../domain/types.js";
import { finding } from "../domain/findings.js";
import { generate } from "../compiler/compiler.js";
import { check } from "./check.js";
import { cleanDir, isPathInside, pathExists, writeJson } from "../io/fs.js";
import { writeText } from "../io/fs.js";
import { renderReportHtml } from "../report/html.js";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const playwrightCli = require.resolve("@playwright/test/cli");

const viewports: Record<ViewportName, { width: number; height: number }> = {
  mobileSmall: { width: 360, height: 800 },
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 1000 },
  desktopWide: { width: 1728, height: 1117 }
};

export async function evalProject(options: { configPath?: string; strict?: boolean; routes?: string[]; aiReview?: boolean } = {}): Promise<EvalReport> {
  const generated = await generate(options.configPath);
  const checked = await check(options.configPath, "all");
  const project = generated.project;
  const findings: Finding[] = [...generated.findings, ...checked.findings];
  const requestedRoutes = (options.routes ?? []).map((route) => route.trim()).filter(Boolean);
  const routeFilter = new Set(requestedRoutes);
  const availableRoutes = new Set(generated.artifact.routesRendered.map((route) => route.path));
  for (const route of requestedRoutes) {
    if (!availableRoutes.has(route)) {
      findings.push(
        finding({
          id: "route.unknownEvalRoute",
          severity: "error",
          category: "route",
          route,
          message: `Requested eval route ${route} is not part of the generated project.`
        })
      );
    }
  }
  const routes = generated.artifact.routesRendered.filter((route) => routeFilter.size === 0 || routeFilter.has(route.path));
  const screenshots: string[] = [];
  await cleanDir(path.resolve(project.workspace.root, "reports/screenshots"));

  if (!findings.some((item) => item.blocking) && routes.length > 0) {
    const server = await serveStatic(generated.artifact.outputDir);
    let browser: Browser | undefined;
    try {
      const launch = await launchChromiumForEval();
      if (launch.finding) {
        findings.push(launch.finding);
      } else {
        browser = launch.browser;
        for (const route of routes) {
          for (const viewportName of project.workspace.config.eval.viewports) {
            const result = await evalRoute(project, browser, server.url, route, viewportName);
            findings.push(...result.findings);
            screenshots.push(...result.screenshots);
          }
        }
      }
    } finally {
      await browser?.close();
      await server.close();
    }
  }

  if (options.aiReview || project.workspace.config.eval.aiReview === "auto") {
    findings.push(
      finding({
        id: "visual.aiReviewNotConfigured",
        severity: project.workspace.config.eval.aiReview === "auto" ? "warning" : "info",
        category: "visual",
        message: "AI screenshot review is configured as a reporting hook but no provider is enabled in this implementation.",
        blocking: false,
        repair: { priority: 5, type: "manual-review", message: "Review screenshots in reports/screenshots manually." }
      })
    );
  }

  const uniqueFindings = dedupe(findings);
  const errors = uniqueFindings.filter((item) => item.severity === "error").length;
  const warnings = uniqueFindings.filter((item) => item.severity === "warning").length;
  const deterministicStatus = errors > 0 ? "fail" : "pass";
  const manualReviewRequired = errors === 0 && project.workspace.config.eval.aiReview === "manual";
  const report: EvalReport = {
    draftpineVersion: "3.0.0",
    sourceMode: "pages",
    activeTheme: project.theme.id,
    status: errors > 0 ? "fail" : manualReviewRequired ? "pass-with-review" : "pass",
    deterministicStatus,
    manualReviewRequired,
    summary: {
      errors,
      warnings,
      routesEvaluated: routes.length,
      screenshots: screenshots.length
    },
    findings: uniqueFindings,
    artifacts: { screenshots }
  };

  const reportPath = path.resolve(project.workspace.root, "reports/latest.json");
  await writeJson(reportPath, report);
  await writeText(path.resolve(project.workspace.root, "reports/latest.html"), renderReportHtml(report));
  return report;
}

export async function setupEvalBrowser(): Promise<{ ok: boolean; message: string }> {
  const install = await installChromium();
  return install.ok
    ? { ok: true, message: "Draftpine eval browser is ready." }
    : { ok: false, message: `Failed to install Draftpine eval browser.\n${install.output}` };
}

async function launchChromiumForEval(): Promise<{ browser: Browser; finding?: undefined } | { browser?: undefined; finding: Finding }> {
  try {
    return { browser: await chromium.launch() };
  } catch (error) {
    if (!isMissingPlaywrightBrowser(error)) {
      return { finding: browserLaunchFinding(error) };
    }
  }

  if (process.env.DRAFTPINE_SKIP_BROWSER_INSTALL === "1") {
    return {
      finding: browserLaunchFinding(
        "Chromium is not installed and DRAFTPINE_SKIP_BROWSER_INSTALL=1 is set. Run `pnpm draftpine setup` or `pnpm exec playwright install chromium`."
      )
    };
  }

  const install = await installChromium();
  if (!install.ok) {
    return {
      finding: browserLaunchFinding(`Draftpine tried to install Chromium automatically and failed.\n${install.output}`)
    };
  }

  try {
    return { browser: await chromium.launch() };
  } catch (error) {
    return { finding: browserLaunchFinding(error) };
  }
}

async function installChromium(): Promise<{ ok: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [playwrightCli, "install", "chromium"], {
      timeout: Number(process.env.DRAFTPINE_BROWSER_INSTALL_TIMEOUT_MS ?? 300000),
      maxBuffer: 1024 * 1024 * 8
    });
    return { ok: true, output: `${stdout}${stderr}`.trim() };
  } catch (error) {
    const output = error instanceof Error ? error.message : String(error);
    const stdout = typeof error === "object" && error && "stdout" in error ? String(error.stdout ?? "") : "";
    const stderr = typeof error === "object" && error && "stderr" in error ? String(error.stderr ?? "") : "";
    return { ok: false, output: `${stdout}${stderr}${output}`.trim() };
  }
}

function isMissingPlaywrightBrowser(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Executable doesn't exist") || message.includes("Please run the following command to download new browsers");
}

function browserLaunchFinding(error: unknown): Finding {
  const message = error instanceof Error ? error.message : String(error);
  return finding({
    id: "runtime.browserUnavailable",
    severity: "error",
    category: "runtime",
    message: "Draftpine could not start Chromium for browser eval.",
    evidence: { error: message },
    repair: {
      priority: 1,
      type: "manual-review",
      message: "Run `pnpm draftpine setup` from the Draftpine package, then rerun `pnpm draftpine eval --strict --json`."
    }
  });
}

async function evalRoute(project: Project, browser: Browser, baseUrl: string, route: Route, viewportName: ViewportName): Promise<{ findings: Finding[]; screenshots: string[] }> {
  const findings: Finding[] = [];
  const screenshots: string[] = [];
  const viewport = viewports[viewportName];
  const page = await browser.newPage({ viewport });
  const consoleErrors: string[] = [];
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: Error) => consoleErrors.push(error.message));

  const url = new URL(route.path.replace(/^\//, ""), `${baseUrl}/`).toString();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.resolve(project.workspace.root, `reports/screenshots/${route.id}-${viewportName}.png`), fullPage: false });
  screenshots.push(`reports/screenshots/${route.id}-${viewportName}.png`);

  if (consoleErrors.length) {
    findings.push(
      finding({
        id: "runtime.consoleError",
        severity: "error",
        category: "runtime",
        route: route.path,
        viewport: viewportName,
        message: "Route produced JavaScript console errors.",
        evidence: { consoleErrors }
      })
    );
  }

  const metrics = await page.evaluate(() => {
    const allowed = new Set<Element>();
    document.querySelectorAll('[data-draftpine-overflow="allowed"]').forEach((item) => {
      allowed.add(item);
      item.querySelectorAll("*").forEach((child) => allowed.add(child));
    });
    const offenders = Array.from(document.body.querySelectorAll("*"))
      .filter((element) => {
        if (allowed.has(element)) return false;
        const rect = element.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0;
        return visible && (rect.x < -2 || rect.x + rect.width > window.innerWidth + 2);
      })
      .slice(0, 10)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String((element as HTMLElement).className || ""),
          x: rect.x,
          width: rect.width
        };
      });
    const unlabeledControls = Array.from(document.querySelectorAll("button,input,select,textarea"))
      .filter((element) => {
        const id = element.getAttribute("id");
        const hasLabel = !!element.closest("label") || (id ? !!document.querySelector(`label[for="${id}"]`) : false);
        const aria = element.getAttribute("aria-label") || element.getAttribute("aria-labelledby");
        const text = element.textContent?.trim();
        return !hasLabel && !aria && !text;
      })
      .map((element) => element.tagName.toLowerCase());
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      hasH1: !!document.querySelector("h1"),
      hasPrimaryAction: !!document.querySelector('[data-draftpine-action="primary"]'),
      hasThemeToggle: !!document.querySelector('[data-draftpine-interaction="theme"]'),
      themeBefore: document.documentElement.dataset.theme,
      unresolvedTemplateMarkers: /\{\{[#/]?[\w.\s]+}}/.test(document.body.innerText),
      offenders,
      unlabeledControls
    };
  });

  if (metrics.scrollWidth > metrics.viewportWidth + 2 || metrics.offenders.length) {
    findings.push(
      finding({
        id: "mobile.horizontalOverflow",
        severity: viewportName.startsWith("mobile") ? "error" : "warning",
        category: "layout",
        route: route.path,
        viewport: viewportName,
        message: `The page has horizontal overflow at ${viewport.width}px.`,
        evidence: metrics,
        repair: {
          priority: 1,
          type: "choose-layout",
          file: route.sourceFile,
          message: "Use responsive theme block markup or wrap approved wide content in data-draftpine-overflow=\"allowed\"."
        }
      })
    );
  }
  if (!metrics.hasH1) {
    findings.push(finding({ id: "accessibility.missingH1", severity: "error", category: "accessibility", route: route.path, viewport: viewportName, message: "Route is missing an H1." }));
  }
  if (!metrics.hasPrimaryAction) {
    findings.push(
      finding({
        id: "composition.missingPrimaryAction",
        severity: "error",
        category: "composition",
        route: route.path,
        viewport: viewportName,
        message: "Route is missing a primary action marker."
      })
    );
  }
  if (metrics.unlabeledControls.length) {
    findings.push(
      finding({
        id: "accessibility.unlabeledControl",
        severity: "error",
        category: "accessibility",
        route: route.path,
        viewport: viewportName,
        message: "Interactive controls must have visible text, a label, or aria-label.",
        evidence: { controls: metrics.unlabeledControls }
      })
    );
  }
  if (metrics.unresolvedTemplateMarkers) {
    findings.push(
      finding({
        id: "content.unresolvedTemplateMarker",
        severity: "error",
        category: "content",
        route: route.path,
        viewport: viewportName,
        message: "Rendered page contains unresolved template markers."
      })
    );
  }
  if (metrics.hasThemeToggle) {
    const themeResult = await page.evaluate(() => {
      const before = document.documentElement.dataset.theme;
      const toggle = document.querySelector<HTMLElement>('[data-draftpine-interaction="theme"]');
      toggle?.click();
      const after = document.documentElement.dataset.theme;
      toggle?.click();
      return { before, after };
    });
    if (!themeResult.after || themeResult.before === themeResult.after) {
      findings.push(
        finding({
          id: "runtime.themeToggleNoop",
          severity: "error",
          category: "runtime",
          route: route.path,
          viewport: viewportName,
          message: "Theme toggle did not change documentElement data-theme.",
          evidence: themeResult
        })
      );
    }
  }

  await page.close();
  return { findings, screenshots };
}

async function serveStatic(root: string): Promise<{ url: string; close: () => Promise<void> }> {
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
    res.setHeader("content-type", ext === ".css" ? "text/css" : ext === ".js" ? "text/javascript" : "text/html");
    res.end(await readFile(filePath));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to start eval server");
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}

function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((item) => {
    const key = `${item.id}|${item.route ?? ""}|${item.file ?? ""}|${item.viewport ?? ""}|${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
