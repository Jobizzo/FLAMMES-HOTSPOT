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
