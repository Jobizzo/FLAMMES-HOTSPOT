import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { rateLimit } from "@/lib/api-middleware";

function envName(id: string, suffix: string) {
  return "FLAMMES_ROUTER_" + id.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_" + suffix;
}

async function loadRouter(id: string) {
  const { data, error } = await getSupabaseServer().from("hotspot_routers").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Router not found.");
  return data;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(req)) return NextResponse.json(errorResponse("Rate limit exceeded"), { status: 429 });

  try {
    const { id } = await params;
    const router = await loadRouter(id);
    const vendor = String(router.brand ?? router.vendor ?? "").toLowerCase();
    if (!vendor.includes("mikrotik")) {
      return NextResponse.json(errorResponse("Live interface discovery is not available for this vendor yet. No interface data is guessed or synthesized."), { status: 409 });
    }

    const username = process.env[envName(id, "API_USERNAME")];
    const password = process.env[envName(id, "API_PASSWORD")];
    if (!username || !password) {
      return NextResponse.json(errorResponse("MikroTik credentials are not configured for this router."), { status: 409 });
    }

    const host = String(router.host ?? "").trim();
    if (!host) return NextResponse.json(errorResponse("Router management host is not configured."), { status: 409 });

    // RouterOS REST is normally exposed through www/www-ssl (80/443).
    // It is deliberately separate from the binary API service on 8728/8729.
    const base = process.env[envName(id, "REST_URL")] || (
      (router.apiTransport === "tls" || router.restTls === true ? "https://" : "http://") + host + "/rest"
    );

    const response = await fetch(base.replace(/\/$/, "") + "/interface", {
      headers: {
        Authorization: "Basic " + Buffer.from(username + ":" + password).toString("base64"),
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const raw = await response.text();
    let rows: unknown;
    try { rows = JSON.parse(raw); } catch { rows = []; }

    if (!response.ok) {
      return NextResponse.json(errorResponse("RouterOS REST returned HTTP " + response.status + "."), { status: 502 });
    }

    const list = Array.isArray(rows) ? rows : [];
    const interfaces = list.map((item: any) => ({
      id: item[".id"] ?? item.name,
      name: String(item.name ?? ""),
      type: String(item.type ?? ""),
      mtu: Number(item.mtu ?? 0) || undefined,
      l2mtu: Number(item["l2mtu"] ?? 0) || undefined,
      macAddress: item["mac-address"],
      running: item.running === "true" || item.running === true,
      disabled: item.disabled === "true" || item.disabled === true,
      dynamic: item.dynamic === "true" || item.dynamic === true,
      physical: ["ether", "sfp", "sfp-sfpplus", "combo"].includes(String(item.type ?? "").toLowerCase()),
    }));

    return NextResponse.json(successResponse({
      source: "live_routeros_rest",
      exact: true,
      scannedAt: Date.now(),
      interfaces,
      hotspotCandidates: interfaces.filter((item: any) => item.physical && !item.disabled),
    }));
  } catch (error) {
    console.error("Router interface discovery error:", error);
    return NextResponse.json(errorResponse(error instanceof Error ? error.message : "Live interface discovery failed."), { status: 502 });
  }
}
