import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-utils";

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(req: NextRequest): boolean {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();

  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + 15 * 60 * 1000, // 15 minutes
    });
    return true;
  }

  if (record.count >= 100) {
    return false;
  }

  record.count++;
  return true;
}

export async function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Check rate limit
      if (!rateLimit(req)) {
        return NextResponse.json(
          errorResponse("Rate limit exceeded"),
          { status: 429 }
        );
      }

      // Check request method
      if (req.method === "OPTIONS") {
        return new NextResponse(null, { status: 200 });
      }

      return await handler(req);
    } catch (error) {
      console.error("API Error:", error);

      if (error instanceof SyntaxError) {
        return NextResponse.json(
          errorResponse("Invalid JSON in request body"),
          { status: 400 }
        );
      }

      return NextResponse.json(
        errorResponse("Internal server error"),
        { status: 500 }
      );
    }
  };
}
