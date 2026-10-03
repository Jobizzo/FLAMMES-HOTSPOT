import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { CheckCircle2, RefreshCw, Shield, ShieldAlert } from 'lucide-react';

export default function FirewallAdmin(){
 const [routers,setRouters]=useState<any[]>([]); const [routerId,setRouterId]=useState(''); const [data,setData]=useState<any>(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
 const loadRouters=async()=>{const r=await api.get('/api/routers');setRouters(r.data.items||[]);if(!routerId&&r.data.items?.[0])setRouterId(r.data.items[0].id);};
 useEffect(()=>{void loadRouters();},[]);
 const inspect=async()=>{if(!routerId)return;setBusy(true);try{const r=await api.get('/api/firewall/'+routerId);setData(r.data);setMessage('Live firewall inspection completed.');}catch(e){setMessage(e instanceof Error?e.message:'Firewall inspection failed.');}finally{setBusy(false);}};
 const apply=async()=>{if(!routerId)return;setBusy(true);try{const r=await api.post('/api/firewall/'+routerId+'/baseline',{});setMessage(r.data.note||'Firewall baseline applied.');await inspect();}catch(e){setMessage(e instanceof Error?e.message:'Firewall baseline failed.');}finally{setBusy(false);}};
 useEffect(()=>{if(routerId)void inspect();},[routerId]);
 return <section className="panel full-page-panel"><div className="page-header"><div><span className="section-kicker">SECURITY EDGE</span><h1>Firewall</h1><p>FLAMMES HOTSPOT manages firewall policy centrally while enforcement stays on the network edge.</p></div><div className="page-header-actions"><select className="router-select" value={routerId} onChange={e=>setRouterId(e.target.value)}><option value="">Select router</option>{routers.map(r=><option key={r.id} value={r.id}>{r.name} • {r.vendor}</option>)}</select><button className="secondary-action" onClick={()=>void inspect()} disabled={busy}><RefreshCw size={15}/> Inspect</button></div></div>
 <div className="firewall-summary"><div><Shield size={20}/><span>Native support</span><strong>{data?.live?.supported?'Available':'Capability dependent'}</strong></div><div><ShieldAlert size={20}/><span>Live rules</span><strong>{data?.live?.rules?.length??0}</strong></div><div><CheckCircle2 size={20}/><span>Managed baseline</span><strong>{data?.rules?.length??0}</strong></div></div>
 {message&&<div className="integration-note"><Shield size={17}/><div><strong>Firewall status</strong><p>{message}</p></div></div>}
 <div className="integration-note"><ShieldAlert size={18}/><div><strong>FLAMMES HOTSPOT firewall rules</strong><p>Applies an idempotent MikroTik baseline: established/related accept, invalid drop, ICMP allow, WAN input protection, and hotspot-to-WAN forwarding when the live FLAMMES-HOTSPOT interface list exists. Existing rules are preserved.</p></div><button className="primary-action" onClick={()=>void apply()} disabled={busy||!routerId}>Install / Update Rules</button></div>
 <div className="record-list">{(data?.live?.rules||[]).map((r:any)=>(<div className="record-row" key={r['.id']||r.comment}><span className="row-icon"><Shield size={16}/></span><div><strong>{r.comment||r.chain+' '+r.action}</strong><small>{r.chain} • {r.action} {r['in-interface-list']?'• '+r['in-interface-list']:''}</small></div><em className={r.disabled==='true'?'status-pill offline':'status-pill online'}><i/>{r.disabled==='true'?'disabled':'active'}</em><b>{r.bytes||'0'} bytes</b></div>))}{!data?.live?.rules?.length&&<div className="empty-inline">No live firewall rules returned yet. Select a router and inspect.</div>}</div>
 </section>;
}
