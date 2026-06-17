import { describe, expect, it } from "vitest";
import { renderTemplate } from "../../src/renderer/template.js";

describe("renderTemplate", () => {
  it("renders nested blocks in the correct context", () => {
    const html = renderTemplate("{{#if title}}<h2>{{title}}</h2>{{#each items}}{{#if body}}<p>{{body}}</p>{{/if}}{{/each}}{{/if}}", {
      title: "Bake case",
      items: [{ body: "Country sourdough" }, { body: "Rye boule" }]
    });

    expect(html).toBe("<h2>Bake case</h2><p>Country sourdough</p><p>Rye boule</p>");
  });
});
