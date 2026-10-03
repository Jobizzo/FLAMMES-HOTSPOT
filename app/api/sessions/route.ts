import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const GET = withErrorHandling(async () => {
  const { data, error } = await getSupabaseServer().from("hotspot_sessions").select("*").order("startedAt", { ascending: false });
  if (error) throw new Error(error.message);
  const sessions = data ?? [];
  return NextResponse.json(successResponse({
    sessions,
    active: sessions.filter((s: any) => s.status === "active").length,
    total: sessions.length,
  }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  if (!body.customerId || !body.packageId || !body.routerId) {
    return NextResponse.json(errorResponse("customerId, packageId, and routerId are required"), { status: 400 });
  }

  const { data: pkg, error: packageError } = await getSupabaseServer()
    .from("hotspot_packages").select("durationMinutes").eq("id", body.packageId).single();
  if (packageError) throw new Error(packageError.message);

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + Number(pkg.durationMinutes) * 60000);

  const { data, error } = await getSupabaseServer().from("hotspot_sessions").insert({
    customerId: body.customerId,
    packageId: body.packageId,
    routerId: body.routerId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "active",
  }).select("*").single();

  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse(data), { status: 201 });
});
