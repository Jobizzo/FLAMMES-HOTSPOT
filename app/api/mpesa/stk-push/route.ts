import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

// M-Pesa Daraja API credentials (from environment variables)
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "";
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "";
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || "";
const MPESA_CALLBACK_URL =
  process.env.MPESA_CALLBACK_URL ||
  "https://flammes-hotspot.vercel.app/api/mpesa/callback";

// Get M-Pesa access token
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

    const data = await response.json() as any;
    return data.access_token;
  } catch (error) {
    console.error("Failed to get M-Pesa access token:", error);
    throw new Error("Failed to authenticate with M-Pesa");
  }
}

// STK Push to phone
async function sendSTKPush(
  phoneNumber: string,
  amount: number,
  accountReference: string
): Promise<{ checkoutRequestID: string; responseCode: string }> {
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
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
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
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: phoneNumber,
          CallBackURL: MPESA_CALLBACK_URL,
          AccountReference: accountReference,
          TransactionDesc: "WiFi Hotspot Access",
        }),
      }
    );

    const data = await response.json() as any;

    if (data.ResponseCode !== "0") {
      throw new Error(data.ResponseDescription || "STK Push failed");
    }

    return {
      checkoutRequestID: data.CheckoutRequestID,
      responseCode: data.ResponseCode,
    };
  } catch (error) {
    console.error("STK Push error:", error);
    throw error;
  }
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  // Validate input
  if (!body.phoneNumber || !body.amount || !body.packageId) {
    return NextResponse.json(
      errorResponse("phoneNumber, amount, and packageId are required"),
      { status: 400 }
    );
  }

  // Validate phone number format (Kenya: 254XXXXXXXXX or 0XXXXXXXXX)
  let cleanPhone = body.phoneNumber.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "254" + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith("254")) {
    cleanPhone = "254" + cleanPhone;
  }

  if (!/^254\d{9}$/.test(cleanPhone)) {
    return NextResponse.json(
      errorResponse("Invalid Kenyan phone number format"),
      { status: 400 }
    );
  }

  try {
    // Generate session ID
    const sessionId = `FLAMES-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Send STK push
    const stkResult = await sendSTKPush(
      cleanPhone,
      body.amount,
      sessionId
    );

    // TODO: Save payment request to database with status "pending"

    return NextResponse.json(
      successResponse({
        sessionId,
        checkoutRequestID: stkResult.checkoutRequestID,
        phoneNumber: cleanPhone,
        amount: body.amount,
        status: "pending",
        message: "STK push sent to your phone. Enter your M-Pesa PIN to continue.",
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("M-Pesa error:", error);
    return NextResponse.json(
      errorResponse(error.message || "Failed to process payment"),
      { status: 400 }
    );
  }
});
