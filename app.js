function billingWireframe() {
  return {
    tab: "usage",
    invoiceQuery: "",
    modalOpen: false,
    selectedPlan: "Growth",
    billingNote: "",
    upgradeSaved: false,
    usagePercent: 92,
    metrics: {
      runs: "92k / 100k",
      projectedBill: "$428",
      nextInvoice: "Jun 30"
    },
    usageBars: [
      { label: "Jan", value: 38 },
      { label: "Feb", value: 46 },
      { label: "Mar", value: 54 },
      { label: "Apr", value: 63 },
      { label: "May", value: 76 },
      { label: "Jun", value: 92 }
    ],
    invoices: [
      { id: "INV-1042", date: "Jun 1", amount: "$328", status: "Open" },
      { id: "INV-1041", date: "May 1", amount: "$290", status: "Paid" },
      { id: "INV-1040", date: "Apr 1", amount: "$240", status: "Paid" }
    ],
    plans: [
      { name: "Starter", price: "$99/mo", description: "For early usage and occasional automations." },
      { name: "Growth", price: "$299/mo", description: "More included runs with predictable overage." },
      { name: "Scale", price: "$699/mo", description: "Higher limits for launch weeks and busy teams." }
    ],
    get filteredInvoices() {
      const query = this.invoiceQuery.trim().toLowerCase();
      if (!query) return this.invoices;
      return this.invoices.filter((invoice) =>
        `${invoice.id} ${invoice.date} ${invoice.amount} ${invoice.status}`.toLowerCase().includes(query)
      );
    },
    openUpgrade(plan) {
      if (plan) this.selectedPlan = plan.name;
      this.upgradeSaved = false;
      this.modalOpen = true;
    },
    saveUpgrade() {
      this.modalOpen = false;
      this.upgradeSaved = true;
    }
  };
}

