I’d treat it as a tiny **wireframe kit repo**, not as an app framework. Let **Pico own the visual defaults**, let **Alpine own small interactions**, and give Claude Code strict project rules so it does not “upgrade” the prototype into React/Tailwind/Vite unless you ask.

Pico is a good fit because it supports a simple CDN setup and styles semantic HTML with very few classes; Alpine is a good fit because local state starts with `x-data`, then you use directives like `@click`, `x-show`, `x-model`, and `x-for` for simple interactions. ([Pico CSS][1]) Claude Code is especially suited to this because it can read/edit files and run commands, and you can steer it with `CLAUDE.md`, plan mode, screenshots, and reusable skills. ([Claude API Docs][2])

## 1. Create a tiny repo

```bash
mkdir wireframe-kit
cd wireframe-kit

touch index.html styles.css app.js CLAUDE.md
mkdir -p .claude/skills/wireframe
touch .claude/skills/wireframe/SKILL.md
```

Use **no build step** at first. Just open the HTML file or run:

```bash
python3 -m http.server 5173
```

## 2. Start with this `index.html`

```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />

    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
    />

    <link rel="stylesheet" href="./styles.css" />

    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script defer src="./app.js"></script>

    <title>Wireframe</title>
  </head>

  <body>
    <main class="container" x-data="wireframe()">
      <nav>
        <ul>
          <li><strong>Acme Prototype</strong></li>
        </ul>
        <ul>
          <li><a href="#" @click.prevent="tab = 'overview'">Overview</a></li>
          <li><a href="#" @click.prevent="tab = 'customers'">Customers</a></li>
          <li><button @click="modalOpen = true">New item</button></li>
        </ul>
      </nav>

      <header class="hero">
        <p class="eyebrow">Wireframe</p>
        <h1>Customer dashboard</h1>
        <p>A clean prototype for testing structure, copy, and flow before building real UI.</p>
      </header>

      <section class="grid stats">
        <article>
          <small>Active customers</small>
          <h2>1,284</h2>
        </article>
        <article>
          <small>Conversion</small>
          <h2>12.8%</h2>
        </article>
        <article>
          <small>Open tasks</small>
          <h2>18</h2>
        </article>
      </section>

      <section x-show="tab === 'overview'">
        <div class="section-title">
          <h2>Overview</h2>
          <input type="search" placeholder="Search items..." x-model="query" />
        </div>

        <div class="grid cards">
          <template x-for="item in filteredItems" :key="item.name">
            <article>
              <header>
                <strong x-text="item.name"></strong>
              </header>
              <p x-text="item.description"></p>
              <footer>
                <button class="secondary" @click="selected = item; modalOpen = true">
                  View
                </button>
              </footer>
            </article>
          </template>
        </div>
      </section>

      <section x-show="tab === 'customers'">
        <h2>Customers</h2>
        <figure>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <template x-for="customer in customers" :key="customer.name">
                <tr>
                  <td x-text="customer.name"></td>
                  <td x-text="customer.plan"></td>
                  <td><mark x-text="customer.status"></mark></td>
                </tr>
              </template>
            </tbody>
          </table>
        </figure>
      </section>

      <dialog :open="modalOpen">
        <article>
          <header>
            <button aria-label="Close" rel="prev" @click="modalOpen = false"></button>
            <strong x-text="selected?.name || 'New item'"></strong>
          </header>

          <form>
            <label>
              Name
              <input placeholder="Example item" />
            </label>

            <label>
              Notes
              <textarea placeholder="What should this represent?"></textarea>
            </label>

            <footer>
              <button type="button" class="secondary" @click="modalOpen = false">
                Cancel
              </button>
              <button type="button" @click="modalOpen = false">
                Save mock
              </button>
            </footer>
          </form>
        </article>
      </dialog>
    </main>
  </body>
</html>
```

## 3. Add tiny `styles.css`

```css
[x-cloak] {
  display: none !important;
}

.hero {
  padding-block: 3rem 2rem;
}

.eyebrow {
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  opacity: 0.7;
}

.stats h2 {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-block: 2rem 1rem;
}

.section-title input {
  max-width: 18rem;
}

.cards article {
  min-height: 14rem;
}

dialog article {
  width: min(100%, 42rem);
}

@media (max-width: 720px) {
  .section-title {
    display: block;
  }

  .section-title input {
    max-width: 100%;
  }
}
```

## 4. Add tiny `app.js`

```js
function wireframe() {
  return {
    tab: "overview",
    query: "",
    modalOpen: false,
    selected: null,

    items: [
      {
        name: "Onboarding flow",
        description: "Mock the first-run experience and empty states."
      },
      {
        name: "Billing settings",
        description: "Prototype plan selection, invoices, and payment states."
      },
      {
        name: "Team management",
        description: "Explore invite, role, and access-control screens."
      }
    ],

    customers: [
      { name: "Northwind", plan: "Pro", status: "Active" },
      { name: "Globex", plan: "Team", status: "Trial" },
      { name: "Initech", plan: "Free", status: "Paused" }
    ],

    get filteredItems() {
      const q = this.query.toLowerCase().trim();

      if (!q) return this.items;

      return this.items.filter((item) =>
        `${item.name} ${item.description}`.toLowerCase().includes(q)
      );
    }
  };
}
```

## 5. Put the rules in `CLAUDE.md`

Claude Code reads `CLAUDE.md` files as persistent project instructions; the docs specifically recommend using them for coding standards, architecture decisions, preferred libraries, and review checklists. ([Claude API Docs][2])

```md
# Wireframe Kit Rules

This repo is for fast, minimal, decent-looking wireframes.

## Stack

- Use plain HTML, CSS, and JavaScript.
- Use Pico CSS v2 via CDN for default visual styling.
- Use Alpine.js v3 via CDN for small interactions.
- Do not introduce React, Vue, Tailwind, TypeScript, build tools, routers, npm dependencies, or component libraries unless explicitly requested.

## Design approach

- Prefer semantic HTML: nav, header, main, section, article, aside, form, table, details, dialog.
- Use Pico defaults first.
- Add custom CSS only for layout, spacing, density, and wireframe-specific polish.
- Keep the aesthetic minimal, calm, and product-like.
- Avoid decorative gradients, complex animations, heavy shadows, and fake marketing polish.
- Make screens useful for product thinking: hierarchy, flows, states, and copy matter more than final visual design.

## Alpine rules

- Use Alpine only for prototype behavior:
  - tabs
  - dropdowns
  - modals
  - accordions
  - search/filter
  - fake CRUD
  - simple state changes
- Keep small state inline with `x-data`.
- Move repeated or larger state into `app.js`.
- Do not simulate a full backend.

## Wireframe quality checklist

Every screen should include relevant states:
- default
- empty
- loading, if useful
- error, if useful
- success/confirmation, if useful

Every change should preserve:
- responsive layout
- accessible labels
- keyboard-friendly controls where practical
- readable spacing
- simple maintainable markup

## Files

- `index.html` contains structure.
- `styles.css` contains minimal layout/polish.
- `app.js` contains fake data and Alpine state.
```

## 6. Add a reusable Claude Code skill

Claude Code skills live in paths like `.claude/skills/<skill-name>/SKILL.md`; the docs say they can be invoked with `/skill-name`, and only the description is recommended in frontmatter so Claude knows when to use the skill. ([Claude API Docs][3])

Put this in `.claude/skills/wireframe/SKILL.md`:

```md
---
name: wireframe
description: Build or revise a minimal Pico CSS + Alpine.js wireframe from a product idea, rough requirements, or screenshot.
disable-model-invocation: true
---

Create or revise a fast product wireframe using this repo's conventions.

Input may include:
- product idea
- target user
- screen name
- rough user flow
- screenshot or sketch
- required states
- constraints

Process:
1. Briefly restate the requested screen or flow.
2. Identify the core sections and user actions.
3. Propose a small implementation plan before editing.
4. Edit only `index.html`, `styles.css`, and `app.js` unless asked otherwise.
5. Use Pico defaults first and minimal custom CSS.
6. Use Alpine only for local prototype interactions.
7. Include realistic placeholder copy and fake data.
8. Include empty/error/success states when useful.
9. Keep the result easy to throw away or rewrite.

Avoid:
- new dependencies
- build tools
- framework abstractions
- over-designed visuals
- production backend logic

After implementation, summarize:
- what changed
- what interactions exist
- what to review in the browser
```

Then you can run:

```text
/wireframe Build a CRM pipeline page with stages, deal cards, search, empty state, and a modal for adding a deal.
```

## 7. Use Claude Code in plan mode first

For wireframes, I’d start Claude Code in plan mode so it proposes the structure before touching files. The docs say plan mode lets Claude read files and propose a plan without edits until approval. ([Claude API Docs][4])

```bash
claude --permission-mode plan
```

Then prompt it like this:

```text
Build a quick wireframe in this Pico + Alpine prototype.

Screen: B2B SaaS onboarding checklist
User: new admin setting up their workspace
Goal: help them complete setup and invite teammates

Requirements:
- hero/header explaining setup progress
- checklist cards with statuses
- right-side summary panel on desktop
- invite teammate modal
- empty state for no teammates
- fake data in app.js
- Alpine interactions only for modal, checklist completion, and filtering
- keep visual style minimal and calm
- do not add dependencies or build tools

Before editing, give me the proposed sections and interaction plan.
```

## 8. Give the agent “screen packets,” not vague requests

The best inputs are structured like this:

```text
Screen:
Audience:
User goal:
Primary action:
Secondary actions:
Sections:
States:
Fake data needed:
Interactions:
Responsive notes:
Do not include:
```

Example:

```text
Screen: Usage billing dashboard
Audience: startup founder
User goal: understand current usage before upgrading
Primary action: upgrade plan
Secondary actions: download invoice, set usage alert
Sections: summary cards, usage chart placeholder, invoices table, plan comparison, alert modal
States: normal, over-limit warning, empty invoices
Fake data: 3 plans, 6 invoices, 4 usage metrics
Interactions: tabs, modal, filter invoices
Do not include: authentication, real chart library, backend calls
```

## 9. Use screenshots aggressively

Claude Code docs explicitly recommend screenshots, diagrams, and mockups for UI work, including prompts like “Generate CSS to match this design mockup” or “What HTML structure would recreate this component?” ([Claude API Docs][4]) For this workflow, take a screenshot of the browser and say:

```text
Here is the current screenshot. Make it feel more like a clean B2B SaaS product, but keep Pico defaults and minimal custom CSS. Improve spacing, hierarchy, and empty states. Do not add dependencies.
```

## My default workflow

Use this loop:

```text
Idea → /wireframe prompt → approve plan → let Claude edit → open browser → screenshot → ask for one focused refinement → stop
```

The key is to **constrain the agent hard**. Tell it: plain HTML/CSS/JS, Pico defaults first, Alpine only for small behavior, no framework, no build step, realistic fake data, and include product states. That gives you quick prototypes that look decent without turning every wireframe into a frontend architecture project.

[1]: https://picocss.com/docs "Documentation • Pico CSS"
[2]: https://docs.anthropic.com/en/docs/claude-code/overview "Overview - Claude Code Docs"
[3]: https://docs.anthropic.com/en/docs/claude-code/skills "Extend Claude with skills - Claude Code Docs"
[4]: https://docs.anthropic.com/en/docs/claude-code/common-workflows "Common workflows - Claude Code Docs"

