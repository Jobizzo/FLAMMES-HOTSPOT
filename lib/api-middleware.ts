import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(req: NextRequest): boolean {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + 15 * 60 * 1000,
    });
    return true;
  }

  if (record.count >= 100) return false;
  record.count++;
  return true;
}

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

/** Wrap a Next.js App Router handler without changing its route-handler type. */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest) => {
    try {
      if (!rateLimit(req)) {
        return NextResponse.json(errorResponse("Rate limit exceeded"), { status: 429 });
      }

      if (req.method === "OPTIONS") {
        return new NextResponse(null, { status: 200 });
      }

      return await handler(req);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof SyntaxError) {
        return NextResponse.json(errorResponse("Invalid JSON in request body"), { status: 400 });
      }

      return NextResponse.json(errorResponse("Internal server error"), { status: 500 });
    }
  };
}
