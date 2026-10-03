import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

function validMac(value: string) {
  return /^([0-9A-F]{2}[:-]){5}[0-9A-F]{2}$/i.test(value);
}

export const GET = withErrorHandling(async () => {
  const { data, error } = await getSupabaseServer().from("hotspot_devices").select("*").order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse({ devices: data ?? [], total: data?.length ?? 0 }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const macAddress = typeof body.macAddress === "string" ? body.macAddress.trim().toUpperCase() : "";
  const customerId = body.customerId ? String(body.customerId) : null;
  const name = typeof body.name === "string" ? body.name.trim() : "Device";
  if (!validMac(macAddress)) return NextResponse.json(errorResponse("Enter a valid MAC address"), { status: 400 });

  const { data, error } = await getSupabaseServer().from("hotspot_devices").upsert({
    macAddress, customerId, name, status: "active", updatedAt: Date.now(), createdAt: Date.now()
  }, { onConflict: "macAddress" }).select("*").single();

  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse(data), { status: 201 });
});
