import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const customerId = body.customerId ? String(body.customerId) : null;
  const routerId = body.routerId ? String(body.routerId) : null;
  if (!code) return NextResponse.json(errorResponse("Voucher code is required"), { status: 400 });

  const db = getSupabaseServer();
  const { data: voucher, error: voucherError } = await db
    .from("hotspot_vouchers").select("*").eq("code", code).single();
  if (voucherError) return NextResponse.json(errorResponse("Invalid voucher"), { status: 404 });
  if (voucher.status !== "unused") return NextResponse.json(errorResponse("Voucher has already been used or is unavailable"), { status: 409 });

  const { data: pkg, error: packageError } = await db
    .from("hotspot_packages").select("*").eq("id", voucher.packageId).single();
  if (packageError) throw new Error(packageError.message);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + Number(pkg.durationMinutes) * 60000);
  let session = null;

  if (customerId && routerId) {
    const { data, error } = await db.from("hotspot_sessions").insert({
      customerId, packageId: pkg.id, routerId,
      startedAt: now.toISOString(), expiresAt: expiresAt.toISOString(), status: "active"
    }).select("*").single();
    if (error) throw new Error(error.message);
    session = data;
  }

  const { error: updateError } = await db.from("hotspot_vouchers").update({
    status: "used", usedAt: now.toISOString(), usedBy: customerId
  }).eq("id", voucher.id).eq("status", "unused");
  if (updateError) throw new Error(updateError.message);

  return NextResponse.json(successResponse({ voucher: { ...voucher, status: "used" }, package: pkg, session }));
});
