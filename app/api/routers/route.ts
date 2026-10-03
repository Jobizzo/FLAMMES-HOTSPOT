import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const GET = withErrorHandling(async () => {
  const { data, error } = await getSupabaseServer().from("hotspot_routers").select("*").order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  const routers = data ?? [];
  return NextResponse.json(successResponse({
    routers,
    online: routers.filter((r: any) => r.status === "online").length,
    total: routers.length,
  }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const brand = typeof body.brand === "string" ? body.brand.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const host = typeof body.host === "string" ? body.host.trim() : "";
  const port = Number(body.port ?? 8728);

  if (!name || !brand || !address || !host || !Number.isInteger(port) || port < 1 || port > 65535) {
    return NextResponse.json(errorResponse("name, brand, address, host and a valid port are required"), { status: 400 });
  }

  const { data, error } = await getSupabaseServer().from("hotspot_routers").insert({
    name, brand, address, host, port, status: "offline", createdAt: Date.now()
  }).select("*").single();

  if (error) throw new Error(error.message);
  return NextResponse.json(successResponse(data), { status: 201 });
});
