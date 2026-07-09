import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { dbConnect } from "@/lib/server/mongoose";
import { requireAdmin } from "@/lib/server/adminAuth";
import { buildCustomerRows } from "@/lib/server/customerStats";

export const dynamic = "force-dynamic";

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`; // DD/MM/YYYY
};

function addSheet(wb, name, rows) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "WhatsApp Opted In", key: "wa", width: 18 },
    { header: "Total Orders", key: "orders", width: 13 },
    { header: "Total Spend (₹)", key: "spend", width: 15 },
    { header: "First Order Date", key: "first", width: 16 },
    { header: "Last Order Date", key: "last", width: 16 },
    { header: "City", key: "city", width: 16 },
    { header: "State", key: "state", width: 16 },
  ];
  rows.forEach((r) => ws.addRow({
    name: r.name, email: r.email, phone: r.phone, wa: r.whatsappOptIn ? "Yes" : "No",
    orders: r.totalOrders, spend: r.totalSpend,
    first: fmtDate(r.firstOrderDate), last: fmtDate(r.lastOrderDate),
    city: r.city, state: r.state,
  }));
  const header = ws.getRow(1);
  header.height = 20;
  header.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B5E20" } }; // dark green
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };                          // white text
    c.alignment = { horizontal: "center", vertical: "middle" };
  });
  ws.getColumn("spend").numFmt = "#,##0"; // number, no currency symbol
}

// GET — Excel export. ?list=whatsapp → single WhatsApp-subscribers sheet; otherwise
// two sheets: "Customers" (all) + "WhatsApp Subscribers".
export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const rows = await buildCustomerRows();
    const waRows = rows.filter((r) => r.whatsappOptIn);
    const whatsappOnly = new URL(req.url).searchParams.get("list") === "whatsapp";

    const wb = new ExcelJS.Workbook();
    wb.creator = "RefurbishedKart";
    if (whatsappOnly) {
      addSheet(wb, "WhatsApp Subscribers", waRows);
    } else {
      addSheet(wb, "Customers", rows);
      addSheet(wb, "WhatsApp Subscribers", waRows);
    }

    const buffer = await wb.xlsx.writeBuffer();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = whatsappOnly ? `customers-whatsapp-${today}.xlsx` : `customers-export-${today}.xlsx`;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
