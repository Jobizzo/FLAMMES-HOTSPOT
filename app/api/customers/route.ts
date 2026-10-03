import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const GET = withErrorHandling(async () => {
  const { data, error } = await getSupabaseServer().from("hotspot_customers").select("*").order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse({ customers: data ?? [], total: data?.length ?? 0 }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : null;
  if (!name || !phone) return NextResponse.json(errorResponse("Name and phone are required"), { status: 400 });
  const { data, error } = await getSupabaseServer().from("hotspot_customers").insert({
    name, phone, email, status: "active", createdAt: Date.now()
  }).select("*").single();
  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse(data), { status: 201 });
});
