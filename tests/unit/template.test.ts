import { describe, expect, it } from "vitest";
import { renderTemplate } from "../../src/renderer/template.js";
import { renderPageFrame } from "../../src/compiler/html.js";
import type { Project, Recipe } from "../../src/domain/types.js";

describe("renderTemplate", () => {
  it("renders nested blocks in the correct context", () => {
    const html = renderTemplate("{{#if title}}<h2>{{title}}</h2>{{#each items}}{{#if body}}<p>{{body}}</p>{{/if}}{{/each}}{{/if}}", {
      title: "Bake case",
      items: [{ body: "Country sourdough" }, { body: "Rye boule" }]
    });

    expect(html).toBe("<h2>Bake case</h2><p>Country sourdough</p><p>Rye boule</p>");
  });
});

function projectWithLayouts(layouts: Record<string, string | undefined>): Project {
  const map = new Map<string, { id: string; template?: string }>();
  for (const [id, template] of Object.entries(layouts)) map.set(id, { id, template });
  return { registry: { layouts: map } } as unknown as Project;
}

describe("renderPageFrame", () => {
  it("stacks sections in order when no pageLayout is set", () => {
    const recipe = { sections: [] } as unknown as Recipe;
    const out = renderPageFrame(projectWithLayouts({}), recipe, [
      { slot: "main", html: "<section>A</section>" },
      { slot: "main", html: "<section>B</section>" }
    ]);
    expect(out).toBe("<section>A</section>\n<section>B</section>");
  });

  it("groups sections into named page-layout slots", () => {
    const recipe = { pageLayout: "core.appShell", sections: [] } as unknown as Recipe;
    const project = projectWithLayouts({
      "core.appShell":
        '<div class="dp-app-shell"><aside class="dp-page-nav">{{{nav}}}</aside><div class="dp-page-main">{{{main}}}</div></div>'
    });
    const out = renderPageFrame(project, recipe, [
      { slot: "nav", html: "<nav>Nav</nav>" },
      { slot: "main", html: "<section>A</section>" },
      { slot: "main", html: "<section>B</section>" }
    ]);
    expect(out).toContain('<aside class="dp-page-nav"><nav>Nav</nav></aside>');
    expect(out).toContain('<div class="dp-page-main"><section>A</section>\n<section>B</section></div>');
  });

  it("renders an empty region when no section targets that slot", () => {
    const recipe = { pageLayout: "core.appShell", sections: [] } as unknown as Recipe;
    const project = projectWithLayouts({ "core.appShell": '<div class="dp-app-shell">{{{nav}}}{{{main}}}</div>' });
    const out = renderPageFrame(project, recipe, [{ slot: "main", html: "<section>A</section>" }]);
    expect(out).toBe('<div class="dp-app-shell"><section>A</section></div>');
  });

  it("falls back to stacked output when the page layout is missing a template", () => {
    const recipe = { pageLayout: "core.missing", sections: [] } as unknown as Recipe;
    const out = renderPageFrame(projectWithLayouts({}), recipe, [{ slot: "main", html: "<section>A</section>" }]);
    expect(out).toBe("<section>A</section>");
  });
});
