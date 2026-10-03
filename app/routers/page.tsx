"use client";

import { useEffect, useState } from "react";
import { Router, Plus, MapPin, RefreshCw, Radio, CheckCircle2 } from "lucide-react";

interface RouterRecord {
  id: string; name: string; brand: string; address: string; host?: string; port?: number;
  status: "online" | "offline" | "not_connected" | "configured";
}
interface LiveInterface { id: string; name: string; type: string; macAddress?: string; running: boolean; disabled: boolean; physical: boolean; }

export default function RoutersPage() {
  const [routers,setRouters]=useState<RouterRecord[]>([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [interfaces,setInterfaces]=useState<Record<string,LiveInterface[]>>({});
  const [scanning,setScanning]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const [form,setForm]=useState({name:"",brand:"MikroTik",address:"",host:"",port:"8728"});

  const fetchRouters=async()=>{
    setLoading(true);
    try{const res=await fetch("/api/routers",{cache:"no-store"});const data=await res.json();if(data.success)setRouters(data.data.routers??[]);}
    catch{setMessage("Failed to load routers.");}finally{setLoading(false);}
  };
  useEffect(()=>{void fetchRouters();},[]);

  const addRouter=async(e:React.FormEvent)=>{
    e.preventDefault();
    const res=await fetch("/api/routers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const data=await res.json();
    if(!res.ok){setMessage(data.error??"Unable to add router.");return;}
    setShowModal(false);setForm({name:"",brand:"MikroTik",address:"",host:"",port:"8728"});await fetchRouters();
  };

  const scan=async(id:string)=>{
    setScanning(id);setMessage("");
    try{
      const res=await fetch("/api/routers/"+id+"/interfaces",{cache:"no-store"});
      const data=await res.json();
      if(!res.ok){setMessage(data.error??"Live interface scan failed.");return;}
      setInterfaces(v=>({...v,[id]:data.data.interfaces??[]}));
      setMessage("Live RouterOS interfaces loaded. Only interfaces returned by the router are shown.");
    }catch{setMessage("Unable to reach the live interface endpoint.");}finally{setScanning(null);}
  };

  return <main className="min-h-screen bg-[#070707]">
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-4"><div><p className="text-sm-caps text-orange-500">Management</p><h1 className="text-2xl font-black text-white">Network Routers</h1></div><button onClick={()=>setShowModal(true)} className="flames-button flex items-center gap-2"><Plus size={18}/>Add Router</button></div>
      </header>
      <div className="flex-1 px-8 py-6">
        {message&&<div className="mb-5 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-200">{message}</div>}
        {loading?<p className="py-12 text-center text-gray-500">Loading routers...</p>:routers.length===0?<div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#292929] py-12"><Router size={32} className="mb-3 text-gray-700"/><p className="font-medium text-gray-500">No routers configured</p><button onClick={()=>setShowModal(true)} className="flames-button mt-4">Add Router</button></div>:
        <div className="grid gap-4 md:grid-cols-2">{routers.map(r=><div key={r.id} className="flames-card p-6">
          <div className="mb-4 flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500"><Router size={20}/></div><span className="badge badge-warning">{r.status}</span></div>
          <h3 className="mb-1 text-lg font-bold text-white">{r.name}</h3><p className="mb-3 text-sm text-gray-500">{r.brand}</p>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-400"><MapPin size={16}/>{r.address}</div>
          <p className="mb-4 text-xs text-gray-600">{r.host??"No management host"}{r.port?":"+r.port:""}</p>
          <button onClick={()=>void scan(r.id)} disabled={scanning===r.id} className="flames-button-secondary flex w-full items-center justify-center gap-2"><RefreshCw size={15} className={scanning===r.id?"animate-spin":""}/>Scan real interfaces</button>
          {interfaces[r.id]&&<div className="mt-4 space-y-2"><div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500"><Radio size={13}/>Live RouterOS interfaces</div>{interfaces[r.id].map(i=><div key={i.id} className="flex items-center justify-between rounded-lg border border-[#292929] px-3 py-2"><div><strong className="text-sm text-white">{i.name}</strong><p className="text-xs text-gray-500">{i.type}{i.macAddress?" • "+i.macAddress:""}</p></div><span className="text-xs">{i.disabled?"disabled":i.running?<CheckCircle2 size={15} className="text-green-400"/>:"down"}</span></div>)}</div>}
        </div>)}</div>}
      </div>
    </div>
    {showModal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"><div className="flames-card w-full max-w-md p-6"><h2 className="mb-4 text-xl font-black text-white">Add Router</h2><form onSubmit={addRouter} className="space-y-4">
      {([["name","Router Name","Main Router"],["brand","Vendor / Model","MikroTik RB951"],["address","Location","Main Site"],["host","Management IP / Host","192.168.88.1"],["port","RouterOS API Port","8728"]] as const).map(([key,label,placeholder])=><div key={key}><label className="mb-2 block text-sm font-medium text-gray-400">{label}</label><input required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="flames-input" placeholder={placeholder}/></div>)}
      <div className="flex gap-3 pt-4"><button type="button" onClick={()=>setShowModal(false)} className="flames-button-secondary flex-1">Cancel</button><button className="flames-button flex-1">Add Router</button></div>
    </form></div></div>}
  </main>;
}
