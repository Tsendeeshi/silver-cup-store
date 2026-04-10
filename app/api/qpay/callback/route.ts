import { NextRequest, NextResponse } from "next/server";
import { checkPayment } from "@/lib/qpay";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // QPay sends callback when payment is made
    // We verify by checking payment status via API (don't trust callback alone)
    const body = await req.json();
    const invoiceId = body?.invoice_id;

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }

    // Verify payment with QPay
    const result = await checkPayment(invoiceId);

    if (result.count > 0 && result.rows[0]?.payment_status === "PAID") {
      // Update payment record
      await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: result.rows[0].payment_date,
        })
        .eq("invoice_id", invoiceId);

      // Update order payment status
      const { data: payment } = await supabase
        .from("payments")
        .select("order_id")
        .eq("invoice_id", invoiceId)
        .single();

      if (payment) {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.order_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
