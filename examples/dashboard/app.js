function dashboardExample() {
  return {
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
    get filteredActivity() {
      const query = this.query.toLowerCase().trim();
      if (!query) return this.activity;
      return this.activity.filter((item) => `${item.item} ${item.owner} ${item.status}`.toLowerCase().includes(query));
    }
  };
}

