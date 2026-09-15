import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "";
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "";
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || "";

async function getMpesaAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  try {
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = (await response.json()) as any;
    return data.access_token;
  } catch (error) {
    console.error("Failed to get M-Pesa access token:", error);
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

async function queryPaymentStatus(
  checkoutRequestID: string
): Promise<{ status: string; resultCode: string; resultDesc: string }> {
  const token = await getMpesaAccessToken();
  const timestamp = new Date()
    .toISOString()
    .replace(/[:-]/g, "")
    .split(".")[0];

  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  try {
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestID,
        }),
      }
    );

    const data = (await response.json()) as any;

    return {
      status: data.ResultCode === "0" ? "successful" : "pending",
      resultCode: data.ResultCode,
      resultDesc: data.ResultDesc,
    };
  } catch (error) {
    console.error("Query status error:", error);
    throw error;
  }
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  if (!body.checkoutRequestID) {
    return NextResponse.json(
      errorResponse("checkoutRequestID is required"),
      { status: 400 }
    );
  }

  try {
    const paymentStatus = await queryPaymentStatus(body.checkoutRequestID);

    return NextResponse.json(
      successResponse({
        checkoutRequestID: body.checkoutRequestID,
        ...paymentStatus,
      })
    );
  } catch (error: any) {
    console.error("Payment query error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Failed to query payment status"),
      { status: 400 }
    );
  }
});
