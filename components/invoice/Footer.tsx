"use client";

import { InvoiceData } from "@/lib/schema";

type FooterProps = {
  invoice: InvoiceData;
};

export function Footer({ invoice }: FooterProps) {
  const {
    bank: { cardNumber, iban, phone, social },
  } = invoice;

  return (
    <>
      <div className="footer">
        <div className="footer-section">
          <span className="footer-label">شماره کارت بانک سامان:</span>
          <span className="footer-value" dir="ltr">
            {cardNumber || "6219 8610 6115 1287"}
          </span>
          <span className="footer-label">به نام فاطمه احمدی</span>
        </div>
        <div className="footer-section">
          <span className="footer-label">شماره شبا:</span>
          <span className="footer-value">
            {iban || "IR 28 0560 9002 7000 3111 5090 01"}
          </span>
        </div>
        <div className="footer-section">
          <span className="footer-label">شماره تماس:</span>
          <span className="footer-value" dir="ltr">
            {phone || "+98 992 097 6964"}
          </span>
          <br />
          <span className="footer-label">آی دی تلگرام و اینستاگرام:</span>
          <span className="footer-value">{social || "ahmadiftme"}</span>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: "50px",
          backgroundColor: "#181818",
          position: "relative",
          bottom: "-30px",
        }}
      />
    </>
  );
}
