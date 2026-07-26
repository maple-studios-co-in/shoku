import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import AutoPrint from "../../AutoPrint";

export const dynamic = "force-dynamic";

// Kitchen Order Ticket — big items + qty, no prices.
export default async function KotPrint({ params }) {
  const gate = await requireAdmin();
  if (gate.error) return <p style={{ fontFamily: "monospace", padding: 20 }}>Sign in as café staff to print.</p>;

  const order = await prisma.order.findFirst({
    where: { id: (await params).id, tenantId: gate.tenantId },
    include: { items: true },
  });
  if (!order) return <p style={{ fontFamily: "monospace", padding: 20 }}>Order not found.</p>;

  const when = new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="tkt">
      <AutoPrint />
      <div className="c b xl">*** KOT ***</div>
      <div className="row b"><span>{order.invoiceNo || `#${order.id.slice(-6).toUpperCase()}`}</span><span>{when}</span></div>
      <div className="row"><span>{order.tableLabel ? `TABLE ${order.tableLabel}` : "COUNTER"}</span><span>{order.fulfilment.toUpperCase()}</span></div>
      <div className="hr" />
      {order.items.map((i) => (
        <div className="item" key={i.id}>
          <span className="qty">{i.qty}×</span>
          <span>{i.name}{i.size && i.size !== "Regular" ? ` — ${i.size}` : ""}{i.milk ? ` · ${i.milk}` : ""}</span>
        </div>
      ))}
      <div className="hr" />
      <style>{`
        *{ margin:0; padding:0; box-sizing:border-box; }
        body{ background:#fff; }
        .tkt{ width:72mm; margin:0 auto; padding:4mm 2mm; font-family:ui-monospace,Menlo,Consolas,monospace; color:#000; }
        .c{ text-align:center; } .b{ font-weight:700; } .xl{ font-size:17px; margin-bottom:4px; }
        .row{ display:flex; justify-content:space-between; font-size:12px; }
        .hr{ border-top:1px dashed #000; margin:6px 0; }
        .item{ display:flex; gap:8px; font-size:16px; font-weight:700; padding:3px 0; }
        .item .qty{ min-width:26px; }
        @media print{ @page{ margin:0; size:80mm auto; } .tkt{ padding:2mm; } }
      `}</style>
    </div>
  );
}
