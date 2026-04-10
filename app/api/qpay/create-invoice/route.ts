import { NextRequest, NextResponse } from "next/server";
import { createInvoice } from "@/lib/qpay";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId шаардлагатай" },
        { status: 400 }
      );
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total_amount")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Захиалга олдсонгүй" },
        { status: 404 }
      );
    }

    // Determine callback URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/qpay/callback`;

    // Create QPay invoice
    const invoice = await createInvoice({
      orderNumber: order.order_number,
      amount: order.total_amount,
      description: `Silver Cup - ${order.order_number}`,
      callbackUrl,
    });

    // Save payment record
    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "qpay",
      invoice_id: invoice.invoice_id,
      amount: order.total_amount,
      status: "pending",
      qr_text: invoice.qr_text,
      raw_payload: invoice,
    });

    return NextResponse.json({
      invoice_id: invoice.invoice_id,
      qr_image: invoice.qr_image,
      qr_text: invoice.qr_text,
      urls: invoice.urls,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
