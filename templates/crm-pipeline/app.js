function pipelineTemplate() {
  return {
    query: "",
    modalOpen: false,
    saved: false,
    stages: ["Qualified", "Proposal", "Closing"],
    deals: [
      { account: "Northwind", value: "$18k", stage: "Qualified" },
      { account: "Globex", value: "$42k", stage: "Proposal" },
      { account: "Initech", value: "$27k", stage: "Closing" }
    ],
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

