import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

// Generate WiFi voucher/session
async function generateVoucher(
  phoneNumber: string,
  packageId: string,
  durationMinutes: number
): Promise<{
  voucherCode: string;
  sessionId: string;
  expiresAt: string;
}> {
  // TODO: Save to database
  const voucherCode = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()
    .padEnd(10, "X");

  const sessionId = `SESS-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  const expiresAt = new Date(
    Date.now() + durationMinutes * 60000
  ).toISOString();

  return {
    voucherCode,
    sessionId,
    expiresAt,
  };
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  if (!body.phoneNumber || !body.packageId || !body.durationMinutes) {
    return NextResponse.json(
      errorResponse(
        "phoneNumber, packageId, and durationMinutes are required"
      ),
      { status: 400 }
    );
  }

  try {
    const voucher = await generateVoucher(
      body.phoneNumber,
      body.packageId,
      body.durationMinutes
    );

    return NextResponse.json(
      successResponse({
        ...voucher,
        phoneNumber: body.phoneNumber,
        durationMinutes: body.durationMinutes,
        message: "WiFi voucher generated successfully",
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Voucher generation error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Failed to generate voucher"),
      { status: 400 }
    );
  }
});
