import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

async function activate(transaction: any) {
  if (!transaction.packageId || !transaction.customerId || !transaction.routerId) {
    return { activated: false, reason: "Missing packageId, customerId or routerId." };
  }
  const supabase = getSupabaseServer();
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("name,duration_minutes,active")
    .eq("id", transaction.packageId)
    .single();
  if (pkgError || !pkg || pkg.active === false) return { activated: false, reason: "Package not found or inactive." };

  const { data: existing, error: existingError } = await supabase
    .from("hotspot_sessions")
    .select("id,status,expiresAt")
    .eq("customerId", transaction.customerId)
    .eq("packageId", transaction.packageId)
    .eq("routerId", transaction.routerId)
    .order("startedAt", { ascending: false })
    .limit(10);
  if (existingError) throw new Error(existingError.message);
  if ((existing || []).some((s: any) => s.status === "active" && new Date(s.expiresAt).getTime() > Date.now())) {
    return { activated: false, reason: "An active session already exists for this customer/package/router." };
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + Number(pkg.duration_minutes) * 60000);
  const { data, error } = await supabase.from("hotspot_sessions").insert({
    customerId: transaction.customerId,
    packageId: transaction.packageId,
    routerId: transaction.routerId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "active",
  }).select("*").single();
  if (error) throw new Error(error.message);
  return { activated: true, session: data };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    const checkoutRequestId = callback?.CheckoutRequestID;
    if (!checkoutRequestId) return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

    const supabase = getSupabaseServer();
    const { data: transaction, error } = await supabase
      .from("hotspot_transactions")
      .select("*")
      .eq("checkoutRequestId", checkoutRequestId)
      .single();
    if (error || !transaction) return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

    const items = callback.CallbackMetadata?.Item || [];
    const getItem = (name: string) => items.find((item: any) => item.Name === name)?.Value;
    const paid = Number(callback.ResultCode) === 0;
    const update = {
      status: paid ? "paid" : "failed",
      paidAt: paid ? new Date().toISOString() : transaction.paidAt,
      resultCode: Number(callback.ResultCode),
      resultDescription: callback.ResultDesc || null,
      mpesaReceiptNumber: paid ? String(getItem("MpesaReceiptNumber") || "") : transaction.mpesaReceiptNumber,
    };

    const { error: updateError } = await supabase
      .from("hotspot_transactions")
      .update(update)
      .eq("id", transaction.id);
    if (updateError) throw new Error(updateError.message);

    const activation = paid ? await activate({ ...transaction, ...update }) : { activated: false };
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted", paymentStatus: update.status, ...activation });
  } catch (error: any) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted", error: error?.message || "Callback processing failed." });
  }
}
