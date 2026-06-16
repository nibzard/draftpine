function getInitialDraftpineTheme() {
  const storedTheme = localStorage.getItem("draftpine-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function onboardingExample() {
  return {
    theme: "light",
    modalOpen: false,
    invited: false,
    teammates: [],
    tasks: [
      { label: "Create workspace", description: "Name the team and set the account owner.", done: true },
      { label: "Connect data", description: "Mock the integration step before real setup.", done: false },
      { label: "Invite teammate", description: "Show the collaborative setup moment.", done: false }
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
    get progress() {
      const done = this.tasks.filter((task) => task.done).length;
      return Math.round((done / this.tasks.length) * 100);
    }
  };
}
