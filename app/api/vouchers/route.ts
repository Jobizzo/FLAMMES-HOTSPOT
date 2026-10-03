import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

function makeCode() {
  return randomBytes(5).toString("hex").toUpperCase();
}

export const GET = withErrorHandling(async () => {
  const { data, error } = await getSupabaseServer().from("hotspot_vouchers").select("*").order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse({ vouchers: data ?? [], total: data?.length ?? 0 }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const packageId = String(body.packageId || "");
  const quantity = Math.min(Math.max(Number(body.quantity || 1), 1), 500);
  if (!packageId || !Number.isInteger(quantity)) {
    return NextResponse.json(errorResponse("packageId and a valid quantity are required"), { status: 400 });
  }

  const db = getSupabaseServer();
  const { data: pkg, error: packageError } = await db.from("hotspot_packages").select("id").eq("id", packageId).single();
  if (packageError) throw new Error(packageError.message);

  const rows = Array.from({ length: quantity }, () => ({
    code: makeCode(),
    packageId: pkg.id,
    status: "unused",
    createdAt: Date.now()
  }));

  const { data, error } = await db.from("hotspot_vouchers").insert(rows).select("*");
  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse({ vouchers: data ?? [], total: data?.length ?? 0 }), { status: 201 });
});
