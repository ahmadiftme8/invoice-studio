"use client";

import { InvoiceItem } from "@/lib/schema";
import { englishToPersian, formatPersianNumber } from "./utils";

type ItemsTableProps = {
  items: InvoiceItem[];
  editable?: boolean;
  onItemChange?: (
    id: string,
    changes: Partial<Omit<InvoiceItem, "id" | "lineTotal">>,
  ) => void;
};

export function ItemsTable({ items, editable }: ItemsTableProps) {
  const allowEditing = editable ?? true;

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style={{ width: "6%" }}>ردیف</th>
            <th style={{ width: "35%" }}>شرح خدمات / کالا</th>
            <th style={{ width: "8%" }}>تعداد</th>
            <th style={{ width: "8%" }}>اتود</th>
            <th style={{ width: "8%" }}>ویرایش</th>
            <th style={{ width: "15%" }}>
              قیمت واحد <span style={{ fontSize: "10px" }}>(ریال)</span>
            </th>
            <th style={{ width: "14%" }}>
              مبلغ کل <span style={{ fontSize: "10px" }}>(ریال)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td>{englishToPersian((index + 1).toString())}</td>
              <td className="text-right">{item.name}</td>
              <td
                contentEditable={allowEditing}
                suppressContentEditableWarning
              >
                {formatPersianNumber(item.quantity)}
              </td>
              <td>{formatPersianNumber(item.drafts)}</td>
              <td>{formatPersianNumber(item.edits)}</td>
              <td
                contentEditable={allowEditing}
                suppressContentEditableWarning
              >
                {formatPersianNumber(item.unitPrice)}
              </td>
              <td>{formatPersianNumber(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
