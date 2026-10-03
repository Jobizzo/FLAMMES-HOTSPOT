"use client";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Eye, EyeOff, Loader2, Mail, Lock, Chrome, Apple } from "lucide-react";

export default function LoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false); const [mode,setMode]=useState<"login"|"signup">("login");
  const [loading,setLoading]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function submit(e:FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const supabase=createSupabaseBrowserClient();
      const result=mode==="login" ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password});
      if(result.error) throw result.error;
      if(mode==="signup" && !result.data.session) setMessage("Account created. Check your email to confirm your account.");
      else window.location.assign("/");
    } catch(err:any){setError(err?.message||"Authentication failed.");} finally{setLoading(false);}
  }
  async function oauth(provider:"google"|"apple") {
    setLoading(true); setError("");
    try {
      const {error}=await createSupabaseBrowserClient().auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin+"/auth/callback"}});
      if(error) throw error;
    } catch(err:any){setError(err?.message||"OAuth sign-in failed.");setLoading(false);}
  }
  return <main className="min-h-screen bg-[#07111f] flex items-center justify-center p-4"><div className="w-full max-w-md">
    <div className="mb-7 flex justify-center"><Image src="/flammes-tech-logo.svg" alt="FLAMMES TECH" width={220} height={60} className="h-14 w-auto object-contain"/></div>
    <section className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
      <div className="mb-7"><div className="text-[11px] font-black uppercase tracking-[.2em] text-orange-600">FLAMMES HOTSPOT</div><h1 className="mt-2 text-2xl font-black text-slate-900">{mode==="login"?"Welcome back":"Create your account"}</h1><p className="mt-2 text-sm text-slate-500">Secure access to your hotspot management control center.</p></div>
      <div className="grid grid-cols-2 gap-3"><button onClick={()=>oauth("google")} disabled={loading} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"><Chrome size={17}/> Google</button><button onClick={()=>oauth("apple")} disabled={loading} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"><Apple size={18}/> Apple</button></div>
      <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200"/><span>or email</span><span className="h-px flex-1 bg-slate-200"/></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Email address</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-slate-400" size={17}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-orange-400" placeholder="you@example.com"/></div></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Password</span><div className="relative"><Lock className="absolute left-3 top-3.5 text-slate-400" size={17}/><input required minLength={6} type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-11 text-sm outline-none focus:border-orange-400" placeholder="••••••••"/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        {error&&<div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}{message&&<div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</div>}
        <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-black text-white hover:bg-orange-600 disabled:opacity-60">{loading&&<Loader2 size={17} className="animate-spin"/>}{mode==="login"?"Sign in":"Create account"}</button>
      </form>
      <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("")}} className="mt-5 w-full text-center text-xs font-bold text-slate-500 hover:text-orange-600">{mode==="login"?"Don't have an account? Create one":"Already have an account? Sign in"}</button>
    </section><p className="mt-6 text-center text-[10px] font-bold text-slate-500">© 2026 all rights reserved . Powered by FLAMMES-TECH</p>
  </div></main>;
}
