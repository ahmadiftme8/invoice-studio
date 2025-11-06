"use client";

import { InvoiceData } from "@/lib/schema";
import { formatPersianCurrency } from "./utils";

type SummaryProps = {
  totals: InvoiceData["totals"];
};

export function Summary({ totals }: SummaryProps) {
  const subtotal = formatPersianCurrency(totals.subtotal) || "۷,۵۰۰,۰۰۰ ریال";
  const tax = formatPersianCurrency(totals.tax) || "۰ ریال";
  const discount = formatPersianCurrency(totals.discount) || "۰ ریال";
  const payable = formatPersianCurrency(totals.payable) || "۷,۵۰۰,۰۰۰ ریال";

  return (
    <div className="summary-box" style={{ marginLeft: "16px" }}>
      <div className="summary-row total">
        <span className="summary-label">جمع کل:</span>
        <span>{subtotal}</span>
      </div>
      <div className="summary-row">
        <span className="summary-label">مالیات:</span>
        <span>{tax}</span>
      </div>
      <div className="summary-row">
        <span className="summary-label">تخفیف:</span>
        <span>{discount}</span>
      </div>
      <div className="summary-row payable" style={{ backgroundColor: "#181818" }}>
        <span className="summary-label" style={{ color: "#f1f1f1" }}>
          مبلغ قابل پرداخت:
        </span>
        <span style={{ color: "#f1f1f1" }}>{payable}</span>
      </div>
    </div>
  );
}
