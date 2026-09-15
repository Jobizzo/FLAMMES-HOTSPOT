import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

const mockPackages = [
  {
    id: "1",
    name: "30-Minute Pass",
    price: 50,
    durationMinutes: 30,
    active: true,
  },
  {
    id: "2",
    name: "2-Hour Pass",
    price: 150,
    durationMinutes: 120,
    active: true,
  },
];

export const GET = withErrorHandling(async (req: NextRequest) => {
  return NextResponse.json(
    successResponse({
      packages: mockPackages,
      total: mockPackages.length,
    })
  );
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  if (!body.name || typeof body.price !== "number" || !body.durationMinutes) {
    return NextResponse.json(
      errorResponse("Name, price, and duration are required"),
      { status: 400 }
    );
  }

  const newPackage = {
    id: Date.now().toString(),
    name: body.name,
    price: body.price,
    durationMinutes: body.durationMinutes,
    active: true,
  };

  return NextResponse.json(successResponse(newPackage), { status: 201 });
});
