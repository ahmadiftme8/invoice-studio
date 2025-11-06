"use client";

import { InvoiceData } from "@/lib/schema";
import { englishToPersian } from "./utils";

type HeaderProps = {
  invoice: InvoiceData;
};

export function Header({ invoice }: HeaderProps) {
  const {
    meta,
    customer: { name: customerName, phone: customerPhone, email: customerEmail },
  } = invoice;

  const invoiceNumber =
    meta.number && meta.number.trim() ? englishToPersian(meta.number) : "۱۴۰۴۰۶۰۶";
  const invoiceDate =
    meta.issueDate && meta.issueDate.trim()
      ? englishToPersian(meta.issueDate)
      : "۱۴۰۴/۶/۶";
  const customerContact = customerPhone || customerEmail || "smokers.tehran@";

  return (
    <>
      <div className="header">
        <div className="header-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            style={{ width: "100px", position: "relative", top: "-35px" }}
            src="/images/Asset1.png"
            alt="لوگو"
          />
        </div>
        <div className="header-center">
          <h1>{meta.title || "فاکتور فروش"}</h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "4px", fontWeight: 500 }}>
            {meta.subtitle || "خدمـات طراحـی گرافیـک"}
          </p>
        </div>
        <div className="header-right">
          <div className="invoice-meta">
            <div className="meta-item">
              <span className="meta-label">شماره:</span>
              <span className="meta-value" id="invoice-number">
                {invoiceNumber}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">تاریخ:</span>
              <span className="meta-value" id="invoice-date">
                {invoiceDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="customer-info">
        <div className="info-section">
          <h3>نام سفارش دهنده:</h3>
          <p>{customerName || "اسموکرز  |  Smokers"}</p>
        </div>
        <div className="info-section">
          <h3>شماره تماس مشتری:</h3>
          <p  >{customerContact}</p>
        </div>
      </div>
    </>
  );
}
