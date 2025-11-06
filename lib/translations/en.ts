const invoiceStatusEn = {
  draft: "Draft",
  final: "Final",
};

const invoiceItemRowEn = {
  work: "Work",
  qty: "Qty",
  drafts: "Drafts",
  edits: "Edits",
  total: "Total",
};

const en = {
  common: {
    actions: {
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      update: "Update",
      print: "Print",
      export: "Export PDF",
      convertToFinal: "Convert to Final",
    },
    confirmations: {
      deleteWork: "Are you sure you want to delete this work item?",
    },
    status: {
      pending: "Pending",
      draft: invoiceStatusEn.draft,
      final: invoiceStatusEn.final,
    },
  },
  dashboard: {
    title: "Accountant Dashboard",
    subtitle: "Review invoices, clients, and revenue at a glance.",
    cards: {
      invoices: "Invoices",
      clients: "Clients",
      works: "Works",
      revenue: "Revenue",
    },
    quickActions: {
      title: "Quick Actions",
      newInvoice: "New Invoice",
      addWork: "Add Work",
      addClient: "Add Client",
    },
    toggles: {
      themeLight: "Light Theme",
      themeDark: "Dark Theme",
      languageFa: "فارسی",
      languageEn: "English",
    },
  },
  works: {
    title: "Works Management",
    subtitle: "Keep work pricing and revision fees up to date for accurate invoicing.",
    table: {
      work: "Work",
      basePrice: "Base Price",
      draftPrice: "Draft Price",
      editPrice: "Edit Price",
      createdAt: "Created",
      actions: "Actions",
    },
    empty: "No works have been added yet.",
    form: {
      title: "Work title",
      basePrice: "Base price (Rial)",
      draftPrice: "Draft charge (Rial)",
      editPrice: "Edit charge (Rial)",
      submitNew: "Create work",
      submitUpdate: "Save changes",
    },
    messages: {
      created: "Work created.",
      updated: "Work updated.",
      deleted: "Work removed.",
    },
  },
  clients: {
    quickForm: {
      title: "Add client",
      name: "Client name",
      phone: "Phone number",
      instagram: "Instagram",
      submit: "Save client",
    },
  },
  invoices: {
    list: {
      title: "Invoices",
      subtitle: "Browse existing invoices or create a new one for your clients.",
      columns: {
        number: "Number",
        client: "Client",
        total: "Payable",
        type: "Type",
        date: "Date",
        actions: "Actions",
      },
      empty: "No invoices yet.",
    },
    editor: {
      newTitle: "New invoice",
      editTitle: "Edit invoice",
      invoiceType: "Invoice type",
      invoiceNumber: "Number",
      issueDate: "Issue date",
      client: "Client",
      addClient: "Add client",
      addWork: "Add work",
      items: "Invoice items",
      taxRate: "Tax rate",
      discount: "Discount (Rial)",
      currency: "Currency",
      totals: "Totals",
      saveDraft: "Save invoice",
      updateInvoice: "Update invoice",
      convertToFinal: "Convert to final",
    },
    itemRow: invoiceItemRowEn,
    messages: {
      status: invoiceStatusEn,
      itemRow: invoiceItemRowEn,
      saved: "Invoice saved.",
      updated: "Invoice updated.",
      converted: "Final invoice created.",
      validation: {
        selectClient: "Please select a client first.",
        addWork: "Add at least one work item.",
      },
    },
  },
};

export default en;
