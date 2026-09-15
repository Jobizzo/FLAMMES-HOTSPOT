import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  console.log("M-Pesa Callback Received:", JSON.stringify(body, null, 2));

  // Extract callback data
  const result = body.Result;
  const resultCode = result?.ResultCode;
  const resultDesc = result?.ResultDesc;
  const checkoutRequestID = result?.CheckoutRequestID;
  const merchantRequestID = result?.MerchantRequestID;

  // TODO: Save payment status to database
  // TODO: Trigger WiFi gateway access if payment successful

  if (resultCode === 0) {
    // Payment successful
    console.log(`Payment successful for CheckoutRequestID: ${checkoutRequestID}`);
    // TODO: Generate WiFi voucher and activate session
  } else {
    // Payment failed
    console.log(`Payment failed: ${resultDesc}`);
  }

  return NextResponse.json(
    successResponse({
      checkoutRequestID,
      merchantRequestID,
      status: resultCode === 0 ? "successful" : "failed",
      message: resultDesc,
    })
  );
});
