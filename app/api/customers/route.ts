import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

const mockCustomers = [
  {
    id: "1",
    name: "John Doe",
    phone: "+254712345678",
    email: "john@example.com",
    status: "active" as const,
    createdAt: new Date().toISOString(),
  },
];

export const GET = withErrorHandling(async (req: NextRequest) => {
  return NextResponse.json(
    successResponse({
      customers: mockCustomers,
      total: mockCustomers.length,
    })
  );
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  if (!body.name || !body.phone) {
    return NextResponse.json(
      errorResponse("Name and phone are required"),
      { status: 400 }
    );
  }

  const newCustomer = {
    id: Date.now().toString(),
    name: body.name,
    phone: body.phone,
    email: body.email || null,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(successResponse(newCustomer), { status: 201 });
});
