function billingWireframe() {
  return {
    content: {
      brand: "Draftpine Billing",
      primaryAction: "Upgrade plan",
      nav: { usage: "Usage", invoices: "Invoices", plans: "Plans" },
      header: {
        eyebrow: "Startup founder view",
        title: "Usage billing dashboard",
        description: "Understand this month's usage, review invoice status, and choose whether to upgrade before the limit blocks growth."
      },
      notice: { title: "Usage warning:", prefix: "You are at", description: "of your monthly included runs. Upgrade before automations pause." },
      metrics: [
        { label: "Runs used", value: "92k / 100k", note: "Near limit" },
        { label: "Projected bill", value: "$428", note: "Includes overage" },
        { label: "Next invoice", value: "Jun 30", note: "End of period" }
      ],
      tabs: { usage: "Usage", invoices: "Invoices", plans: "Plans" },
      sections: {
        usage: { title: "Usage trend", description: "Placeholder chart blocks keep this prototype dependency-free." },
        invoices: { title: "Invoices", description: "Filter recent invoices and check payment state.", searchLabel: "Search invoices", searchPlaceholder: "Search by invoice or status" },
        plans: { title: "Plan comparison", description: "Choose the plan that matches expected run volume." }
      },
      emptyState: { title: "No invoices match this filter", description: "Clear the search to return to recent billing history.", action: "Clear search" },
      successState: { title: "Upgrade saved.", description: "The prototype shows the confirmation state after a plan change." },
      modal: {
        title: "Upgrade plan",
        selectedPlanLabel: "Selected plan",
        billingNoteLabel: "Billing note",
        billingNotePlaceholder: "Example: upgrade before next campaign launch",
        cancel: "Cancel",
        submit: "Save mock upgrade"
      },
      actions: { choose: "Choose" },
      table: { invoice: "Invoice", date: "Date", amount: "Amount", status: "Status" }
    },
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
    async init() {
      try {
        const response = await fetch("./content/pages/usage-billing-dashboard.json");
        if (!response.ok) return;
        const content = await response.json();
        this.content = content;
        this.usagePercent = content.usagePercent ?? this.usagePercent;
        this.metrics = {
          runs: content.metrics?.[0]?.value ?? this.metrics.runs,
          projectedBill: content.metrics?.[1]?.value ?? this.metrics.projectedBill,
          nextInvoice: content.metrics?.[2]?.value ?? this.metrics.nextInvoice
        };
        this.usageBars = content.usageBars ?? this.usageBars;
        this.invoices = content.invoices ?? this.invoices;
        this.plans = content.plans ?? this.plans;
        this.selectedPlan = this.plans[1]?.name ?? this.plans[0]?.name ?? this.selectedPlan;
      } catch {
        /* Keep inline fallback so the prototype still renders if opened directly. */
      }
    },
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
