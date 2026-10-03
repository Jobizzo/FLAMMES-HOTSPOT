import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function GET(request:NextRequest){
  const code=request.nextUrl.searchParams.get("code"); const next=request.nextUrl.searchParams.get("next")||"/";
  if(!code) return NextResponse.redirect(new URL("/login?error=missing_code",request.url));
  const cookieStore=await cookies();
  const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>cookieStore.getAll(),setAll:(items)=>{try{items.forEach(({name,value,options})=>cookieStore.set(name,value,options));}catch{}}}});
  const {error}=await supabase.auth.exchangeCodeForSession(code);
  if(error) return NextResponse.redirect(new URL("/login?error=callback_failed",request.url));
  return NextResponse.redirect(new URL(next,request.url));
}
