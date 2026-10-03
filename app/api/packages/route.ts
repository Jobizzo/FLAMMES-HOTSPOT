import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const GET = withErrorHandling(async () => {
  const { data, error } = await supabaseAdmin
    .from("packages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const packages = (data ?? []).map((item: any) => ({
    ...item,
    durationMinutes: item.duration_minutes,
    status: item.active ? "active" : "inactive",
  }));

  return NextResponse.json(successResponse({ packages, total: packages.length }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price);
  const durationMinutes = Number(body.durationMinutes ?? body.duration_minutes);
  const speedMbps = Number(body.speedMbps ?? 0);
  const dataLimitMb =
    body.dataLimitMb == null || body.dataLimitMb === ""
      ? null
      : Number(body.dataLimitMb);

  if (
    !name ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return NextResponse.json(
      errorResponse("Name, price and validity are required"),
      { status: 400 }
    );
  }

  const insertRecord: Record<string, unknown> = {
    name,
    price,
    duration_minutes: durationMinutes,
    active: true,
  };

  // These fields are only written when the existing schema supports the
  // extended hotspot package model. The core package fields remain compatible
  // with the existing production packages table.
  if (Number.isFinite(speedMbps) && speedMbps > 0) insertRecord.speed_mbps = speedMbps;
  if (dataLimitMb !== null && Number.isFinite(dataLimitMb) && dataLimitMb > 0) {
    insertRecord.data_limit_mb = dataLimitMb;
  }

  const { data, error } = await supabaseAdmin
    .from("packages")
    .insert(insertRecord)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return NextResponse.json(
    successResponse({
      ...data,
      durationMinutes: data.duration_minutes,
      status: data.active ? "active" : "inactive",
    }),
    { status: 201 }
  );
});
