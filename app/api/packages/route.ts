import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/db/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("packages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, price, duration_minutes } = body;

    if (!name || price === undefined || !duration_minutes) {
      return NextResponse.json(
        {
          error: "Name, price and duration are required.",
        },
        { status: 400 }
      );
    }

    const priceNumber = Number(price);
    const durationNumber = Number(duration_minutes);

    if (
      Number.isNaN(priceNumber) ||
      Number.isNaN(durationNumber)
    ) {
      return NextResponse.json(
        {
          error: "Price and duration must be valid numbers.",
        },
        { status: 400 }
      );
    }

    if (priceNumber < 0) {
      return NextResponse.json(
        {
          error: "Price cannot be negative.",
        },
        { status: 400 }
      );
    }

    if (durationNumber <= 0) {
      return NextResponse.json(
        {
          error: "Duration must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("packages")
      .insert({
        name: name.trim(),
        price: priceNumber,
        duration_minutes: durationNumber,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      status: 201,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
