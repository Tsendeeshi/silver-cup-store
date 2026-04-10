import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkPayment } from "@/lib/qpay";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId шаардлагатай" },
        { status: 400 }
      );
    }

    // Get payment record
    const { data: payment } = await supabase
      .from("payments")
      .select("invoice_id, status")
      .eq("order_id", orderId)
      .eq("provider", "qpay")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!payment) {
      return NextResponse.json(
        { error: "Төлбөрийн мэдээлэл олдсонгүй" },
        { status: 404 }
      );
    }

    // Already paid
    if (payment.status === "paid") {
      return NextResponse.json({ status: "paid" });
    }

    // Check with QPay
    const result = await checkPayment(payment.invoice_id!);

    if (result.count > 0 && result.rows[0]?.payment_status === "PAID") {
      // Update payment
      await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: result.rows[0].payment_date,
        })
        .eq("invoice_id", payment.invoice_id);

      // Update order
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      return NextResponse.json({ status: "paid" });
    }

    return NextResponse.json({ status: "pending" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
