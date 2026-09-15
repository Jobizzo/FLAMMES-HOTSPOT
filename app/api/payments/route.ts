import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

const mockPayments = [
  {
    id: "1",
    customerId: "1",
    packageId: "1",
    amount: 150,
    method: "mpesa" as const,
    status: "successful" as const,
    transactionId: "TXN123456",
    createdAt: new Date().toISOString(),
  },
];

export const GET = withErrorHandling(async (req: NextRequest) => {
  return NextResponse.json(
    successResponse({
      payments: mockPayments,
      total: mockPayments.length,
      revenue: mockPayments
        .filter((p) => p.status === "successful")
        .reduce((sum, p) => sum + p.amount, 0),
    })
  );
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  if (
    !body.customerId ||
    !body.packageId ||
    typeof body.amount !== "number" ||
    !body.method
  ) {
    return NextResponse.json(
      errorResponse("customerId, packageId, amount, and method are required"),
      { status: 400 }
    );
  }

  const newPayment = {
    id: Date.now().toString(),
    customerId: body.customerId,
    packageId: body.packageId,
    amount: body.amount,
    method: body.method,
    status: "pending",
    transactionId: null,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(successResponse(newPayment), { status: 201 });
});
