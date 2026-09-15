import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

const mockSessions = [
  {
    id: "1",
    customerId: "1",
    packageId: "1",
    routerId: "1",
    startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
    status: "active" as const,
  },
];

export const GET = withErrorHandling(async (req: NextRequest) => {
  return NextResponse.json(
    successResponse({
      sessions: mockSessions,
      active: mockSessions.filter((s) => s.status === "active").length,
      total: mockSessions.length,
    })
  );
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  if (!body.customerId || !body.packageId || !body.routerId) {
    return NextResponse.json(
      errorResponse("customerId, packageId, and routerId are required"),
      { status: 400 }
    );
  }

  const newSession = {
    id: Date.now().toString(),
    customerId: body.customerId,
    packageId: body.packageId,
    routerId: body.routerId,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60000).toISOString(),
    status: "active",
  };

  return NextResponse.json(successResponse(newSession), { status: 201 });
});
