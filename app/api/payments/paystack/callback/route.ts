import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabase-server";

type PaymentData = {
  status?: string;
  reference?: string;
  amount?: number;
  paid_at?: string | null;
  metadata?: Record<string, unknown>;
};

function validSignature(raw: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
}

async function verify(reference: string, secret: string): Promise<PaymentData> {
  const response = await fetch(
    "https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference),
    { headers: { Authorization: "Bearer " + secret }, cache: "no-store" }
  );
  const body: { status?: boolean; message?: string; data?: PaymentData } = await response.json();
  if (!response.ok || !body.status || !body.data) {
    throw new Error(body.message || "Unable to verify Paystack transaction.");
  }
  return body.data;
}

async function activate(transaction: Record<string, any>) {
  const packageId = transaction.packageId;
  const customerId = transaction.customerId;
  const routerId = transaction.routerId;
  if (!packageId || !customerId || !routerId) {
    return { activated: false, reason: "Missing packageId, customerId or routerId." };
  }

  const supabase = getSupabaseServer();
  const { data: pkg, error: packageError } = await supabase
    .from("packages")
    .select("name,duration_minutes,active")
    .eq("id", packageId)
    .single();

  if (packageError || !pkg || pkg.active === false) {
    return { activated: false, reason: "Package not found or inactive." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("hotspot_sessions")
    .select("id,status,expiresAt")
    .eq("customerId", customerId)
    .eq("packageId", packageId)
    .eq("routerId", routerId)
    .order("startedAt", { ascending: false })
    .limit(10);

  if (existingError) throw new Error(existingError.message);
  if ((existing || []).some((session: any) =>
    session.status === "active" && new Date(session.expiresAt).getTime() > Date.now()
  )) {
    return { activated: false, reason: "An active session already exists for this customer/package/router." };
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + Number(pkg.duration_minutes) * 60000);
  const { data, error } = await supabase
    .from("hotspot_sessions")
    .insert({
      customerId,
      packageId,
      routerId,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { activated: true, session: data };
}

async function processPayment(reference: string) {
  const secret = process.env.FLAMMES_PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack live secret key is not configured.");

  const payment = await verify(reference, secret);
  if (payment.status !== "success") {
    return { reference: payment.reference || reference, status: payment.status || "unknown", activated: false };
  }

  const metadata = payment.metadata || {};
  const transactionId = typeof metadata.transactionId === "string" ? metadata.transactionId : "";
  if (!transactionId) {
    return {
      reference: payment.reference || reference,
      status: "paid",
      amount: Number(payment.amount || 0) / 100,
      activated: false,
      reason: "No transactionId metadata was supplied.",
    };
  }

  const supabase = getSupabaseServer();
  const { data: transaction, error } = await supabase
    .from("hotspot_transactions")
    .select("*")
    .eq("id", transactionId)
    .single();

  if (error) throw new Error(error.message);

  const expectedAmount = Number(transaction.amount);
  const receivedAmount = Number(payment.amount || 0) / 100;
  if (Number.isFinite(expectedAmount) && Math.round(expectedAmount * 100) !== Math.round(receivedAmount * 100)) {
    throw new Error("Paystack amount does not match the stored transaction.");
  }

  if (transaction.status !== "paid") {
    const { error: updateError } = await supabase
      .from("hotspot_transactions")
      .update({
        status: "paid",
        paidAt: payment.paid_at || new Date().toISOString(),
        reference: payment.reference || reference,
        provider: "paystack",
      })
      .eq("id", transactionId);

    if (updateError) throw new Error(updateError.message);
  }

  return {
    reference: payment.reference || reference,
    status: "paid",
    amount: receivedAmount,
    transactionId,
    ...(await activate(transaction)),
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.FLAMMES_PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Paystack live secret key is not configured." }, { status: 503 });

  const rawBody = await req.text();
  if (!validSignature(rawBody, req.headers.get("x-paystack-signature"), secret)) {
    return NextResponse.json({ error: "Invalid Paystack signature." }, { status: 401 });
  }

  try {
    const payload: { data?: { reference?: string } } = JSON.parse(rawBody);
    const reference = payload.data?.reference;
    if (!reference) return NextResponse.json({ error: "Payment reference is missing." }, { status: 400 });
    return NextResponse.json({ received: true, ...(await processPayment(reference)) });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment processing failed." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });

  try {
    return NextResponse.json(await processPayment(reference));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed." },
      { status: 502 }
    );
  }
}
