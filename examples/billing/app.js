function billingExample() {
  return {
    tab: "invoices",
    query: "",
    modalOpen: false,
    saved: false,
    metrics: [
      { label: "Runs used", value: "92k", note: "Near limit" },
      { label: "Projected bill", value: "$428", note: "Includes overage" },
      { label: "Next invoice", value: "Jun 30", note: "End of period" }
    ],
    invoices: [
      { id: "INV-1042", amount: "$328", status: "Open" },
      { id: "INV-1041", amount: "$290", status: "Paid" }
    ],
    plans: [
      { name: "Growth", price: "$299/mo" },
      { name: "Scale", price: "$699/mo" }
    ],
    get filteredInvoices() {
      const query = this.query.toLowerCase().trim();
      if (!query) return this.invoices;
      return this.invoices.filter((invoice) => `${invoice.id} ${invoice.amount} ${invoice.status}`.toLowerCase().includes(query));
    }
  };
}

