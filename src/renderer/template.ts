export interface TemplateRenderResult {
  html: string;
  errors: string[];
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderTemplate(template: string, context: Record<string, unknown>): string {
  return renderTemplateWithDiagnostics(template, context).html;
}

export function renderTemplateWithDiagnostics(template: string, context: Record<string, unknown>): TemplateRenderResult {
  const errors: string[] = [];
  let output = template.replace(/\{\{!\s*[^}]*}}/g, "");
  output = renderSections(output, context, errors);
  output = output.replace(/\{\{\s*([#/^][^}]+)\s*}}/g, (match) => {
    errors.push(`unmatched section token ${match}`);
    return match;
  });
  output = output.replace(/\{\{\s*([\w.]+)\s*}}/g, (_match, key: string) => escapeHtml(getValue(context, key)));
  return { html: output, errors };
}

export function renderShellTemplate(template: string, context: Record<string, unknown>, rawKeys: string[] = ["sections"]): string {
  let output = template;
  for (const key of rawKeys) {
    output = output.replace(new RegExp(`\\{\\{\\{\\s*${escapeRegExp(key)}\\s*}}}`, "g"), String(getValue(context, key) ?? ""));
  }
  return renderTemplate(output, context);
}

function renderSections(template: string, context: Record<string, unknown>, errors: string[]): string {
  let output = template;
  let open = findOpenSection(output);
  while (open) {
    const close = findMatchingClose(output, open);
    if (!close) {
      errors.push(`unclosed section ${open.key}`);
      break;
    }
    const before = output.slice(0, open.index);
    const body = output.slice(open.end, close.index);
    const after = output.slice(close.end);
    const value = getValue(context, open.key);
    let replacement = "";

    if (open.kind === "normal") {
      if (Array.isArray(value)) {
        replacement = value.map((item, index) => renderTemplateWithDiagnostics(body, childContext(context, item, index)).html).join("");
      } else if (isTruthy(value)) {
        replacement = renderTemplateWithDiagnostics(body, context).html;
      }
    } else if (!isTruthy(value) || (Array.isArray(value) && value.length === 0)) {
      replacement = renderTemplateWithDiagnostics(body, context).html;
    }

    output = `${before}${replacement}${after}`;
    open = findOpenSection(output);
  }
  return output;
}

function findOpenSection(template: string): { kind: "normal" | "inverted"; key: string; index: number; end: number } | undefined {
  const match = /\{\{([#^])\s*([\w.]+)\s*}}/.exec(template);
  if (!match) return undefined;
  return {
    kind: match[1] === "#" ? "normal" : "inverted",
    key: match[2],
    index: match.index,
    end: match.index + match[0].length
  };
}

function findMatchingClose(template: string, open: { key: string; index: number; end: number }): { index: number; end: number } | undefined {
  const tokenPattern = /\{\{([#^/])\s*([\w.]+)\s*}}/g;
  tokenPattern.lastIndex = open.end;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(template))) {
    const kind = match[1];
    const key = match[2];
    if (key !== open.key) continue;
    if (kind === "#" || kind === "^") depth += 1;
    if (kind === "/") depth -= 1;
    if (depth === 0) return { index: match.index, end: match.index + match[0].length };
  }
  return undefined;
}

function getValue(context: Record<string, unknown>, key: string): unknown {
  if (key === ".") return context["."];
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) return (current as Record<string, unknown>)[part];
    return undefined;
  }, context);
}

function childContext(parent: Record<string, unknown>, item: unknown, index: number): Record<string, unknown> {
  return {
    ...parent,
    ...(item && typeof item === "object" ? (item as Record<string, unknown>) : { value: item }),
    ".": item,
    index
  };
}

function isTruthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
