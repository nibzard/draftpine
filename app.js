// Browsable-mode site shell. Define global links once here; every page
// component should expose them through createDraftpineShell().
// Format: [{ label: "Platform", path: "/platform/" }, ...]
const SITE_NAV = [];
const SITE_FOOTER = [];

function getRouteDepth(pathname = window.location.pathname) {
  const cleanPath = pathname.replace(/\/index\.html$/, "/").replace(/\/+$/, "/");
  if (cleanPath === "/" || cleanPath.endsWith("/wireframe/")) return 0;
  const parts = cleanPath.split("/").filter(Boolean);
  return Math.max(parts.length - 1, 0);
}

function routeHref(routePath, depth = getRouteDepth()) {
  if (!routePath || routePath === "/") return depth === 0 ? "./" : "../".repeat(depth);
  const cleanRoute = String(routePath).replace(/^\/+/, "").replace(/\/?$/, "/");
  return `${"../".repeat(depth)}${cleanRoute}`;
}

function createDraftpineShell(options = {}) {
  const depth = Number.isInteger(options.depth) ? options.depth : getRouteDepth();
  const normalizeItem = (item) => ({
    ...item,
    href: item.href || routeHref(item.path || "/", depth)
  });
  return {
    siteNav: SITE_NAV.map(normalizeItem),
    siteFooter: SITE_FOOTER.map(normalizeItem),
    routeHref(path) {
      return routeHref(path, depth);
    }
  };
}

function getInitialDraftpineTheme() {
  const storedTheme = localStorage.getItem("draftpine-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function prototypeBriefWorkspace() {
  const fallbackContent = {
    screen: "Prototype brief workspace",
    audience: "product builder",
    userGoal: "Turn a rough product idea into the first Draftpine screen packet",
    primaryAction: "Start first screen",
    brand: "Draftpine",
    nav: {
      brief: "Brief",
      recipe: "Recipe",
      states: "States"
    },
    header: {
      eyebrow: "Fresh project starter",
      title: "Prototype brief workspace",
      description: "A neutral first screen for gathering the product, user, primary action, and deliberate omissions before Draftpine replaces the starter with the real wireframe."
    },
    notice: {
      title: "Agent contract:",
      description: "When this starter is still present, ask the four onboarding questions before editing."
    },
    briefQuestions: [
      { label: "What are you prototyping?", hint: "Product and first screen in one line." },
      { label: "Who is the user?", hint: "Their role and the job they need done." },
      { label: "What is the primary action?", hint: "The one action this screen should drive." },
      { label: "What should be left out?", hint: "Auth, real backends, real charts, or other distractions." }
    ],
    starterStates: [
      { name: "Default", description: "The starter is ready and waiting for a real screen prompt." },
      { name: "Empty", description: "Filtering can produce an empty list without breaking layout." },
      { name: "Success", description: "The modal can record a mock brief and show completion feedback." }
    ],
    examples: [
      { name: "SaaS homepage", fit: "Outcome hero, proof, feature bento, final CTA" },
      { name: "Settings screen", fit: "App shell, forms, empty state, confirmation" },
      { name: "Comparison page", fit: "Hero, spec table, proof, conversion band" },
      { name: "Onboarding flow", fit: "Checklist, invite form, progress, success state" }
    ],
    emptyState: {
      title: "No starter examples match",
      description: "Clear the filter and use the user's product prompt as the source of truth.",
      action: "Clear filter"
    },
    successState: {
      title: "Brief captured.",
      description: "This starter shows the confirmation state; the next step is replacing it with the requested screen."
    },
    modal: {
      title: "Start first screen",
      prototypeLabel: "Prototype",
      prototypePlaceholder: "Example: AI sales copilot homepage",
      audienceLabel: "User and goal",
      audiencePlaceholder: "Example: sales manager comparing pipeline risk",
      cancel: "Cancel",
      submit: "Save mock brief"
    }
  };

  return {
    ...createDraftpineShell(),
    content: fallbackContent,
    tab: "brief",
    theme: "light",
    exampleQuery: "",
    modalOpen: false,
    draftPrototype: "",
    draftAudience: "",
    briefSaved: false,
    async init() {
      this.theme = getInitialDraftpineTheme();
      document.documentElement.dataset.theme = this.theme;
      try {
        const response = await fetch("./content/pages/prototype-brief-workspace.json");
        if (response.ok) this.content = await response.json();
      } catch (error) {
        console.warn("Using inline starter content because JSON could not be loaded.", error);
      }
    },
    toggleTheme() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = this.theme;
      localStorage.setItem("draftpine-theme", this.theme);
    },
    get filteredExamples() {
      const query = this.exampleQuery.trim().toLowerCase();
      if (!query) return this.content.examples;
      return this.content.examples.filter((example) =>
        `${example.name} ${example.fit}`.toLowerCase().includes(query)
      );
    },
    openBriefModal() {
      this.briefSaved = false;
      this.modalOpen = true;
    },
    saveBrief() {
      this.modalOpen = false;
      this.briefSaved = true;
    }
  };
}
