function getInitialDraftpineTheme() {
  const storedTheme = localStorage.getItem("draftpine-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function dashboardExample() {
  return {
    theme: "light",
    query: "",
    metrics: [
      { label: "Conversion", value: "12.8%", note: "Up from last week" },
      { label: "Queue", value: "38", note: "Items waiting" },
      { label: "SLA", value: "94%", note: "One point below target" }
    ],
    activity: [
      { item: "Launch review", owner: "Maya", status: "Open" },
      { item: "Billing audit", owner: "Jon", status: "Done" }
    ],
    init() {
      this.theme = getInitialDraftpineTheme();
      document.documentElement.dataset.theme = this.theme;
    },
    toggleTheme() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = this.theme;
      localStorage.setItem("draftpine-theme", this.theme);
    },
    get filteredActivity() {
      const query = this.query.toLowerCase().trim();
      if (!query) return this.activity;
      return this.activity.filter((item) => `${item.item} ${item.owner} ${item.status}`.toLowerCase().includes(query));
    }
  };
}
