function onboardingTemplate() {
  return {
    modalOpen: false,
    invited: false,
    teammates: [],
    tasks: [
      { label: "Create workspace", description: "Name the team and set the account owner.", done: true },
      { label: "Connect data", description: "Mock the integration step before real setup.", done: false },
      { label: "Invite teammate", description: "Show the collaborative setup moment.", done: false }
    ],
    get progress() {
      const done = this.tasks.filter((task) => task.done).length;
      return Math.round((done / this.tasks.length) * 100);
    }
  };
}

