const QPAY_BASE_URL = process.env.QPAY_ENV === "production"
  ? "https://merchant.qpay.mn/v2"
  : "https://merchant-sandbox.qpay.mn/v2";

const QPAY_CLIENT_ID = process.env.QPAY_CLIENT_ID!;
const QPAY_CLIENT_SECRET = process.env.QPAY_CLIENT_SECRET!;
const QPAY_INVOICE_CODE = process.env.QPAY_INVOICE_CODE!;

type QPayToken = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  fetched_at: number;
};

let cachedToken: QPayToken | null = null;

async function getAccessToken(): Promise<string> {
  if (
    cachedToken &&
    Date.now() - cachedToken.fetched_at < (cachedToken.expires_in - 60) * 1000
  ) {
    return cachedToken.access_token;
  }

  const credentials = Buffer.from(
    `${QPAY_CLIENT_ID}:${QPAY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${QPAY_BASE_URL}/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) {
    throw new Error(`QPay auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = { ...data, fetched_at: Date.now() };
  return data.access_token;
}

export type QPayInvoiceResponse = {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  urls: Array<{
    name: string;
    description: string;
    logo: string;
    link: string;
  }>;
};

export async function createInvoice(params: {
  orderNumber: string;
  amount: number;
  description: string;
  callbackUrl: string;
}): Promise<QPayInvoiceResponse> {
  const token = await getAccessToken();

  const res = await fetch(`${QPAY_BASE_URL}/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      invoice_code: QPAY_INVOICE_CODE,
      sender_invoice_no: params.orderNumber,
      invoice_receiver_code: "terminal",
      invoice_description: params.description,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`QPay invoice creation failed: ${error}`);
  }

  return res.json();
}

export type QPayPaymentCheck = {
  count: number;
  paid_amount: number;
  rows: Array<{
    payment_id: string;
    payment_status: string;
    payment_date: string;
    payment_amount: string;
  }>;
};

export async function checkPayment(
  invoiceId: string
): Promise<QPayPaymentCheck> {
  const token = await getAccessToken();

  const res = await fetch(`${QPAY_BASE_URL}/payment/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`QPay payment check failed: ${error}`);
  }

  return res.json();
}
