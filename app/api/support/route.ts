import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const GET = withErrorHandling(async () => {
  const { data, error } = await getSupabaseServer().from("hotspot_support_contacts").select("*").eq("active", true).order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse({ contacts: data ?? [] }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "Support";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.trim() : null;
  if (!phone) return NextResponse.json(errorResponse("Support phone number is required"), { status: 400 });

  const { data, error } = await getSupabaseServer().from("hotspot_support_contacts").insert({
    name, phone, whatsapp, active: true, createdAt: Date.now()
  }).select("*").single();

  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse(data), { status: 201 });
});
