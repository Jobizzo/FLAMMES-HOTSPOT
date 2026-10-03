import { NextRequest, NextResponse } from "next/server";
export async function POST(req:NextRequest){
 const secret=process.env.FLAMMES_PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.json({error:"Paystack live secret key is not configured."},{status:503});
 const body=await req.json();const email=typeof body.email==="string"?body.email.trim():"";const amount=Number(body.amount);
 if(!email||!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:"Valid email and amount are required."},{status:400});
 const reference=typeof body.reference==="string"&&body.reference.trim()?body.reference.trim():"FLM-"+Date.now()+"-"+crypto.randomUUID().slice(0,8);
 const callback=process.env.FLAMMES_PAYSTACK_CALLBACK_URL||new URL("/api/payments/paystack/callback",req.url).toString();
 const response=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{"Authorization":"Bearer "+secret,"Content-Type":"application/json"},body:JSON.stringify({email,amount:Math.round(amount*100),reference,callback_url:callback,metadata:body.metadata||{}}),cache:"no-store"});
 const data=await response.json();if(!response.ok||!data.status)return NextResponse.json({error:data.message||"Paystack initialization failed."},{status:502});
 return NextResponse.json({authorizationUrl:data.data.authorization_url,accessCode:data.data.access_code,reference:data.data.reference});
}
