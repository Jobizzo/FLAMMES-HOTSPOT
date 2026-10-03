import { NextRequest, NextResponse } from "next/server";
export async function GET(req:NextRequest){
 const secret=process.env.FLAMMES_PAYSTACK_SECRET_KEY,reference=req.nextUrl.searchParams.get("reference");
 if(!secret)return NextResponse.json({error:"Paystack live secret key is not configured."},{status:503});if(!reference)return NextResponse.json({error:"Payment reference is required."},{status:400});
 const response=await fetch("https://api.paystack.co/transaction/verify/"+encodeURIComponent(reference),{headers:{Authorization:"Bearer "+secret},cache:"no-store"});const data=await response.json();
 if(!response.ok||!data.status)return NextResponse.json({error:data.message||"Paystack verification failed."},{status:502});
 return NextResponse.json({status:data.data.status,reference:data.data.reference,amount:Number(data.data.amount)/100,currency:data.data.currency,paidAt:data.data.paid_at||null,customer:data.data.customer||null});
}
