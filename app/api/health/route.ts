import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const GET = withErrorHandling(async (req: NextRequest) => {
  return NextResponse.json(
    successResponse({
      status: "online",
      platform: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    })
  );
});
