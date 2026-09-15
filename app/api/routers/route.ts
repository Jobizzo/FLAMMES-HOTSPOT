import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { withErrorHandling } from "@/lib/api-middleware";

const mockRouters = [
  {
    id: "1",
    name: "Main Office",
    brand: "TP-Link",
    address: "Westlands, Nairobi",
    status: "online" as const,
    createdAt: new Date().toISOString(),
  },
];

export const GET = withErrorHandling(async (req: NextRequest) => {
  return NextResponse.json(
    successResponse({
      routers: mockRouters,
      online: mockRouters.filter((r) => r.status === "online").length,
      total: mockRouters.length,
    })
  );
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  if (!body.name || !body.brand || !body.address) {
    return NextResponse.json(
      errorResponse("name, brand, and address are required"),
      { status: 400 }
    );
  }

  const newRouter = {
    id: Date.now().toString(),
    name: body.name,
    brand: body.brand,
    address: body.address,
    status: "offline",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(successResponse(newRouter), { status: 201 });
});
