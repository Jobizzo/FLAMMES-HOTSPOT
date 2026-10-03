import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabase-server";

function signatureValid(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function verifyPaystack(reference: string, secret: string) {
  const response = await fetch(
    "https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference),
    { headers: { Authorization: "Bearer " + secret }, cache: "no-store" }
  );
  const data = await response.json();
  if (!response.ok || !data.status || !data.data) throw new Error(data.message || "Unable to verify Paystack transaction.");
  return data.data;
}

async function activateSession(transaction: any) {
  const supabase = getSupabaseServer();
  const packageId = transaction.packageId;
  const customerId = transaction.customerId;
  const routerId = transaction.routerId;
  if (!packageId || !customerId || !routerId) return { activated: false, reason: "Missing packageId, customerId or routerId." };

  const { data: pkg, error: packageError } = await supabase
    .from("packages")
    .select("name,duration_minutes,active")
    .eq("id", packageId)
    .single();
  if (packageError || !pkg || pkg.active === false) return { activated: false, reason: "Package not found or inactive." };

  const { data: existing, error: existingError } = await supabase
    .from("hotspot_sessions")
    .select("id,status,expiresAt")
    .eq("customerId", customerId)
    .eq("packageId", packageId)
    .eq("routerId", routerId)
    .order("startedAt", { ascending: false })
    .limit(10);
  if (existingError) throw new Error(existingError.message);
  if ((existing || []).some((s: any) => s.status === "active" && new Date(s.expiresAt).getTime() > Date.now())) {
    return { activated: false, reason: "An active session already exists for this customer/package/router." };
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + Number(pkg.duration_minutes) * 60000);
  const { data, error } = await supabase.from("hotspot_sessions").insert({
    customerId,
    packageId,
    routerId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "active",
  }).select("*").single();
  if (error) throw new Error(error.message);
  return { activated: true, session: data };
}

async function process(reference: string) {
  const secret = process.env.FLAMMES_PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack live secret key is not configured.");

  const payment = await verifyPaystack(reference, secret);
  const metadata = payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {};
  const transactionId = typeof metadata.transactionId === "string" ? metadata.transactionId : "";
  const supabase = getSupabaseServer();

  if (payment.status !== "success") {
    return { reference: payment.reference, status: payment.status, activated: false };
  }

  if (transactionId) {
    const { data: transaction, error } = await supabase
      .from("hotspot_transactions")
      .select("*")
      .eq("id", transactionId)
      .single();
    if (error) throw new Error(error.message);

    const expectedAmount = Number(transaction.amount);
    const receivedAmount = Number(payment.amount) / 100;
    if (Number.isFinite(expectedAmount) && Math.round(expectedAmount * 100) !== Number(payment.amount)) {
      throw new Error("Paystack amount does not match the stored transaction.");
    }

    if (transaction.status !== "paid") {
      const { error: updateError } = await supabase
        .from("hotspot_transactions")
        .update({
          status: "paid",
          paidAt: payment.paid_at || new Date().toISOString(),
          reference: payment.reference,
          provider: "paystack",
        })
        .eq("id", transactionId);
      if (updateError) throw new Error(updateError.message);
    }

    const activation = await activateSession({ ...transaction, status: "paid" });
    return { reference: payment.reference, status: "paid", amount: receivedAmount, transactionId, ...activation };
  }

  return { reference: payment.reference, status: "paid", amount: Number(payment.amount) / 100, activated: false, reason: "No transactionId metadata was supplied." };
}

export async function POST(req: NextRequest) {
  const secret = process.env.FLAMMES_PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Paystack live secret key is not configured." }, { status: 503 });

  const rawBody = await req.text();
  if (!signatureValid(rawBody, req.headers.get("x-paystack-signature"), secret)) {
    return NextResponse.json({ error: "Invalid Paystack signature." }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const reference = payload?.data?.reference;
    if (!reference) return NextResponse.json({ error: "Payment reference is missing." }, { status: 400 });
    const result = await process(String(reference));
    return NextResponse.json({ received: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Payment processing failed." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
  try {
    const result = await process(reference);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Payment verification failed." }, { status: 502 });
  }
}
