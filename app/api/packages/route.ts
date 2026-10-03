import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const GET = withErrorHandling(async () => {
  const { data, error } = await getSupabaseServer().from("hotspot_packages").select("*").order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse({ packages: data ?? [], total: data?.length ?? 0 }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price), durationMinutes = Number(body.durationMinutes), speedMbps = Number(body.speedMbps ?? 0);
  const dataLimitMb = body.dataLimitMb == null || body.dataLimitMb === "" ? null : Number(body.dataLimitMb);
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(durationMinutes) || durationMinutes <= 0 || !Number.isFinite(speedMbps) || speedMbps <= 0) {
    return NextResponse.json(errorResponse("Name, price, validity and speed are required"), { status: 400 });
  }
  if (dataLimitMb !== null && (!Number.isFinite(dataLimitMb) || dataLimitMb <= 0)) {
    return NextResponse.json(errorResponse("Data limit must be a positive number"), { status: 400 });
  }
  const { data, error } = await getSupabaseServer().from("hotspot_packages").insert({
    name, price, durationMinutes, speedMbps, dataLimitMb, status: "active", createdAt: Date.now()
  }).select("*").single();
  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse(data), { status: 201 });
});
