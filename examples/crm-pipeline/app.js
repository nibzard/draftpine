function getInitialDraftpineTheme() {
  const storedTheme = localStorage.getItem("draftpine-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function pipelineExample() {
  return {
    theme: "light",
    query: "",
    modalOpen: false,
    saved: false,
    stages: ["Qualified", "Proposal", "Closing"],
    deals: [
      { account: "Northwind", value: "$18k", stage: "Qualified" },
      { account: "Globex", value: "$42k", stage: "Proposal" },
      { account: "Initech", value: "$27k", stage: "Closing" }
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
    get filteredDeals() {
      const query = this.query.toLowerCase().trim();
      if (!query) return this.deals;
      return this.deals.filter((deal) => `${deal.account} ${deal.value} ${deal.stage}`.toLowerCase().includes(query));
    },
    dealsFor(stage) {
      return this.filteredDeals.filter((deal) => deal.stage === stage);
    }
  };
}
