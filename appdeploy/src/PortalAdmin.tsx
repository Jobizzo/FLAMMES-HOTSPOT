import { useEffect, useState } from 'react';
const LOGO_STORAGE_KEY = 'flammes_tech_logo_data';
const readStoredLogo = () => { try { return localStorage.getItem(LOGO_STORAGE_KEY) || ''; } catch { return ''; } };
import { api } from '@appdeploy/client';
import { CheckCircle2, CreditCard, Globe2, KeyRound, Package, ShieldCheck, Ticket, Trash2, Tv, Wifi } from 'lucide-react';

type SupportContact = { id:string; label:string; phone:string; enabled:boolean };
type PortalSettings = { title: string; subtitle: string; logoText: string; status: 'active' | 'disabled'; successMessage: string; supportContacts?: SupportContact[] };
type GardenRule = { id: string; host: string; type: 'domain' | 'ip'; description: string; enabled: boolean };
type PackageItem = { id: string; name: string; price: number; durationMinutes: number; speedMbps: number; dataLimitMb?: number; status: string };
const money = (value: number) => 'KES ' + value.toLocaleString();
const duration = (minutes: number) => minutes >= 1440 ? `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h` : `${minutes} min`;

export default function PortalAdmin() {
  const [settings, setSettings] = useState<PortalSettings>({ title: 'FLAMMES HOTSPOT', subtitle: 'Choose a connectivity package to get online.', logoText: 'FLAMMES', status: 'active', successMessage: 'Your package is ready. Complete payment to activate connectivity.' });
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [rules, setRules] = useState<GardenRule[]>([]);
  const [form, setForm] = useState({ host: '', type: 'domain', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [brandLogo, setBrandLogo] = useState(readStoredLogo);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);
  const [supportForm, setSupportForm] = useState({ label:'', phone:'' });

  const load = async () => {
    setLoading(true);
    try {
      const [config, garden, support] = await Promise.all([api.get('/api/portal/default/config'), api.get('/api/sites/default/walled-garden'), api.get('/api/sites/default/support')]);
      setSettings(config.data.settings);
      setSupportContacts(support.data.items ?? config.data.supportContacts ?? []);
      setPackages(config.data.packages ?? []);
      setRules(garden.data.items ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); const syncLogo=()=>setBrandLogo(readStoredLogo()); window.addEventListener('flammes-logo-updated',syncLogo); return ()=>window.removeEventListener('flammes-logo-updated',syncLogo); }, []);

  const saveSettings = async () => {
    setSaving(true);
    try { const result = await api.put('/api/portal/default/config', settings); setSettings(result.data.settings); setNotice('Captive portal settings saved.'); }
    finally { setSaving(false); }
  };
  const addRule = async () => {
    if (!form.host.trim()) { setNotice('Enter a domain or IPv4 address first.'); return; }
    setSaving(true);
    try { await api.post('/api/sites/default/walled-garden', { ...form, enabled: true }); setForm({ host:'',type:'domain',description:'' }); await load(); setNotice('Walled garden rule added.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to add rule.'); }
    finally { setSaving(false); }
  };
  const toggleRule = async (rule: GardenRule) => { await api.put('/api/sites/default/walled-garden/' + rule.id, { ...rule, enabled: !rule.enabled }); await load(); };
  const deleteRule = async (rule: GardenRule) => { await api.delete('/api/sites/default/walled-garden/' + rule.id); setRules(rules.filter(item => item.id !== rule.id)); };
  const addSupport = async () => { if (!supportForm.label.trim() || !supportForm.phone.trim()) { setNotice('Enter the support label and phone number.'); return; } setSaving(true); try { await api.post('/api/sites/default/support', { ...supportForm, enabled:true }); setSupportForm({label:'',phone:''}); await load(); setNotice('Support number added.'); } catch(e) { setNotice(e instanceof Error ? e.message : 'Unable to add support number.'); } finally { setSaving(false); } };
  const toggleSupport = async (item: SupportContact) => { await api.put('/api/sites/default/support/' + item.id, { ...item, enabled: !item.enabled }); await load(); };
  const deleteSupport = async (item: SupportContact) => { await api.delete('/api/sites/default/support/' + item.id); await load(); };

  return <section className="panel full-page-panel">
    <div className="page-header"><div><span className="section-kicker">FLAMMES HOTSPOT</span><h1>Captive Portal & Walled Garden</h1><p>Configure the complete customer sign-in, payment, voucher and device-targeting experience.</p></div><button className="secondary-action" onClick={() => void load()} disabled={loading}>Refresh</button></div>
    {notice && <div className="notice"><CheckCircle2 size={16} /><span>{notice}</span></div>}
    {loading ? <div className="loading-card"><div className="spinner" />Loading portal configuration…</div> : <>
      <div className="portal-admin-grid">
        <div className="portal-config-card">
          <div className="section-kicker">PORTAL CONFIGURATION</div><h2>Customer entry experience</h2>
          <p>Customers can pay with M-PESA, redeem a staff-generated voucher, or choose another device such as a TV and bind access to its MAC address.</p>
          <div className="edit-form compact">
            <label>Portal title<input value={settings.title} onChange={e => setSettings({ ...settings, title:e.target.value })} /></label>
            <label>Subtitle<input value={settings.subtitle} onChange={e => setSettings({ ...settings, subtitle:e.target.value })} /></label>
            <label>Brand text<input value={settings.logoText} onChange={e => setSettings({ ...settings, logoText:e.target.value })} /></label>
            <label>Success message<textarea rows={3} value={settings.successMessage} onChange={e => setSettings({ ...settings, successMessage:e.target.value })} /></label>
            <label>Status<select value={settings.status} onChange={e => setSettings({ ...settings, status:e.target.value as 'active'|'disabled' })}><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
            <button className="primary-action" onClick={() => void saveSettings()} disabled={saving}>Save Portal Settings</button>
          </div>
        </div>

        <div className="portal-preview-card">
          <div className="section-kicker">LIVE-STYLE MOBILE PREVIEW</div>
          <div className="portal-preview portal-preview-expanded">
            {brandLogo ? <img className="portal-brand-logo" src={brandLogo} alt="FLAMMES TECH" /> : <div className="portal-brand-logo portal-brand-logo-placeholder">FT</div>}
            <strong>{settings.logoText}</strong><h2>{settings.title}</h2><p>{settings.subtitle}</p>
            <div className="portal-preview-modes"><span><CreditCard size={12}/> M-PESA</span><span><Ticket size={12}/> Voucher</span></div>
            <div className="portal-preview-device"><Tv size={15}/><div><b>This device / another device</b><small>Target MAC supported for TVs and other devices</small></div></div>
            <div className="preview-package-list">{packages.slice(0,3).map(pkg => <div key={pkg.id}><span>{pkg.name}<small>{duration(pkg.durationMinutes)} • {pkg.speedMbps} Mbps{pkg.dataLimitMb ? ' • '+pkg.dataLimitMb+' MB' : ' • Unlimited'}</small></span><b>{money(pkg.price)}</b></div>)}</div>
            <div className="portal-preview-voucher"><KeyRound size={14}/><span>Use Voucher</span><b>ABCDE-*****</b></div>
            <small>{settings.successMessage}</small>
          </div>
        </div>
      </div>

      <div className="portal-support-admin"><div className="section-kicker">CUSTOMER SUPPORT NUMBERS</div><h2>Admin support contacts</h2><p>Add phone numbers customers should use when they need help. These contacts appear on the captive portal and are tap-to-call on phones.</p><div className="portal-support-form"><input aria-label="Support label" placeholder="Main Support" value={supportForm.label} onChange={e=>setSupportForm({...supportForm,label:e.target.value})}/><input aria-label="Support phone" placeholder="+254 7XX XXX XXX" value={supportForm.phone} onChange={e=>setSupportForm({...supportForm,phone:e.target.value})}/><button className="primary-action" onClick={()=>void addSupport()} disabled={saving}>Add Number</button></div><div className="portal-support-list">{supportContacts.map(item=><div className="portal-support-row" key={item.id}><div><strong>{item.label}</strong><small>{item.phone}</small></div><em className={item.enabled?'status-pill online':'status-pill offline'}><i/>{item.enabled?'enabled':'disabled'}</em><button className="edit-button" onClick={()=>void toggleSupport(item)}>{item.enabled?'Disable':'Enable'}</button><button className="edit-button danger-button" onClick={()=>void deleteSupport(item)}>Delete</button></div>)}{!supportContacts.length&&<div className="empty-inline">No support numbers configured.</div>}</div></div><div className="portal-feature-strip">
        <div><CreditCard size={18}/><strong>M-PESA STK Push</strong><small>Payment confirmation activates the selected device.</small></div>
        <div><Ticket size={18}/><strong>One-use Vouchers</strong><small>Staff can generate package-bound access codes.</small></div>
        <div><Tv size={18}/><strong>Target Device</strong><small>Enter the TV/device MAC instead of the paying phone.</small></div>
        <div><ShieldCheck size={18}/><strong>Fixed Validity</strong><small>Time runs from activation, even while offline.</small></div>
      </div>

      <div className="garden-section"><div className="section-kicker">WALLED GARDEN</div><h2>Pre-authentication allowlist</h2><p>Only explicitly allowed domains or IPv4 addresses should be reachable before authentication. These rules are centrally stored for router/gateway enforcement.</p>
        <div className="garden-form"><input aria-label="Walled garden host" placeholder="example.com" value={form.host} onChange={e=>setForm({...form,host:e.target.value})}/><select aria-label="Walled garden type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="domain">Domain</option><option value="ip">IPv4</option></select><input aria-label="Walled garden description" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><button className="primary-action" onClick={() => void addRule()} disabled={saving}>Add Rule</button></div>
        <div className="record-list">{rules.map(rule=><div className="record-row garden-row" key={rule.id}><span className="row-icon">{rule.type==='domain'?<Globe2 size={16}/>:<Wifi size={16}/>}</span><div><strong>{rule.host}</strong><small>{rule.type} • {rule.description||'Pre-authentication allowlist rule'}</small></div><em className={rule.enabled?'status-pill online':'status-pill offline'}><i/>{rule.enabled?'enabled':'disabled'}</em><button className="edit-button" onClick={()=>void toggleRule(rule)}>{rule.enabled?'Disable':'Enable'}</button><button className="edit-button danger-button" onClick={()=>void deleteRule(rule)}><Trash2 size={13}/> Delete</button></div>)}{!rules.length&&<div className="empty-inline">No walled-garden rules configured yet.</div>}</div>
      </div>
      <div className="integration-note"><ShieldCheck size={18}/><div><strong>Complete captive-portal flow</strong><p>Wi-Fi connection → captive portal → select M-PESA or voucher → choose this device or another device → optional target MAC → authentication → bandwidth policy → internet access → automatic expiry/data-limit disconnect.</p></div></div>
    </>}
  </section>;
}
