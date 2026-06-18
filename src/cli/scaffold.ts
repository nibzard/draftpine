import path from "node:path";
import { cp, mkdir } from "node:fs/promises";
import { pathExists, readJson, writeJson, writeText } from "../io/fs.js";
import { themeSchema } from "../schemas/sourceSchemas.js";

export async function initProject(targetPath: string, starter: "single-screen" | "browsable" | "docs", force = false, prompt = ""): Promise<void> {
  const root = path.resolve(process.cwd(), targetPath);
  if ((await pathExists(root)) && !force && (await pathExists(path.join(root, "draftpine.config.json")))) {
    throw new Error(`Refusing to overwrite existing Draftpine project at ${root}. Pass --force to overwrite.`);
  }
  await mkdir(path.join(root, "pages"), { recursive: true });
  await mkdir(path.join(root, "themes/default/blocks"), { recursive: true });
  const projectName = inferProjectName(prompt, starter);
  const browsable = starter !== "single-screen";
  await writeJson(path.join(root, "draftpine.config.json"), defaultConfig(projectName));
  await writeDefaultTheme(root);
  await writeJson(path.join(root, "pages/home.json"), homePage(projectName, browsable));
  if (browsable) {
    await writeJson(path.join(root, "pages/pricing.json"), pricingPage(projectName));
    await writeJson(path.join(root, "pages/about.json"), aboutPage(projectName));
    await writeJson(path.join(root, "pages/contact.json"), contactPage(projectName));
    await writeJson(path.join(root, "pages/resources.json"), resourcesPage(projectName));
    await writeJson(path.join(root, "pages/not-found.json"), notFoundPage());
  }
}

export async function scaffoldBlock(name: string, theme = "default"): Promise<void> {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) throw new Error("Block name must be kebab-case.");
  const themeDir = path.resolve(process.cwd(), "themes", theme);
  const themePath = path.join(themeDir, "theme.json");
  if (!(await pathExists(themePath))) throw new Error(`Missing theme file ${path.relative(process.cwd(), themePath)}.`);
  const parsed = themeSchema.parse(await readJson<unknown>(themePath));
  const blockFile = `blocks/${name}.html`;
  parsed.blocks[name] = {
    file: blockFile,
    description: `${titleCase(name)} block.`,
    requires: ["title"]
  };
  await writeJson(themePath, parsed);
  await writeText(
    path.join(themeDir, blockFile),
    `<section class="dp-section dp-${name}" data-block="${name}">
  <div class="dp-container dp-panel dp-stack">
    <span class="dp-badge">Custom</span>
    <h2>{{title}}</h2>
    {{#body}}<p>{{body}}</p>{{/body}}
  </div>
</section>
`
  );
}

async function writeDefaultTheme(root: string): Promise<void> {
  const source = await findPackageDefaultThemeDir();
  await cp(source, path.join(root, "themes/default"), { recursive: true, force: true });
}

async function findPackageDefaultThemeDir(): Promise<string> {
  let current = path.resolve(import.meta.dirname);
  for (let index = 0; index < 8; index += 1) {
    const candidate = path.resolve(current, "themes/default");
    if (await pathExists(path.join(candidate, "theme.json"))) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const fallback = path.resolve(process.cwd(), "themes/default");
  if (await pathExists(path.join(fallback, "theme.json"))) return fallback;
  throw new Error("Could not locate packaged themes/default.");
}

function defaultConfig(projectName: string) {
  return {
    schemaVersion: "3.0",
    project: { name: projectName, description: "Static Draftpine v3 prototype." },
    source: { mode: "pages", pagesDir: "pages", theme: "default", themesDir: "themes" },
    output: { dir: "prototype", clean: true, assetsDir: "assets" },
    theme: { defaultMode: "light", allowThemeToggle: true },
    eval: { required: true, strict: true, viewports: ["mobile", "desktop"], aiReview: "off" }
  };
}

function homePage(projectName: string, browsable: boolean) {
  return {
    schemaVersion: "3.0",
    id: "home",
    path: "/",
    title: "Home",
    type: "home",
    description: `${projectName} static prototype.`,
    audience: "Product team",
    userGoal: "Review a public-facing website starter and choose the next route.",
    primaryAction: { label: "View pricing", href: browsable ? "./pricing/" : "#" },
    priority: 1,
    status: "ready",
    sections: [
      {
        id: "hero",
        block: "hero",
        props: {
          eyebrow: "Draftpine v3",
          headline: `${projectName} public website prototype`,
          body: "A compact static website starter with reusable blocks for landing pages, pricing, about pages, contact, proof, content, and conversion.",
          primaryAction: "View pricing",
          primaryHref: browsable ? "./pricing/" : "#",
          secondaryAction: browsable ? "Contact sales" : "Start editing",
          secondaryHref: browsable ? "./contact/" : "#"
        }
      },
      {
        id: "metrics",
        block: "metrics",
        props: {
          title: "Website coverage",
          items: [
            { label: "Public blocks", value: "30+" },
            { label: "Starter routes", value: browsable ? "5" : "1" },
            { label: "Runtime", value: "Static" }
          ]
        }
      },
      {
        id: "launch-note",
        block: "banner",
        props: {
          label: "New",
          body: "The default block range now focuses on public-facing SaaS, agency, product, and content websites.",
          action: browsable ? "See about" : "Start editing",
          href: browsable ? "./about/" : "#"
        }
      },
      {
        id: "logo-cloud",
        block: "logo-cloud",
        props: {
          title: "Familiar public-site proof patterns",
          body: "Use neutral logo rows for customers, partners, integrations, press, or credibility without decorative noise.",
          logos: [
            { mark: "GH", name: "GitHub" },
            { mark: "VC", name: "Vercel" },
            { mark: "CL", name: "Cal" },
            { mark: "LN", name: "Linear" }
          ]
        }
      },
      {
        id: "features",
        block: "feature-icons",
        props: {
          eyebrow: "Block range",
          title: "Distinct blocks for distinct website jobs",
          body: "Avoid one repeated card pattern. Each section carries a different public-site role.",
          items: [
            { icon: "CV", title: "Conversion", body: "Hero, CTA, banner, newsletter, contact, and pricing sections." },
            { icon: "TR", title: "Trust", body: "Logo clouds, social proof, testimonials, stats, and case-study summaries." },
            { icon: "CT", title: "Content", body: "Article, rich text, resource lists, steps, values, and team sections." }
          ]
        }
      },
      {
        id: "showcase",
        block: "feature-showcase",
        props: {
          eyebrow: "Website-first",
          title: "Public proof supports the page story",
          body: "Concrete proof should serve the buying story instead of.",
          items: [
            { title: "No app shell required", body: "Default routes are Home, Pricing, About, Contact, and 404." },
            { title: "Content stays editable", body: "Page JSON owns copy and sample data for each public section." },
            { title: "Static output stays simple", body: "Generated HTML remains portable and GitHub Pages friendly." }
          ],
          artifactTitle: "Public Route Map",
          artifactStatus: "Ready",
          rows: [
            { label: "Home", value: "Landing page" },
            { label: "Pricing", value: "Decision page" },
            { label: "About", value: browsable ? "Company page" : "Optional" },
            { label: "Contact", value: browsable ? "Lead capture" : "Optional" }
          ]
        }
      },
      {
        id: "proof",
        block: "proof",
        props: {
          title: "Editable source",
          body: "Open pages/home.json and themes/default/blocks/hero.html to change this screen.",
          code: "pages/*.json -> themes/default/*.html -> prototype/"
        }
      },
      {
        id: "starter-components",
        block: "card-grid",
        props: {
          title: "Core public website blocks",
          items: [
            { title: "Decision pages", body: "Pricing cards and comparison rows support plan or package selection." },
            { title: "Company pages", body: "Values, team, rich text, article, and resource blocks support about pages." },
            { title: "Conversion pages", body: "Testimonials, FAQ, newsletter, contact, and callout blocks support public funnels." }
          ]
        }
      },
      {
        id: "case-study",
        block: "case-study",
        props: {
          eyebrow: "Customer story",
          title: "Launch teams can review the public story first",
          body: "Use a featured case-study block when a homepage needs one concrete customer narrative before the final CTA.",
          action: browsable ? "Read story" : "Read story",
          href: browsable ? "./resources/" : "#",
          stats: [
            { label: "Routes reviewed", value: browsable ? "6" : "1" },
            { label: "Cycles saved", value: "3" },
            { label: "Backend calls", value: "0" }
          ]
        }
      },
      {
        id: "testimonial",
        block: "testimonial",
        props: {
          quote: "The starter now feels like a real public website system.",
          initials: "DP",
          author: "Draftpine reviewer",
          role: "Website quality pass"
        }
      },
      {
        id: "faq",
        block: "faq",
        props: {
          title: "Public website starter questions",
          body: "These are the decisions a website prototype should clarify early.",
          items: [
            { question: "Can I still build app screens?", answer: "Yes. Generic app-like blocks remain available, but the default starter focuses on public websites." },
            { question: "What routes should a public starter include?", answer: "Home, Pricing, About, Contact, and a 404 route cover most website review flows." },
            { question: "Can content-heavy pages be represented?", answer: "Yes. Article, rich text, resources, values, team, and steps cover public content pages." }
          ]
        }
      },
      {
        id: "newsletter",
        block: "newsletter",
        props: {
          title: "Prototype the public site before the build",
          body: "Use the website-first starter as a shared review surface for product, design, and marketing.",
          placeholder: "team@example.com",
          action: "Request Review"
        }
      },
      {
        id: "cta-split",
        block: "cta-split",
        props: {
          title: "Need to map more public pages?",
          body: "Add resources, careers, changelog, legal, or customer story routes when the website needs them.",
          primaryAction: browsable ? "Open resources" : "Start editing",
          primaryHref: browsable ? "./resources/" : "#",
          secondaryAction: browsable ? "Contact sales" : "View pricing",
          secondaryHref: browsable ? "./contact/" : "#"
        }
      },
      {
        id: "next-step",
        block: "callout",
        props: {
          title: "Start with a public page, then add only what the site needs.",
          body: "The default block range is broad enough for modern product sites without pulling the prototype toward internal tools.",
          action: browsable ? "Open contact" : "Start editing",
          href: browsable ? "./contact/" : "#"
        }
      }
    ]
  };
}

function pricingPage(projectName: string) {
  return {
    schemaVersion: "3.0",
    id: "pricing",
    path: "/pricing/",
    title: "Pricing",
    type: "pricing",
    primaryAction: { label: "Start with Pro", href: "#" },
    priority: 2,
    status: "ready",
    sections: [
      { id: "hero", block: "hero", props: { eyebrow: "Pricing", headline: "Choose the right website prototype path.", body: "Public pricing pages need clear plans, direct comparison, proof, FAQ, and a contact handoff.", primaryAction: "Start with Pro", primaryHref: "#", secondaryAction: "Contact sales", secondaryHref: "../contact/" } },
      {
        id: "plans",
        block: "pricing",
        props: {
          plans: [
            { name: "Explore", price: "$0", description: "One public page.", action: "Start", href: "#", features: ["Homepage draft", "Default website theme", "Static output"] },
            { name: "Pro", price: "$29", description: "Linked public site.", action: "Start with Pro", href: "#", features: ["Multiple public routes", "Strict browser eval", "Screenshot reports"] },
            { name: "Studio", price: "$99", description: "Custom website system.", action: "Contact sales", href: "../contact/", features: ["Custom public blocks", "Shared theme CSS", "Review-ready routes"] }
          ]
        }
      },
      {
        id: "comparison",
        block: "comparison",
        props: {
          title: "Plan comparison",
          columns: ["Capability", "Explore", "Pro", "Studio"],
          rows: [
            ["Public routes", "1", "5", "Custom"],
            ["Pricing and FAQ", "Manual", "Included", "Included"],
            ["Custom website blocks", "No", "Limited", "Included"],
            ["Strict eval", "Manual", "Included", "Included"]
          ]
        }
      },
      {
        id: "faq",
        block: "faq",
        props: {
          title: "Pricing questions",
          items: [
            { question: "Is the pricing real?", answer: "No. It is sample content shaped like a real public pricing page." },
            { question: "Can plans link to contact?", answer: "Yes. Static links route to the contact page or placeholder actions." }
          ]
        }
      },
      {
        id: "callout",
        block: "callout",
        props: { title: "Need a custom public site structure?", body: "Use the contact page to model sales handoff, project intake, or launch planning.", action: "Contact sales", href: "../contact/" }
      }
    ]
  };
}

function aboutPage(projectName: string) {
  return {
    schemaVersion: "3.0",
    id: "about",
    path: "/about/",
    title: "About",
    type: "about",
    primaryAction: { label: "Contact us", href: "../contact/" },
    priority: 3,
    status: "ready",
    sections: [
      { id: "hero", block: "hero", props: { eyebrow: `About ${projectName}`, headline: "A public website starter for fast review loops.", body: "Draftpine turns rough website prompts into static, browsable pages that teams can critique before implementation.", primaryAction: "Contact us", primaryHref: "../contact/", secondaryAction: "View pricing", secondaryHref: "../pricing/" } },
      {
        id: "values",
        block: "values",
        props: {
          title: "Principles",
          items: [
            { number: "01", title: "Public by default", body: "Starter routes model websites, not internal tools." },
            { number: "02", title: "Concrete enough to review", body: "Every block carries real copy, state, or proof." },
            { number: "03", title: "Portable output", body: "Generated pages remain plain HTML, CSS, and static assets." }
          ]
        }
      },
      {
        id: "team",
        block: "team",
        props: {
          title: "Review team",
          people: [
            { initials: "PD", name: "Product Design", role: "Layout and interaction review" },
            { initials: "MK", name: "Marketing", role: "Message and proof review" },
            { initials: "EN", name: "Engineering", role: "Static output review" }
          ]
        }
      },
      {
        id: "careers",
        block: "careers",
        props: {
          title: "Careers and culture sections",
          body: "Use this block for public hiring pages, studio pages, or team-culture sections.",
          perks: [
            { title: "Focused review loops", body: "Prototype the public page story before production design starts." },
            { title: "Static collaboration", body: "Share pages that anyone can open, review, and annotate." }
          ]
        }
      },
      {
        id: "jobs",
        block: "job-list",
        props: {
          title: "Open roles",
          jobs: [
            { title: "Website Design Lead", team: "Design", location: "Remote", action: "View role", href: "#" },
            { title: "Content Systems Editor", team: "Marketing", location: "Remote", action: "View role", href: "#" }
          ]
        }
      },
      { id: "rich-text", block: "rich-text", props: { title: "Why this starter exists", paragraphs: ["Most early website work fails because the team debates implementation details before agreeing on the page story.", "Draftpine keeps the first pass static and disposable."] } }
    ]
  };
}

function contactPage(projectName: string) {
  return {
    schemaVersion: "3.0",
    id: "contact",
    path: "/contact/",
    title: "Contact",
    type: "contact",
    primaryAction: { label: "Send request", href: "#" },
    priority: 4,
    status: "ready",
    sections: [
      { id: "hero", block: "hero", props: { eyebrow: "Contact", headline: `Talk through the ${projectName} site you want to prototype.`, body: "Use this page to model lead capture, sales handoff, support routing, or project inquiry flows.", primaryAction: "Send request", primaryHref: "#", secondaryAction: "Back home", secondaryHref: "../" } },
      {
        id: "contact",
        block: "contact",
        props: {
          eyebrow: "Contact form",
          title: "Tell us what should be on the site",
          body: "The form block keeps public lead capture separate from generic forms.",
          items: [
            { label: "Response", value: "Within one business day" },
            { label: "Best for", value: "Website, pricing, about, and launch pages" }
          ],
          fields: [
            { label: "Name", name: "name", type: "text", placeholder: "Alex Morgan" },
            { label: "Email", name: "email", type: "email", placeholder: "alex@example.com" },
            { label: "Website goal", name: "goal", type: "text", placeholder: "Launch a new pricing page" }
          ],
          submitLabel: "Send request"
        }
      },
      {
        id: "locations",
        block: "locations",
        props: {
          title: "Where public requests land",
          locations: [
            { city: "Remote", address: "Review teams across product, design, and marketing.", meta: "Primary" },
            { city: "Launch desk", address: "Static website prototypes and route planning.", meta: "Website support" }
          ]
        }
      }
    ]
  };
}

function resourcesPage(projectName: string) {
  return {
    schemaVersion: "3.0",
    id: "resources",
    path: "/resources/",
    title: "Resources",
    type: "resources",
    primaryAction: { label: "Join updates", href: "#" },
    priority: 5,
    status: "ready",
    sections: [
      { id: "hero", block: "hero", props: { eyebrow: "Resources", headline: `Content blocks for ${projectName}.`, body: "Use resource, article, changelog, and author blocks to model blogs, guides, announcements, and editorial pages.", primaryAction: "Join updates", primaryHref: "#", secondaryAction: "Back home", secondaryHref: "../" } },
      {
        id: "blog-list",
        block: "blog-list",
        props: {
          title: "Latest resources",
          posts: [
            { category: "Guide", title: "Reviewing a landing page wireframe", excerpt: "Check first-viewport promise, proof, conversion path, and FAQ coverage.", action: "Read post", href: "#" },
            { category: "Playbook", title: "Pricing page questions", excerpt: "Use plans, comparison rows, social proof, and contact handoff to remove friction.", action: "Read post", href: "#" }
          ]
        }
      },
      { id: "article", block: "article", props: { eyebrow: "Featured article", title: "A public prototype is a content decision tool", dek: "Make the website story visible enough to critique.", paragraphs: ["Public websites depend on hierarchy, proof, and trust.", "Draftpine blocks make those parts explicit as static sections."] } },
      { id: "author", block: "author-bio", props: { initials: "DP", name: "Draftpine editorial", bio: "Notes and examples for building compact public website prototypes with static blocks." } },
      { id: "changelog", block: "changelog", props: { title: "Changelog", items: [{ date: "2026-06-18", title: "Website block catalog", body: "Added public blocks for proof, content, careers, case studies, and resources." }] } }
    ]
  };
}

function notFoundPage() {
  return {
    schemaVersion: "3.0",
    id: "not-found",
    path: "/404/",
    title: "404",
    type: "not-found",
    primaryAction: { label: "Return home", href: "../" },
    priority: 6,
    status: "ready",
    sections: [
      { id: "not-found", block: "not-found", props: { code: "404", title: "This public page is not in the prototype.", body: "Return to the homepage or add the route to pages/ when the sitemap needs it.", action: "Return home", href: "../" } }
    ]
  };
}

function inferProjectName(prompt: string, starter: string): string {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (cleaned) return titleCase(cleaned).slice(0, 60);
  return starter === "docs" ? "Docs Prototype" : starter === "browsable" ? "Browsable Prototype" : "Prototype";
}

function titleCase(value: string): string {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
