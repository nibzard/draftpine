import { describe, expect, it } from "vitest";
import { renderTemplate, renderTemplateWithDiagnostics } from "../../src/renderer/template.js";

describe("renderTemplate", () => {
  it("renders escaped variables, arrays, and inverted sections", () => {
    const html = renderTemplate("{{title}}{{#items}}<p>{{label}}</p>{{/items}}{{^empty}}<b>empty</b>{{/empty}}", {
      title: "<Hello>",
      items: [{ label: "One" }, { label: "Two" }],
      empty: []
    });

    expect(html).toBe("&lt;Hello&gt;<p>One</p><p>Two</p><b>empty</b>");
  });

  it("reports unclosed sections without evaluating JavaScript", () => {
    const result = renderTemplateWithDiagnostics("{{#items}}<p>{{label}}</p>", { items: [{ label: "One" }] });
    expect(result.errors.some((error) => error.includes("unclosed section items"))).toBe(true);
  });

  it("bubbles diagnostics from nested section renders", () => {
    const result = renderTemplateWithDiagnostics("{{#items}}<p>{{label}}{{#broken}}</p>{{/items}}", { items: [{ label: "One" }] });
    expect(result.errors.some((error) => error.includes("unclosed section broken"))).toBe(true);
  });
});
