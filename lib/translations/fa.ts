const invoiceStatusFa = {
  draft: "پیش‌نویس",
  final: "نهایی",
};

const invoiceItemRowFa = {
  work: "خدمت",
  qty: "تعداد",
  drafts: "پیش‌نویس",
  edits: "ویرایش",
  total: "جمع",
};

const fa = {
  common: {
    actions: {
      save: "ذخیره",
      cancel: "انصراف",
      close: "بستن",
      add: "افزودن",
      edit: "ویرایش",
      delete: "حذف",
      update: "به‌روزرسانی",
      print: "چاپ",
      export: "صدور PDF",
      convertToFinal: "تبدیل به فاکتور نهایی",
    },
    confirmations: {
      deleteWork: "آیا از حذف این خدمت مطمئن هستید؟",
    },
    status: {
      pending: "در انتظار",
      draft: invoiceStatusFa.draft,
      final: invoiceStatusFa.final,
    },
  },
  dashboard: {
    title: "داشبورد حسابدار",
    subtitle: "عملکرد مالی و پروژه‌های فعال را در یک نگاه مدیریت کنید.",
    cards: {
      invoices: "تعداد فاکتورها",
      clients: "مشتریان",
      works: "خدمات",
      revenue: "درآمد کل",
    },
    quickActions: {
      title: "اقدامات سریع",
      newInvoice: "فاکتور جدید",
      addWork: "افزودن خدمت",
      addClient: "افزودن مشتری",
    },
    toggles: {
      themeLight: "تم روشن",
      themeDark: "تم تیره",
      languageFa: "فارسی",
      languageEn: "English",
    },
  },
  works: {
    title: "مدیریت خدمات",
    subtitle:
      "تعرفه خدمات و هزینه بازبینی‌ها را مدیریت کنید تا محاسبات فاکتور دقیق بماند.",
    table: {
      work: "عنوان خدمت",
      basePrice: "قیمت پایه",
      draftPrice: "هزینه هر پیش‌نویس",
      editPrice: "هزینه هر ویرایش",
      createdAt: "تاریخ ثبت",
      actions: "اقدامات",
    },
    empty: "هنوز خدمتی ثبت نشده است.",
    form: {
      title: "عنوان خدمت",
      basePrice: "قیمت پایه (ریال)",
      draftPrice: "هزینه هر پیش‌نویس (ریال)",
      editPrice: "هزینه هر ویرایش (ریال)",
      submitNew: "ثبت خدمت",
      submitUpdate: "ذخیره تغییرات",
    },
    messages: {
      created: "خدمت با موفقیت افزوده شد.",
      updated: "خدمت ویرایش شد.",
      deleted: "خدمت حذف شد.",
    },
  },
  clients: {
    quickForm: {
      title: "افزودن مشتری",
      name: "نام مشتری",
      phone: "شماره تماس",
      instagram: "اینستاگرام",
      submit: "ذخیره مشتری",
    },
  },
  invoices: {
    list: {
      title: "مدیریت فاکتورها",
      subtitle:
        "فاکتورهای صادر شده را بررسی کنید یا فاکتور جدیدی برای مشتریان بسازید.",
      columns: {
        number: "شماره",
        client: "مشتری",
        total: "مبلغ قابل پرداخت",
        type: "نوع",
        date: "تاریخ",
        actions: "اقدامات",
      },
      empty: "هنوز فاکتوری ثبت نشده است.",
    },
    editor: {
      newTitle: "ساخت فاکتور جدید",
      editTitle: "ویرایش فاکتور",
      invoiceType: "نوع فاکتور",
      invoiceNumber: "شماره فاکتور",
      issueDate: "تاریخ صدور",
      client: "مشتری",
      addClient: "افزودن مشتری جدید",
      addWork: "افزودن خدمت",
      items: "ردیف‌های فاکتور",
      taxRate: "درصد مالیات",
      discount: "تخفیف (ریال)",
      currency: "واحد پول",
      totals: "جمع کل",
      saveDraft: "ذخیره فاکتور",
      updateInvoice: "به‌روزرسانی فاکتور",
      convertToFinal: "تبدیل به فاکتور نهایی",
    },
    itemRow: invoiceItemRowFa,
    messages: {
      status: invoiceStatusFa,
      itemRow: invoiceItemRowFa,
      saved: "فاکتور ذخیره شد.",
      updated: "فاکتور به‌روزرسانی شد.",
      converted: "فاکتور نهایی جدید ایجاد شد.",
      validation: {
        selectClient: "لطفاً مشتری را انتخاب کنید.",
        addWork: "حداقل یک خدمت به فاکتور اضافه کنید.",
      },
    },
  },
};

export default fa;
