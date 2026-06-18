import type { Finding, FindingCategory, RepairAction, Severity } from "./types.js";

export function finding(input: {
  id: string;
  severity: Severity;
  category: FindingCategory;
  message: string;
  route?: string;
  file?: string;
  selector?: string;
  block?: string;
  viewport?: string;
  evidence?: Record<string, unknown>;
  repair?: RepairAction;
  blocking?: boolean;
}): Finding {
  return {
    ...input,
    blocking: input.blocking ?? input.severity === "error"
  };
}

export function summarizeFindings(findings: Finding[]) {
  return {
    errors: findings.filter((item) => item.severity === "error").length,
    warnings: findings.filter((item) => item.severity === "warning").length
  };
}
