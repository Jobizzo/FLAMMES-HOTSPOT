import { NextResponse } from "next/server";
export async function GET(){const names=["FLAMMES_PAYSTACK_SECRET_KEY","FLAMMES_PAYSTACK_PUBLIC_KEY","FLAMMES_PAYSTACK_CALLBACK_URL"];const configured=Object.fromEntries(names.map(k=>[k,Boolean(process.env[k])]));return NextResponse.json({environment:"live",configured,ready:names.every(k=>configured[k])});}
