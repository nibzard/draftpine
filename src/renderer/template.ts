import type { Section } from "../domain/types.js";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getValue(context: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, context);
}

export function renderTemplate(template: string, context: Record<string, unknown>): string {
  let output = renderBlocks(template, context);

  output = output.replace(/\{\{\{\s*([\w.]+)\s*}}}/g, (_match, key: string) => String(getValue(context, key) ?? ""));
  output = output.replace(/\{\{\s*([\w.]+)\s*}}/g, (_match, key: string) => escapeHtml(getValue(context, key)));
  return output;
}

function renderBlocks(template: string, context: Record<string, unknown>): string {
  let output = template;
  let open = findOpenBlock(output);
  while (open) {
    const close = findMatchingClose(output, open);
    if (!close) break;
    const before = output.slice(0, open.index);
    const body = output.slice(open.end, close.index);
    const after = output.slice(close.end);
    let replacement = "";
    const value = getValue(context, open.key);
    if (open.kind === "if") {
      replacement = value ? renderTemplate(body, context) : "";
    } else if (Array.isArray(value)) {
      replacement = value
        .map((item, index) =>
          renderTemplate(body, {
            ...context,
            ...(typeof item === "object" && item ? (item as Record<string, unknown>) : { value: item }),
            this: item,
            index
          })
        )
        .join("");
    }
    output = `${before}${replacement}${after}`;
    open = findOpenBlock(output);
  }
  return output;
}

function findOpenBlock(template: string): { kind: "if" | "each"; key: string; index: number; end: number } | undefined {
  const match = /\{\{#(if|each)\s+([\w.]+)}}/.exec(template);
  if (!match) return undefined;
  return {
    kind: match[1] as "if" | "each",
    key: match[2],
    index: match.index,
    end: match.index + match[0].length
  };
}

function findMatchingClose(template: string, open: { kind: "if" | "each"; index: number; end: number }): { index: number; end: number } | undefined {
  const tokenPattern = /\{\{#(if|each)\s+[\w.]+}}|\{\{\/(if|each)}}/g;
  tokenPattern.lastIndex = open.end;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(template))) {
    const openedKind = match[1] as "if" | "each" | undefined;
    const closedKind = match[2] as "if" | "each" | undefined;
    if (openedKind === open.kind) depth += 1;
    if (closedKind === open.kind) depth -= 1;
    if (depth === 0) {
      return { index: match.index, end: match.index + match[0].length };
    }
  }
  return undefined;
}

export function resolveSectionContent(section: Section, content: Record<string, unknown> | undefined): Record<string, unknown> {
  if (typeof section.content === "string") {
    const value = content?.[section.content];
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  }
  return section.content;
}
