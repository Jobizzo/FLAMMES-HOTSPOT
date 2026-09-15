import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/db/supabase";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const updates: {
      name?: string;
      price?: number;
      duration_minutes?: number;
      active?: boolean;
    } = {};

    if (body.name !== undefined) {
      updates.name = String(body.name).trim();
    }

    if (body.price !== undefined) {
      const price = Number(body.price);

      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: "Invalid price." },
          { status: 400 }
        );
      }

      updates.price = price;
    }

    if (body.duration_minutes !== undefined) {
      const duration = Number(body.duration_minutes);

      if (Number.isNaN(duration) || duration <= 0) {
        return NextResponse.json(
          { error: "Invalid duration." },
          { status: 400 }
        );
      }

      updates.duration_minutes = duration;
    }

    if (body.active !== undefined) {
      updates.active = Boolean(body.active);
    }

    const { data, error } = await supabaseAdmin
      .from("packages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete package." },
      { status: 500 }
    );
  }
      }
