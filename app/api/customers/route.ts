import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/db/supabase";
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("customers")
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

    const { name, phone, email } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert({
        name,
        phone,
        email: email || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
    }
}
  
