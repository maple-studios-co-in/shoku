import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import AutoPrint from "../../AutoPrint";

export const dynamic = "force-dynamic";

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

// 80mm GST invoice — thermal-printer friendly (72mm content, mono, high contrast).
export default async function InvoicePrint({ params }) {
  const gate = await requireAdmin();
  if (gate.error) return <p style={{ fontFamily: "monospace", padding: 20 }}>Sign in as café staff to print.</p>;

  const order = await prisma.order.findFirst({
    where: { id: (await params).id, tenantId: gate.tenantId },
    include: { items: true, user: true },
  });
  if (!order) return <p style={{ fontFamily: "monospace", padding: 20 }}>Order not found.</p>;
  const tenant = await prisma.tenant.findUnique({ where: { id: gate.tenantId } });

  const when = new Date(order.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="tkt">
      <AutoPrint />
      <div className="c b lg">{tenant.storeName || tenant.name}</div>
      {tenant.address && <div className="c sm">{tenant.address}</div>}
      {tenant.gstin && <div className="c sm">GSTIN: {tenant.gstin}</div>}
      <div className="hr" />
      <div className="row"><span>{order.invoiceNo || `#${order.id.slice(-6).toUpperCase()}`}</span><span>{when}</span></div>
      <div className="row sm"><span>Payment: {(order.paymentMethod || order.payment || "").toUpperCase()}</span><span>{order.tableLabel ? `Table ${order.tableLabel}` : "Counter"}</span></div>
      <div className="hr" />
      {order.items.map((i) => (
        <div className="row" key={i.id}>
          <span>{i.qty} × {i.name}{i.size && i.size !== "Regular" ? ` (${i.size})` : ""}</span>
          <span>{inr(i.unit * i.qty)}</span>
        </div>
      ))}
      <div className="hr" />
      <div className="row"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
      {order.discount > 0 && <div className="row"><span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span><span>−{inr(order.discount)}</span></div>}
      {order.loyaltyDiscount > 0 && <div className="row"><span>Reward</span><span>−{inr(order.loyaltyDiscount)}</span></div>}
      {order.reward > 0 && <div className="row"><span>Member saving</span><span>−{inr(order.reward)}</span></div>}
      <div className="row"><span>CGST {((tenant.gstRate ?? 5) / 2).toFixed(1)}%</span><span>{inr(order.cgst || Math.floor(order.tax / 2))}</span></div>
      <div className="row"><span>SGST {((tenant.gstRate ?? 5) / 2).toFixed(1)}%</span><span>{inr(order.sgst || order.tax - Math.floor(order.tax / 2))}</span></div>
      <div className="row b lg"><span>TOTAL</span><span>{inr(order.total)}</span></div>
      <div className="hr" />
      <div className="c sm">Thank you! Powered by Shoku · getshoku.com</div>

      <style>{`
        *{ margin:0; padding:0; box-sizing:border-box; }
        body{ background:#fff; }
        .tkt{ width:72mm; margin:0 auto; padding:4mm 2mm; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:11.5px; color:#000; line-height:1.5; }
        .c{ text-align:center; } .b{ font-weight:700; } .lg{ font-size:14px; } .sm{ font-size:10px; }
        .row{ display:flex; justify-content:space-between; gap:6px; }
        .row span:first-child{ flex:1; }
        .hr{ border-top:1px dashed #000; margin:6px 0; }
        @media print{ @page{ margin:0; size:80mm auto; } .tkt{ padding:2mm; } }
      `}</style>
    </div>
  );
}
