import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

function envName(id: string, suffix: string) {
  return "FLAMMES_ROUTER_" + id.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_" + suffix;
}

async function routerRest(id: string, path: string, body?: unknown) {
  const supabase = getSupabaseServer();
  const { data: router, error } = await supabase.from("hotspot_routers").select("*").eq("id", id).single();
  if (error || !router) throw new Error("Router not found.");
  if (!String(router.brand ?? router.vendor ?? "").toLowerCase().includes("mikrotik")) {
    return { router, unsupported: true };
  }

  const username = process.env[envName(id, "API_USERNAME")];
  const password = process.env[envName(id, "API_PASSWORD")];
  if (!username || !password) throw new Error("MikroTik API credentials are not configured for this router.");
  const host = String(router.host ?? "").trim();
  if (!host) throw new Error("Router management host is not configured.");

  const port = Number(router.apiPort ?? router.port ?? 8728);
  const useTls = router.apiTransport === "tls" || port === 8729;
  const protocol = useTls ? "https" : "http";
  const url = protocol + "://" + host + (port === 80 || port === 443 ? "" : ":" + port) + "/rest" + path;
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(username + ":" + password).toString("base64"),
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!response.ok) throw new Error("RouterOS REST request failed (" + response.status + ").");
  return { router, data };
}

export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const result = await routerRest(id, "/interface");
  if (result.unsupported) {
    return NextResponse.json(errorResponse("Live interface discovery is not available for this vendor yet. No interface data is guessed or synthesized."), { status: 409 });
  }
  const rows = Array.isArray(result.data) ? result.data : [];
  const interfaces = rows.map((item: any) => ({
    id: item[".id"] ?? item.name,
    name: String(item.name ?? ""),
    type: String(item.type ?? ""),
    mtu: Number(item.mtu ?? 0) || undefined,
    l2mtu: Number(item["l2mtu"] ?? 0) || undefined,
    macAddress: item["mac-address"],
    running: item.running === "true" || item.running === true,
    disabled: item.disabled === "true" || item.disabled === true,
    dynamic: item.dynamic === "true" || item.dynamic === true,
    physical: !["bridge", "vlan", "bonding", "wireguard", "eoip", "gre", "ipip", "ovpn-client"].includes(String(item.type ?? "").toLowerCase()),
  }));
  return NextResponse.json(successResponse({
    source: "live_routeros_rest",
    exact: true,
    scannedAt: Date.now(),
    interfaces,
    hotspotCandidates: interfaces.filter((item: any) => item.physical && !item.disabled),
  }));
});
