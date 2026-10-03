import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ws, auth } from '@appdeploy/client';
import LoginPortal from './LoginPortal';
import PortalAdmin from './PortalAdmin';
import GatewayAdmin from './GatewayAdmin';
import IntegrationAdmin from './IntegrationAdmin';
import BillingAdmin from './BillingAdmin';
import VoucherAdmin from './VoucherAdmin';
import NetworkTopologyAdmin from './NetworkTopologyAdmin';
import FirewallAdmin from './FirewallAdmin';
import {
  Activity, ArrowRight, AtSign, BarChart3, CalendarDays, CheckCircle2, ChevronDown,
  Cable, Clock3, CreditCard, Gauge, KeyRound, LayoutDashboard, MapPin, Menu, Network,
  Package, Plug, Receipt, Router, Settings, ShieldCheck, Ticket, UserRound,
  Users, Wifi, X, Zap
} from 'lucide-react';

type Dashboard = {
  customers: number;
  packages: number;
  activeSessions: number;
  routers: number;
  revenue: number;
  pendingPayments: number;
};
type PackageItem = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  speedMbps: number;
  dataLimitMb?: number;
  status: string;
};
type Customer = {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: number;
};
type Session = {
  id: string;
  customerId?: string;
  customerName: string;
  planName: string;
  status: string;
  accessState?: 'pending' | 'authorized' | 'revoked' | 'expired';
  remainingMinutes: number;
  expiresAt: number;
  deviceMac?: string;
  ipAddress?: string;
  routerId?: string;
  gatewayId?: string;
  bandwidthApplied?: boolean;
  bandwidthProfile?: { speedMbps: number; dataLimitMb?: number };
  dataUsedMb?: number;
  inputOctets?: number;
  outputOctets?: number;
  lastAccountingAt?: number;
};
type RouterItem = {
  id: string;
  name: string;
  vendor: string;
  macAddress?: string;
  manufacturerModel?: string;
  boardName?: string;
  host: string;
  location: string;
  apiPort?: number;
  apiTransport?: 'tcp' | 'tls';
  status: string;
  notes?: string;
  integration?: string;
  connectionType?: string;
  capabilities?: string[];
  hotspotInterfaces?: string[];
  hotspotInterfaceConfiguredAt?: number;
  lastCheckedAt?: number;
};
type RouterInterfaceItem = { id:string; name:string; defaultName?:string; type:string; mtu?:number; l2mtu?:number; macAddress?:string; running:boolean; disabled:boolean; dynamic:boolean; physical:boolean };
const physicalPortSort=(a:RouterInterfaceItem,b:RouterInterfaceItem)=>{const n=(v:string)=>{const m=v.match(/(?:ether|eth|sfpplus|sfp|wlan|wifi|lte)(\d+)/i);return m?Number(m[1]):999};return n(a.name)-n(b.name)||a.name.localeCompare(b.name);};
type HotspotServerItem = { id:string; name:string; interface:string; profile:string; disabled:boolean };
type GatewayItem = { id:string; name:string; platform:string; status:string };
type PortAllocationItem = { id:string; routerId:string; interfaceName:string; role:'hotspot'|'monthly_customer'; customerId?:string; customerName?:string; label?:string; enabled:boolean };
type Transaction = {
  id: string;
  customerName: string;
  packageName: string;
  amount: number;
  provider: string;
  status: string;
  reference: string;
  createdAt: number;
  paidAt?: number;
};
type OnboardingStep = { id: string; label: string; done: boolean };

const LOGO_STORAGE_KEY = 'flammes_tech_logo_data';
const money = (value: number) => `KES ${value.toLocaleString()}`;
const readStoredLogo = () => { try { return localStorage.getItem(LOGO_STORAGE_KEY) || ''; } catch { return ''; } };
const duration = (minutes: number) =>
  minutes >= 1440
    ? `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
    : `${minutes} min`;

const navItems = [
  ['Dashboard', LayoutDashboard],
  ['Customers', Users],
  ['Packages', Package],
  ['Sessions', Activity],
  ['Routers', Router],
  ['Network', Wifi],
  ['Topology', Network],
  ['Firewall', ShieldCheck],
  ['Portal', ShieldCheck],
  ['Gateways', Router],
  ['Integrations', Plug],
  ['Billing', CreditCard],
  ['Vouchers', Ticket],
  ['Transactions', Receipt],
  ['Reports', BarChart3],
  ['Staff', UserRound],
  ['Settings', Settings],
] as const;

type CaptivePortalContext = { gatewayId?: string; routerId?: string; deviceMac?: string; ipAddress?: string; expiresAt: number };
type SupportContact = { id:string; label:string; phone:string; enabled:boolean };
function CaptivePortalView({ token }: { token?: string }) {
  const [resolvedToken, setResolvedToken] = useState(token || '');
  const [context, setContext] = useState<CaptivePortalContext | null>(null);
  const [portalSettings, setPortalSettings] = useState({ title: 'FLAMMES HOTSPOT', subtitle: 'Choose a connectivity package to get online.', successMessage: 'Your package is ready.' });
  const [portalPackages, setPortalPackages] = useState<PackageItem[]>([]);
  const [phone, setPhone] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [portalMode, setPortalMode] = useState<'payment' | 'voucher'>('payment');
  const [targetDeviceMac, setTargetDeviceMac] = useState('');
  const [connectAnotherDevice, setConnectAnotherDevice] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [portalLogo, setPortalLogo] = useState(readStoredLogo);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);
  useEffect(() => { const syncLogo=()=>setPortalLogo(readStoredLogo()); window.addEventListener('flammes-logo-updated',syncLogo); return ()=>window.removeEventListener('flammes-logo-updated',syncLogo); }, []);
  useEffect(() => { void (async () => { try { let activeToken = token || ''; if (!activeToken) { const params = new URLSearchParams(window.location.search); const gatewayId = params.get('gatewayId') || ''; const routerId = params.get('routerId') || ''; const mac = params.get('mac') || ''; const ip = params.get('ip') || ''; if (!gatewayId || (!mac && !ip)) throw new Error('The hotspot could not supply your device identity. Reconnect to Wi-Fi and open Sign into network again.'); const entry = await api.get('/api/captive/entry?' + new URLSearchParams({ gatewayId, routerId, mac, ip }).toString()); activeToken = entry.data.contextToken || ''; if (!activeToken) throw new Error('The captive portal context could not be created.'); setResolvedToken(activeToken); } const result = await api.get('/api/captive/context/' + encodeURIComponent(activeToken)); setContext(result.data.context); setPortalSettings(result.data.settings); setPortalPackages(result.data.packages || []); setSupportContacts(result.data.supportContacts || result.data.settings.supportContacts || []); } catch (e) { setMessage(e instanceof Error ? e.message : 'Reconnect to Wi-Fi and open Sign into network again.'); } })(); }, [token]);
  const redeemVoucher = async () => {
    if (!voucherCode.trim()) { setMessage('Enter your voucher code first.'); return; }
    if (connectAnotherDevice && !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(targetDeviceMac.trim())) { setMessage('Enter the target device MAC in the format AA:BB:CC:DD:EE:FF.'); return; }
    if (!resolvedToken) { setMessage('Your secure device connection is not ready. Reconnect to Wi-Fi and try again.'); return; }
    setBusy(true);
    try {
      const result = await api.post('/api/vouchers/redeem', { code: voucherCode.trim(), contextToken: resolvedToken, targetDeviceMac: connectAnotherDevice ? targetDeviceMac.trim().toUpperCase() : undefined });
      setConnected(true);
      setMessage(`Voucher accepted. ${result.data.packageName} is active for the selected device. The sign-in screen will close automatically.`);
      window.setTimeout(() => { try { window.location.replace('http://connectivitycheck.gstatic.com/generate_204'); } catch {} }, 1200);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to redeem voucher.'); } finally { setBusy(false); }
  };

  const startPayment = async (pkg: PackageItem) => { if (!phone.trim()) { setMessage('Enter your M-PESA phone number first.'); return; } if (connectAnotherDevice && !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(targetDeviceMac.trim())) { setMessage('Enter the target device MAC in the format AA:BB:CC:DD:EE:FF.'); return; } if (!resolvedToken) { setMessage('Your secure device connection is not ready. Reconnect to Wi-Fi and try again.'); return; } setBusy(true); try { const purchase = await api.post('/api/purchases', { phone: phone.trim(), packageId: pkg.id, provider: 'mpesa', contextToken: resolvedToken, targetDeviceMac: connectAnotherDevice ? targetDeviceMac.trim().toUpperCase() : undefined }); const payment = await api.post('/api/transactions/' + purchase.data.id + '/mpesa/stk-push', {}); setMessage(payment.data.customerMessage || 'Check your phone and enter the M-PESA PIN.'); const deadline = Date.now() + 60000; while (Date.now() < deadline) { await new Promise(resolve => setTimeout(resolve, 3000)); const response = await api.get('/api/transactions'); const transaction = response.data.items?.find((item: Transaction) => item.id === purchase.data.id); if (transaction?.status === 'paid') { setConnected(true); setMessage('Payment confirmed. Your Wi-Fi connection is now active. The sign-in screen will close automatically.'); window.setTimeout(() => { try { window.location.replace('http://connectivitycheck.gstatic.com/generate_204'); } catch {} }, 1200); break; } if (transaction?.status === 'failed') { setMessage(transaction.resultDescription || 'M-PESA payment failed. Please try again.'); break; } } } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to start payment.'); } finally { setBusy(false); } };
  if (connected) return <div className="portal-page captive-portal-live"><div className="customer-portal-brand">{portalLogo ? <img src={portalLogo} alt="FLAMMES TECH" /> : <div className="customer-portal-brand-placeholder">FT</div>}<div><strong>{portalSettings.title}</strong><span>Connection active</span></div></div><div className="panel full-page-panel portal-connected-card"><span className="section-kicker">CONNECTED</span><h1>You're online</h1><div className="integration-note"><CheckCircle2 size={22} /><div><strong>Your Wi-Fi session is active</strong><p>The hotspot has authorized this device. The sign-in screen will close automatically and your phone can continue using Wi-Fi.</p></div></div><button className="primary-action wide" onClick={() => { try { window.location.replace('http://connectivitycheck.gstatic.com/generate_204'); } catch {} }}>Return to Wi-Fi</button><small>When your package time or data limit is depleted, the hotspot will disconnect this device and the captive portal will become available again.</small></div></div>;
  return <div className="portal-page captive-portal-live"><div className="customer-portal-brand">{portalLogo ? <img src={portalLogo} alt="FLAMMES TECH" /> : <div className="customer-portal-brand-placeholder">FT</div>}<div><strong>{portalSettings.title}</strong><span>Secure captive portal • {context?.deviceMac ? context.deviceMac : 'Device detected'}</span></div></div><div className="panel full-page-panel portal-live-card"><span className="section-kicker">SIGN INTO NETWORK</span><h1>{portalSettings.title}</h1><p>{portalSettings.subtitle}</p><div className="portal-mode-switch"><button type="button" className={portalMode === 'payment' ? 'primary-action' : 'secondary-action'} onClick={() => setPortalMode('payment')}><CreditCard size={15} /> Pay with M-PESA</button><button type="button" className={portalMode === 'voucher' ? 'primary-action' : 'secondary-action'} onClick={() => setPortalMode('voucher')}><Ticket size={15} /> Use Voucher</button></div><div className="integration-note"><Wifi size={18} /><div><strong>Choose the device that will receive access</strong><p>Pay with this device or enter a TV, decoder, phone, laptop or other device MAC address. The selected MAC becomes the session identity.</p></div></div><div className="portal-device-choice"><button type="button" className={!connectAnotherDevice ? 'primary-action' : 'secondary-action'} onClick={() => { setConnectAnotherDevice(false); setTargetDeviceMac(''); }}>This device</button><button type="button" className={connectAnotherDevice ? 'primary-action' : 'secondary-action'} onClick={() => setConnectAnotherDevice(true)}>Connect another device</button></div>{connectAnotherDevice && <div className="edit-form"><label>Target device MAC address<input value={targetDeviceMac} onChange={e => setTargetDeviceMac(e.target.value.toUpperCase())} placeholder="AA:BB:CC:DD:EE:FF" inputMode="text" autoCapitalize="characters" /><small>Payment or voucher redemption will be attached to this MAC address, not the phone used to open the portal.</small></label></div>}{portalMode === 'payment' ? <><div className="edit-form"><label>M-PESA phone number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XXXXXXXX" inputMode="tel" autoComplete="tel" /></label></div><div className="package-grid">{portalPackages.map(pkg => <div className="package-card" key={pkg.id}><Package size={24} /><h3>{pkg.name}</h3><strong>{money(pkg.price)}</strong><p>{duration(pkg.durationMinutes)} validity • {pkg.speedMbps} Mbps{pkg.dataLimitMb ? ' • ' + pkg.dataLimitMb + ' MB' : ' • Unlimited data'}</p><button className="primary-action wide" disabled={busy} onClick={() => void startPayment(pkg)}>{busy ? 'Waiting…' : 'Pay with M-PESA'} <ArrowRight size={16} /></button></div>)}</div></> : <div className="voucher-redeem-box"><div className="edit-form"><label>Voucher code<input value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} placeholder="ABCDE-12345" inputMode="text" autoCapitalize="characters" /></label><small>One-use voucher codes are generated by FLAMMES HOTSPOT staff.</small></div><button className="primary-action wide" disabled={busy} onClick={() => void redeemVoucher()}>{busy ? 'Checking Voucher…' : 'Redeem Voucher'} <KeyRound size={16} /></button></div>}{message && <div className="integration-note"><ShieldCheck size={18} /><div><strong>Payment & connectivity status</strong><p>{message}</p></div></div>}<small>Your device can open the captive portal again only after its active session expires or its data limit is depleted. Network identity is supplied by the hotspot gateway and is not manually trusted from the browser.</small>{supportContacts.length > 0 && <div className="support-contact-panel"><div><span className="section-kicker">CUSTOMER SUPPORT</span><strong>Need help?</strong><small>Contact the hotspot administrator.</small></div><div className="support-contact-list">{supportContacts.map(item => <a key={item.id} href={'tel:' + item.phone.replace(/[^+0-9]/g,'')}><AtSign size={15}/><span><b>{item.label}</b><small>{item.phone}</small></span></a>)}</div></div>}</div></div>;
}

function DashboardApp() {
  const [section, setSection] = useState('Dashboard');
  const [dashboard, setDashboard] = useState<Dashboard>({
    customers: 0,
    packages: 0,
    activeSessions: 0,
    routers: 0,
    revenue: 0,
    pendingPayments: 0,
  });
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandLogo, setBrandLogo] = useState(readStoredLogo);
  const [chartRange, setChartRange] = useState<7 | 30 | 90>(7);
  const [editTarget, setEditTarget] = useState<{ type: 'customer' | 'package' | 'router' | 'session'; item: Customer | PackageItem | RouterItem | Session } | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [createTarget, setCreateTarget] = useState<'customer' | 'package' | 'router' | null>(null);
  const [routerDetail, setRouterDetail] = useState<RouterItem | null>(null);
  const [routerLanConfig, setRouterLanConfig] = useState<any>(null);
  const [loadingLanConfig, setLoadingLanConfig] = useState(false);
  const [portRoleBusy, setPortRoleBusy] = useState<string | null>(null);
  const [routerTest, setRouterTest] = useState<{ status: string; message: string; capabilities: string[] } | null>(null);
  const [testingRouter, setTestingRouter] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<{ configured: Record<string, boolean>; security: string } | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [routerInterfaces, setRouterInterfaces] = useState<RouterInterfaceItem[]>([]);
  const [hotspotServers, setHotspotServers] = useState<HotspotServerItem[]>([]);
  const [selectedHotspotInterfaces, setSelectedHotspotInterfaces] = useState<string[]>([]);
  const [loadingInterfaces, setLoadingInterfaces] = useState(false);
  const [savingHotspotInterfaces, setSavingHotspotInterfaces] = useState(false);
  const [interfacesScannedAt, setInterfacesScannedAt] = useState<number | null>(null);
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [captiveGatewayId, setCaptiveGatewayId] = useState('');
  const [portAllocations, setPortAllocations] = useState<PortAllocationItem[]>([]);
  const [visualHotspotPorts, setVisualHotspotPorts] = useState<string[]>([]);
  const [allocationBusy, setAllocationBusy] = useState(false);
  const [activatingCaptive, setActivatingCaptive] = useState(false);
  const [captiveMessage, setCaptiveMessage] = useState('');

  const connRef = useRef<ReturnType<typeof ws.connect> | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, p, c, s, r, t, o, g] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/packages'),
        api.get('/api/customers'),
        api.get('/api/sessions'),
        api.get('/api/routers'),
        api.get('/api/transactions'),
        api.get('/api/onboarding'),
        api.get('/api/gateways'),
      ]);
      setDashboard(d.data);
      setPackages(p.data.items);
      setCustomers(c.data.items);
      setSessions(s.data.items);
      setRouters(r.data.items);
      setTransactions(t.data.items);
      setOnboarding(o.data.steps);
      setGateways(g.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const syncLogo=()=>setBrandLogo(readStoredLogo()); window.addEventListener('flammes-logo-updated',syncLogo); return ()=>window.removeEventListener('flammes-logo-updated',syncLogo); }, []);

  useEffect(() => {
    load();
    const conn = ws.connect();
    connRef.current = conn;
    conn.ready.then(() => {
      if (conn.connectionId) {
        api.post('/api/subscriptions', {
          entity_type: 'sessions',
          entity_id: 'all',
          connection_id: conn.connectionId,
        });
        api.post('/api/subscriptions', {
          entity_type: 'transactions',
          entity_id: 'all',
          connection_id: conn.connectionId,
        });
      }
    });
    conn.onMessage((message) => {
      if (message?.type !== 'entity.update') return;
      if (message.payload?.entity_type === 'sessions') {
        setSessions(message.payload.data?.items ?? []);
      }
      if (message.payload?.entity_type === 'transactions') {
        setTransactions(message.payload.data?.items ?? []);
      }
    });
    return () => {
      connRef.current = null;
      conn.disconnect();
    };
  }, []);

  const revenueSeries = useMemo(() => {
    const now = new Date();
    const points = Array.from({ length: chartRange }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - (chartRange - 1 - index));
      return { date, label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: 0 };
    });
    transactions.forEach((transaction) => {
      if (transaction.status !== 'paid') return;
      const date = new Date(transaction.paidAt ?? transaction.createdAt);
      const match = points.find((point) => point.date.toDateString() === date.toDateString());
      if (match) match.value += transaction.amount;
    });
    return points;
  }, [transactions, chartRange]);

  const packageUsage = useMemo(() => {
    const buckets = [
      { label: '1 Hour', min: 60, max: 60, value: 0, className: 'blue' },
      { label: '24 Hours', min: 1440, max: 1440, value: 0, className: 'cyan' },
      { label: '7 Days', min: 10081, max: 10080, value: 0, className: 'purple' },
      { label: '30 Days', min: 43200, max: 43200, value: 0, className: 'gold' },
    ];
    const counts = { one: 0, day: 0, week: 0, month: 0 };
    sessions.forEach((session) => {
      const pkg = packages.find((item) => item.name === session.planName);
      const mins = pkg?.durationMinutes ?? 0;
      if (mins <= 60) counts.one += 1;
      else if (mins <= 1440) counts.day += 1;
      else if (mins <= 10080) counts.week += 1;
      else counts.month += 1;
    });
    const total = counts.one + counts.day + counts.week + counts.month;
    const raw = [counts.one, counts.day, counts.week, counts.month];
    return buckets.map((bucket, index) => ({
      ...bucket,
      value: total ? Math.round((raw[index] / total) * 100) : 0,
    }));
  }, [packages, sessions]);

  const chart = useMemo(() => {
    const max = Math.max(...revenueSeries.map((item) => item.value), 1);
    const width = 760;
    const height = 220;
    const left = 50;
    const top = 18;
    const bottom = 34;
    const right = 18;
    const innerW = width - left - right;
    const innerH = height - top - bottom;
    const points = revenueSeries.map((item, index) => {
      const x = left + (index / Math.max(revenueSeries.length - 1, 1)) * innerW;
      const y = top + innerH - (item.value / max) * innerH;
      return { ...item, x, y };
    });
    return {
      points,
      path: points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '),
      area: `M ${points[0]?.x ?? left} ${top + innerH} ${points.map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')} L ${points.at(-1)?.x ?? width - right} ${top + innerH} Z`,
      max,
      width,
      height,
    };
  }, [revenueSeries]);

  const onlineRouters = routers.filter((router) => router.status.toLowerCase() === 'online').length;

  const navigate = (name: string) => {
    setSection(name);
    setNotice('');
    setMobileOpen(false);
  };

  const openCreate = (type: 'customer' | 'package' | 'router') => {
    setCreateTarget(type);
    if (type === 'customer') setEditForm({ name: '', phone: '', status: 'active' });
    if (type === 'package') setEditForm({ name: 'Daily 2 Mbps', price: '50', durationMinutes: '1440', speedMbps: '2', dataLimitMb: '', status: 'active' });
    if (type === 'router') setEditForm({ name: 'Primary Router', vendor: 'MikroTik', macAddress: '', host: '192.168.88.1', apiPort: '8728', apiTransport: 'tcp', location: 'Main Site', notes: '', status: 'configured' });
  };

  const addPackage = async () => openCreate('package');

  const addCustomer = async () => openCreate('customer');

  const openEdit = (type: 'customer' | 'package' | 'router' | 'session', item: Customer | PackageItem | RouterItem | Session) => {
    setEditTarget({ type, item });
    if (type === 'customer') {
      const value = item as Customer;
      setEditForm({ name: value.name, phone: value.phone, status: value.status });
    } else if (type === 'package') {
      const value = item as PackageItem;
      setEditForm({ name: value.name, price: String(value.price), durationMinutes: String(value.durationMinutes), speedMbps: String(value.speedMbps), dataLimitMb: value.dataLimitMb ? String(value.dataLimitMb) : '', status: value.status });
    } else if (type === 'router') {
      const value = item as RouterItem;
      setEditForm({ name: value.name, vendor: value.vendor, macAddress: value.macAddress ?? '', host: value.host, apiPort: String(value.apiPort ?? (value.vendor.toLowerCase().includes('mikrotik') ? 8728 : '')), apiTransport: value.apiTransport ?? 'tcp', location: value.location, status: value.status, notes: value.notes ?? '' });
    } else {
      const value = item as Session;
      setEditForm({ status: value.status, deviceMac: value.deviceMac ?? '', ipAddress: value.ipAddress ?? '' });
    }
  };

  const closeEdit = () => {
    if (!savingEdit) {
      setEditTarget(null);
      setCreateTarget(null);
      setEditForm({});
    }
  };

  const saveCreate = async () => {
    if (!createTarget) return;
    setSavingEdit(true);
    try {
      let result;
      if (createTarget === 'customer') {
        if (!editForm.name?.trim() || !editForm.phone?.trim()) throw new Error('Customer name and phone number are required.');
        result = await api.post('/api/customers', { name: editForm.name.trim(), phone: editForm.phone.trim() });
      } else if (createTarget === 'package') {
        const price = Number(editForm.price), durationMinutes = Number(editForm.durationMinutes), speedMbps = Number(editForm.speedMbps);
        if (!editForm.name?.trim() || !Number.isFinite(price) || !Number.isFinite(durationMinutes) || !Number.isFinite(speedMbps)) throw new Error('Complete all package fields with valid numbers.');
        result = await api.post('/api/packages', { name: editForm.name.trim(), price, durationMinutes, speedMbps, dataLimitMb: editForm.dataLimitMb ? Number(editForm.dataLimitMb) : undefined });
      } else {
        if (!editForm.name?.trim() || !editForm.vendor?.trim() || !editForm.host?.trim() || !editForm.location?.trim()) throw new Error('Name, vendor, host/IP and location are required.');
        result = await api.post('/api/routers', { name: editForm.name.trim(), vendor: editForm.vendor.trim(), macAddress: editForm.macAddress?.trim(), host: editForm.host.trim(), apiPort: editForm.apiPort ? Number(editForm.apiPort) : undefined, apiTransport: editForm.apiTransport === 'tls' ? 'tls' : 'tcp', location: editForm.location.trim(), notes: editForm.notes?.trim() ?? '' });
      }
      if (result.data?.id) {
        const destination = createTarget === 'customer' ? 'Customers' : createTarget === 'package' ? 'Packages' : 'Routers';
        setNotice(`${createTarget[0].toUpperCase()}${createTarget.slice(1)} created successfully.`);
        closeEdit();
        await load();
        navigate(destination);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to create record.');
    } finally {
      setSavingEdit(false);
    }
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      const path = editTarget.type === 'customer' ? `/api/customers/${editTarget.item.id}` : editTarget.type === 'package' ? `/api/packages/${editTarget.item.id}` : editTarget.type === 'router' ? `/api/routers/${editTarget.item.id}` : `/api/sessions/${editTarget.item.id}`;
      const payload = editTarget.type === 'package'
        ? { ...editForm, price: Number(editForm.price), durationMinutes: Number(editForm.durationMinutes), speedMbps: Number(editForm.speedMbps), dataLimitMb: editForm.dataLimitMb ? Number(editForm.dataLimitMb) : undefined }
        : editTarget.type === 'router'
          ? { ...editForm, macAddress: editForm.macAddress?.trim(), apiPort: editForm.apiPort ? Number(editForm.apiPort) : undefined, apiTransport: editForm.apiTransport === 'tls' ? 'tls' : 'tcp' }
          : editForm;
      const result = await api.patch(path, payload);
      if (result.data?.ok) {
        setNotice(`${editTarget.type[0].toUpperCase()}${editTarget.type.slice(1)} updated successfully.`);
        closeEdit();
        await load();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const addRouter = async () => openCreate('router');

  const sessionAction = async (session: Session, action: 'authorize' | 'disconnect') => {
    try {
      const result = await api.post(`/api/sessions/${session.id}/${action}`, action === 'authorize' ? { deviceMac: session.deviceMac, ipAddress: session.ipAddress, routerId: editForm.routerId || session.routerId } : { reason: 'admin_disconnect' });
      if (result.data?.ok) {
        setNotice(action === 'authorize' ? 'Session authorized successfully.' : 'Session disconnected successfully.');
        await load();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `Unable to ${action} session.`);
    }
  };

  const loadCredentialStatus = async (router: RouterItem) => {
    setLoadingCredentials(true);
    try {
      const result = await api.get(`/api/routers/${router.id}/credentials/status`);
      setCredentialStatus(result.data);
    } catch (error) {
      setCredentialStatus({ configured: {}, security: error instanceof Error ? error.message : 'Unable to read credential status.' });
    } finally {
      setLoadingCredentials(false);
    }
  };

  const testRouterConnection = async (router: RouterItem) => {
    setTestingRouter(true);
    setRouterTest(null);
    try {
      const result = await api.post(`/api/routers/${router.id}/test-connection`, {});
      setRouterTest(result.data);
      await load();
    } catch (error) {
      setRouterTest({ status: 'failed', message: error instanceof Error ? error.message : 'Connection test failed.', capabilities: [] });
    } finally {
      setTestingRouter(false);
    }
  };

  const loadRouterInterfaces = async (router: RouterItem) => { setLoadingInterfaces(true); setRouterInterfaces([]); setHotspotServers([]); setInterfacesScannedAt(null); try { const result=await api.get(`/api/routers/${router.id}/interfaces`); setRouterInterfaces(result.data.interfaces??[]); setHotspotServers(result.data.hotspotServers??[]); setSelectedHotspotInterfaces(result.data.configuredHotspotInterfaces??[]); setInterfacesScannedAt(result.data.scannedAt??Date.now()); const allocations=await api.get(`/api/routers/${router.id}/port-allocations`); setPortAllocations(allocations.data.items??[]); const configured=result.data.configuredHotspotInterfaces??[]; setVisualHotspotPorts(configured.filter((name:string)=>routerInterfaces.some((item:RouterInterfaceItem)=>item.name===name&&item.physical))); } catch(error) { setRouterTest({status:'failed',message:error instanceof Error?error.message:'Live interface scan failed.',capabilities:router.capabilities??[]}); } finally { setLoadingInterfaces(false); } };
  const loadRouterLanConfig = async (router: RouterItem) => { setLoadingLanConfig(true); try { const result=await api.get(`/api/routers/${router.id}/lan-config`); setRouterLanConfig(result.data.config??null); } catch(error){ setRouterLanConfig(null); setNotice(error instanceof Error?error.message:'Unable to inspect RouterOS LAN configuration.'); } finally { setLoadingLanConfig(false); } };
  const applyPortRole = async (iface:RouterInterfaceItem, role:'hotspot'|'normal_lan') => { if(!routerDetail||!iface.physical)return; setPortRoleBusy(iface.name); try { const res=await api.post(`/api/routers/${routerDetail.id}/port-role`,{interfaceName:iface.name,role}); setNotice(res.data.note||iface.name+' updated.'); await loadRouterInterfaces(routerDetail); await loadRouterLanConfig(routerDetail); } catch(error){ setNotice(error instanceof Error?error.message:'Unable to apply the port role.'); } finally { setPortRoleBusy(null); } };
  const savePortAllocation = async (interfaceName:string, role:'hotspot'|'monthly_customer', customerId?:string) => { if(!routerDetail)return; setAllocationBusy(true); try { if(role==='monthly_customer'&&!customerId){setNotice('Select the monthly customer for this port.');return;} const customer=customerId?customers.find(item=>item.id===customerId):undefined; await api.post(`/api/routers/${routerDetail.id}/port-allocations`,{interfaceName,role,customerId,label:role==='hotspot'?'Hotspot port':`Monthly customer port • ${customer?.name||'Customer'}`}); setNotice(`${interfaceName} assigned as ${role==='hotspot'?'hotspot':'monthly customer'} port.`); await loadRouterInterfaces(routerDetail); } catch(error){setNotice(error instanceof Error?error.message:'Unable to allocate port.');} finally{setAllocationBusy(false);} };
  const toggleVisualHotspotPort = async (iface:RouterInterfaceItem) => { if(!routerDetail||!iface.physical)return; const next=visualHotspotPorts.includes(iface.name)?visualHotspotPorts.filter(name=>name!==iface.name):[...visualHotspotPorts,iface.name]; const previous=visualHotspotPorts; setVisualHotspotPorts(next); setSavingHotspotInterfaces(true); try{await api.post(`/api/routers/${routerDetail.id}/hotspot-interfaces`,{interfaces:next});setSelectedHotspotInterfaces(next);setNotice(`${iface.name} is now ${next.includes(iface.name)?'HOTSPOT':'OTHER USE'}.`);}catch(e){setVisualHotspotPorts(previous);setNotice(e instanceof Error?e.message:'Unable to update port role.');}finally{setSavingHotspotInterfaces(false);}};
  const removePortAllocation = async (allocation:PortAllocationItem) => { if(!routerDetail)return; setAllocationBusy(true); try { await api.delete(`/api/routers/${routerDetail.id}/port-allocations/${allocation.id}`); await loadRouterInterfaces(routerDetail); } catch(error){setNotice(error instanceof Error?error.message:'Unable to remove port allocation.');} finally{setAllocationBusy(false);} };
  const saveHotspotInterfaces = async () => { if(!routerDetail)return; setSavingHotspotInterfaces(true); try { await api.post(`/api/routers/${routerDetail.id}/hotspot-interfaces`,{interfaces:selectedHotspotInterfaces}); setNotice('Exact live interface selection saved for this router.'); await load(); } catch(error) { setRouterTest({status:'failed',message:error instanceof Error?error.message:'Unable to save hotspot interfaces.',capabilities:routerDetail.capabilities??[]}); } finally { setSavingHotspotInterfaces(false); } };
  const applyHotspotInterfaces = async () => { if(!routerDetail)return; setSavingHotspotInterfaces(true); try { const result=await api.post(`/api/routers/${routerDetail.id}/hotspot-interfaces/apply`,{}); setNotice(result.data.note||'Hotspot interface list applied to the live router.'); await loadRouterInterfaces(routerDetail); } catch(error) { setRouterTest({status:'failed',message:error instanceof Error?error.message:'Unable to apply hotspot interface list.',capabilities:routerDetail.capabilities??[]}); } finally { setSavingHotspotInterfaces(false); } };

  const confirmPayment = async (transaction: Transaction) => {
    await api.post(`/api/transactions/${transaction.id}/confirm`);
    setNotice('Payment marked paid and connectivity activated.');
    await load();
    navigate('Sessions');
  };

  const topCustomers = customers.slice(0, 5);
  const topTransactions = transactions.slice(0, 5);
  const recentCustomerRows = topCustomers.map((customer) => {
    const session = sessions.find((item) => item.customerId === customer.id);
    return {
      ...customer,
      packageName: session?.planName ?? '—',
      status: session?.status ?? customer.status,
      timeLeft: session ? duration(session.remainingMinutes) : '—',
    };
  });

  const currentDateTime = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const donutBackground = (() => {
    let cursor = 0;
    const stops = packageUsage.map((item) => {
      const start = cursor;
      cursor += item.value;
      return `${item.value === 0 ? 'transparent' : 'var(--${item.className})'} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  })();

  const renderReport = () => (
    <section className="report-layout">
      <div className="panel report-hero">
        <div>
          <span className="section-kicker">OPERATIONS REPORT</span>
          <h2>Hotspot performance</h2>
          <p>Live operational figures from customers, sessions, routers and completed transactions.</p>
        </div>
        <div className="report-total">{money(dashboard.revenue)}</div>
      </div>
      <div className="report-grid">
        <div className="panel report-card"><span>Customers</span><strong>{dashboard.customers}</strong><small>Current subscriber records</small></div>
        <div className="panel report-card"><span>Sessions</span><strong>{dashboard.activeSessions}</strong><small>Currently active</small></div>
        <div className="panel report-card"><span>Routers</span><strong>{onlineRouters} / {dashboard.routers}</strong><small>Reported online</small></div>
        <div className="panel report-card"><span>Payments</span><strong>{transactions.length}</strong><small>Total transaction records loaded</small></div>
      </div>
      <div className="panel"><div className="panel-head"><div><h2>Revenue data</h2><p>Last seven days from paid transactions.</p></div></div>{revenueSeries.map((point) => <div className="report-line" key={point.label}><span>{point.label}</span><b>{money(point.value)}</b></div>)}</div>
    </section>
  );

  return (
    <div className="app-shell">
      <aside className={mobileOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-brand">
          {brandLogo ? <img className="brand-logo" src={brandLogo} alt="FLAMMES TECH" /> : <div className="brand-logo-placeholder"><span>FT</span><small>IMPORT LOGO</small></div>}
        </div>
        <nav className="sidebar-nav">
          {navItems.map(([name, Icon]) => (
            <button
              className={section === name ? 'nav-item active' : 'nav-item'}
              key={name}
              onClick={() => navigate(name)}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-promo">
          <div className="promo-mark"><Wifi size={38} /></div>
          <strong>FLAMMES</strong>
          <b>HOTSPOT</b>
          <span>Fast • Secure • Reliable</span>
        </div>
        <div className="sidebar-version">FLAMMES HOTSPOT <span>v1.0.0</span></div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="product-heading">
            <div className="wifi-badge">{brandLogo ? <img className="topbar-logo" src={brandLogo} alt="FLAMMES TECH" /> : <div className="topbar-logo-placeholder">FT</div>}</div>
            <div>
              <div className="product-name">FLAMMES <span>HOTSPOT</span></div>
              <div className="product-subtitle">Hotspot Management System</div>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="online-status"><i /> System Online</div>
            <div className="date-chip"><CalendarDays size={17} /> {currentDateTime}</div>
            <div className="profile-chip">
              <div className="profile-avatar"><UserRound size={19} /></div>
              <div><strong>Admin</strong><small>Super Admin</small></div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <main className="content">
          {notice && (
            <div className="notice">
              <CheckCircle2 size={17} />
              <span>{notice}</span>
              <button onClick={() => setNotice('')} aria-label="Close notification">×</button>
            </div>
          )}

          {loading ? (
            <div className="loading-card"><div className="spinner" /> Loading FLAMMES HOTSPOT…</div>
          ) : (
            <>
              {section === 'Dashboard' && (
                <>
                  <div className="dashboard-intro">
                    <div className="welcome-card">
                      <div className="welcome-icon"><Wifi size={45} /></div>
                      <div>
                        <h1>Welcome back, Admin!</h1>
                        <p>Here's what's happening with your hotspot today.</p>
                      </div>
                    </div>
                    <div className="session-highlight">
                      <div className="session-icon"><Users size={23} /></div>
                      <div><span>Active Sessions</span><strong>{dashboard.activeSessions}</strong><small>Live from session data</small></div>
                      <div className="mini-spark"><span /><span /><span /><span /><span /><span /></div>
                    </div>
                  </div>

                  <div className="stat-grid">
                    <div className="stat-card cyan"><div className="stat-icon"><Users size={23} /></div><span>Total Customers</span><strong>{dashboard.customers}</strong><small>Live database count</small></div>
                    <div className="stat-card green"><div className="stat-icon"><CreditCard size={23} /></div><span>Total Revenue</span><strong>{money(dashboard.revenue)}</strong><small>Completed transactions</small></div>
                    <div className="stat-card purple"><div className="stat-icon"><Wifi size={23} /></div><span>Active Sessions</span><strong>{dashboard.activeSessions}</strong><small>Current connectivity</small></div>
                    <div className="stat-card gold"><div className="stat-icon"><Router size={23} /></div><span>Routers Online</span><strong>{onlineRouters} / {dashboard.routers}</strong><small>{dashboard.routers ? `${Math.round((onlineRouters / dashboard.routers) * 100)}% reported online` : 'No routers registered'}</small></div>
                  </div>

                  <div className="dashboard-grid">
                    <div className="left-column">
                      <div className="panel revenue-panel">
                        <div className="panel-head"><div><h2><CalendarDays size={17} /> Revenue Overview</h2></div><button className="range-button" onClick={() => setChartRange((range) => range === 7 ? 30 : range === 30 ? 90 : 7)} aria-label="Change revenue chart range">Last {chartRange} days <ChevronDown size={14} /></button></div>
                        <div className="chart-wrap">
                          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Revenue overview chart">
                            {[0, 1, 2, 3, 4].map((line) => {
                              const y = 18 + (line / 4) * 168;
                              const label = Math.round((chart.max * (4 - line)) / 4);
                              return <g key={line}><line x1="50" x2="742" y1={y} y2={y} className="chart-grid" /><text x="0" y={y + 4} className="chart-label">{label.toLocaleString()}</text></g>;
                            })}
                            <path d={chart.area} className="chart-area" />
                            <path d={chart.path} className="chart-line" />
                            {chart.points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="4" className="chart-dot" />)}
                            {chart.points.map((point) => <text key={`label-${point.label}`} x={point.x} y="211" textAnchor="middle" className="chart-label">{point.label}</text>)}
                            <text x="4" y="31" className="chart-unit">KES</text>
                          </svg>
                        </div>
                      </div>

                      <div className="bottom-grid">
                        <div className="panel table-panel">
                          <div className="panel-head"><div><h2><Users size={17} /> Recent Customers</h2></div><button onClick={() => navigate('Customers')}>View All <ArrowRight size={14} /></button></div>
                          <div className="table-head customer-columns"><span>Username</span><span>Package</span><span>Status</span><span>Time Left</span></div>
                          {recentCustomerRows.map((customer) => (
                            <div className="table-row customer-columns" key={customer.id}>
                              <span className="person-cell"><span className="row-icon"><UserRound size={14} /></span>{customer.name}</span>
                              <span>{customer.packageName}</span>
                              <span><em className={customer.status.toLowerCase() === 'online' ? 'status-pill online' : 'status-pill offline'}><i />{customer.status}</em></span>
                              <span>{customer.timeLeft}</span>
                            </div>
                          ))}
                          {!recentCustomerRows.length && <div className="empty-inline">No customers yet.</div>}
                        </div>

                        <div className="panel table-panel">
                          <div className="panel-head"><div><h2><Receipt size={17} /> Latest Transactions</h2></div><button onClick={() => navigate('Transactions')}>View All <ArrowRight size={14} /></button></div>
                          <div className="table-head transaction-columns"><span>Date</span><span>Customer</span><span>Amount</span><span>Status</span></div>
                          {topTransactions.map((transaction) => (
                            <div className="table-row transaction-columns" key={transaction.id}>
                              <span>{new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <span>{transaction.customerName}</span>
                              <span>{money(transaction.amount)}</span>
                              <span><em className={transaction.status === 'paid' ? 'transaction-pill success' : 'transaction-pill pending'}>{transaction.status}</em></span>
                            </div>
                          ))}
                          {!topTransactions.length && <div className="empty-inline">No transactions yet.</div>}
                        </div>
                      </div>
                    </div>

                    <aside className="right-column">
                      <div className="panel network-panel">
                        <div className="panel-head"><div><h2>Network Status</h2></div><em className="online-badge">Online</em></div>
                        <div className="network-device">
                          <span className="network-icon"><Router size={19} /></span>
                          <div><strong>{routers[0]?.name ?? 'Primary Router'}</strong><small>{routers[0] ? `${routers[0].vendor} • ${routers[0].host}` : 'No router registered'}</small></div>
                          <em>{routers[0] ? routers[0].status : '—'}</em>
                        </div>
                        <div className="network-device">
                          <span className="network-icon"><Router size={19} /></span>
                          <div><strong>{routers[1]?.name ?? 'Secondary Router'}</strong><small>{routers[1] ? `${routers[1].vendor} • ${routers[1].host}` : 'Not configured'}</small></div>
                          <em>{routers[1] ? routers[1].status : '—'}</em>
                        </div>
                        <div className="network-metric"><Wifi size={18} /><span>Internet Connectivity</span><strong>Online</strong></div>
                        <div className="network-metric"><Clock3 size={18} /><span>Uptime</span><strong>Not reported</strong></div>
                        <div className="network-metric"><Network size={18} /><span>Active Interfaces</span><strong>Not reported</strong></div>
                        <button className="network-details" onClick={() => navigate('Network')}>View Network Details <ArrowRight size={16} /></button>
                      </div>

                      <div className="panel quick-panel">
                        <div className="panel-head"><div><h2><Zap size={17} /> Quick Actions</h2></div></div>
                        <button onClick={addCustomer}><Users size={18} /> Add Customer <ArrowRight size={15} /></button>
                        <button onClick={addPackage}><Package size={18} /> Create Package <ArrowRight size={15} /></button>
                        <button onClick={addRouter}><Router size={18} /> Register Router <ArrowRight size={15} /></button>
                        <button onClick={() => navigate('Reports')}><BarChart3 size={18} /> View Reports <ArrowRight size={15} /></button>
                      </div>

                      <div className="panel usage-panel">
                        <div className="panel-head"><div><h2><Gauge size={17} /> Package Usage</h2></div></div>
                        <div className="usage-content">
                          <div className="donut" style={{ background: donutBackground }}>
                            <div><strong>{dashboard.customers}</strong><span>Total Users</span></div>
                          </div>
                          <div className="legend">
                            {packageUsage.map((item) => <div key={item.label}><i className={item.className} /><span>{item.label}</span><b>{item.value}%</b></div>)}
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                </>
              )}

              {section === 'Customers' && <section className="panel full-page-panel"><PageHeader title="Customers" subtitle="Subscriber records used by the hotspot service." action={<button className="primary-action" onClick={addCustomer}>Add Customer <ArrowRight size={15} /></button>} /><div className="record-list">{customers.map((customer) => <div className="record-row" key={customer.id}><span className="row-icon"><Users size={16} /></span><div><strong>{customer.name}</strong><small>{customer.phone}</small></div><em className="status-pill online"><i />{customer.status}</em><b>{new Date(customer.createdAt).toLocaleDateString()}</b><button className="edit-button" onClick={() => openEdit('customer', customer)}>Edit</button></div>)}{!customers.length && <div className="empty-inline">No customers yet. Add the first subscriber.</div>}</div></section>}

              {section === 'Packages' && <section className="panel full-page-panel"><PageHeader title="Packages" subtitle="Pricing, validity and bandwidth profiles." action={<button className="primary-action" onClick={addPackage}>Create Package <ArrowRight size={15} /></button>} /><div className="record-list">{packages.map((pkg) => <div className="record-row" key={pkg.id}><span className="row-icon"><Package size={16} /></span><div><strong>{pkg.name}</strong><small>{duration(pkg.durationMinutes)} • {pkg.speedMbps} Mbps</small></div><em className="status-pill online"><i />{pkg.status}</em><b>{money(pkg.price)}</b><button className="edit-button" onClick={() => openEdit('package', pkg)}>Edit</button></div>)}{!packages.length && <div className="empty-inline">No packages yet.</div>}<button className="secondary-action portal-link" onClick={() => navigate('Customer Portal')}>Open Customer Package Portal <ArrowRight size={15} /></button></div></section>}

              {section === 'Sessions' && <section className="panel full-page-panel"><PageHeader title="Sessions" subtitle="Validity starts at purchase/activation and expires at the stored server timestamp, even while the device is offline." /><div className="record-list">{sessions.map((session) => <div className="record-row" key={session.id}><span className="row-icon"><Wifi size={16} /></span><div><strong>{session.customerName}</strong><small>{session.planName} • {session.bandwidthProfile?.speedMbps ?? '—'} Mbps{session.bandwidthProfile?.dataLimitMb ? ` • ${session.dataUsedMb ?? 0}/${session.bandwidthProfile.dataLimitMb} MB used` : ' • Unlimited data'} • expires {new Date(session.expiresAt).toLocaleString()} • {session.accessState ?? session.status}</small></div><em className={session.status === 'online' && session.accessState !== 'revoked' && session.accessState !== 'expired' ? 'status-pill online' : 'status-pill offline'}><i />{session.accessState ?? session.status}</em><b>{session.remainingMinutes > 0 ? duration(session.remainingMinutes) : 'Expired'}</b>{session.expiresAt > Date.now() && session.accessState !== 'authorized' ? <button className="edit-button" onClick={() => void sessionAction(session, 'authorize')}>Authorize</button> : null}{session.expiresAt > Date.now() && session.accessState === 'authorized' ? <button className="edit-button" onClick={() => void sessionAction(session, 'disconnect')}>Disconnect</button> : null}<button className="edit-button" onClick={() => openEdit('session', session)}>Edit</button></div>)}{!sessions.length && <div className="empty-inline">No connectivity sessions yet.</div>}<div className="integration-note"><Activity size={18} /><div><strong>Bandwidth + usage enforcement active.</strong><p>Accounting tracks cumulative input/output data. When a package data limit is reached, FLAMMES HOTSPOT removes the bandwidth policy and disconnects the client automatically.</p></div></div></div></section>}

              {section === 'Routers' && <section className="panel full-page-panel"><PageHeader title="Routers" subtitle="Universal router registry and integration control." action={<button className="primary-action" onClick={addRouter}>Register Router <ArrowRight size={15} /></button>} /><div className="feature-grid"><div className="feature"><Network size={18} /><strong>API • RADIUS • Gateway</strong><small>Common integration layer</small></div><div className="feature"><ShieldCheck size={18} /><strong>Capability based</strong><small>Device-specific features stay isolated</small></div><div className="feature"><Router size={18} /><strong>{routers.length} registered</strong><small>{onlineRouters} reported online</small></div></div><div className="record-list">{routers.map((router) => <div className="record-row" key={router.id}><span className="row-icon"><Router size={16} /></span><div><strong>{router.name}</strong><small>{router.vendor} • {router.host} • {router.location}{router.integration ? ` • ${router.integration}` : ''}</small></div><em className={router.status.toLowerCase() === 'online' ? 'status-pill online' : 'status-pill offline'}><i />{router.status}</em><b>{router.connectionType ?? 'Not tested'}</b><button className="edit-button" onClick={() => { setRouterTest(null); setCredentialStatus(null); setRouterDetail(router); void loadCredentialStatus(router); void loadRouterInterfaces(router); }}>Manage</button><button className="edit-button" onClick={() => openEdit('router', router)}>Edit</button></div>)}{!routers.length && <div className="empty-inline">No router registered yet.</div>}<div className="integration-note"><ShieldCheck size={18} /><div><strong>Step 1: universal integration foundation.</strong><p>Router registration now records the adapter family, connection model and discovered capabilities. Credentials remain server-side; live hardware handshakes and enforcement are added in later steps.</p></div></div></div></section>}

              {section === 'Network' && <section className="panel full-page-panel"><PageHeader title="Network" subtitle="Universal network control layer for FLAMMES HOTSPOT." /><div className="feature-grid"><div className="feature"><Network size={19} /><strong>Router adapter engine</strong><small>Common commands mapped to vendor-specific integrations.</small></div><div className="feature"><ShieldCheck size={19} /><strong>RADIUS / AAA</strong><small>Authentication, authorization and accounting foundation.</small></div><div className="feature"><Wifi size={19} /><strong>Captive portal</strong><small>Portal and walled-garden integration point.</small></div><div className="feature"><Gauge size={19} /><strong>Bandwidth policies</strong><small>Package speed policies ready for enforcement adapters.</small></div><div className="feature"><Activity size={19} /><strong>Session control</strong><small>Authorize, monitor and disconnect through capabilities.</small></div><div className="feature"><Router size={19} /><strong>Gateway fallback</strong><small>Local gateway path for hardware without native controls.</small></div></div><div className="integration-note"><Network size={18} /><div><strong>Universal integration foundation active</strong><p>Routers are registered independently from their vendor implementation. Each device can later expose API, RADIUS, captive portal, bandwidth and disconnect capabilities without changing the main dashboard.</p></div></div></section>}

              {section === 'Topology' && <NetworkTopologyAdmin />}
              {section === 'Firewall' && <FirewallAdmin />}

              {section === 'Portal' && <PortalAdmin />}
              {section === 'Gateways' && <GatewayAdmin />}
              {section === 'Integrations' && <IntegrationAdmin onNavigate={navigate} />}
              {section === 'Billing' && <BillingAdmin onNavigate={navigate} />}
              {section === 'Vouchers' && <VoucherAdmin />}

              {section === 'Transactions' && <section className="panel full-page-panel"><PageHeader title="Transactions" subtitle="Payment records and connectivity activation lifecycle." /><div className="record-list">{transactions.map((transaction) => <div className="record-row" key={transaction.id}><span className="row-icon"><CreditCard size={16} /></span><div><strong>{transaction.customerName}</strong><small>{transaction.packageName} • {transaction.reference} • {transaction.provider}</small></div><em className={transaction.status === 'paid' ? 'transaction-pill success' : 'transaction-pill pending'}>{transaction.status}</em><b>{money(transaction.amount)}</b>{transaction.status === 'pending' && <button className="row-action" onClick={() => confirmPayment(transaction)}>Confirm</button>}</div>)}{!transactions.length && <div className="empty-inline">No transactions yet.</div>}<div className="integration-note"><CreditCard size={18} /><div><strong>Payment lifecycle preserved.</strong><p>Pending transactions remain pending until provider confirmation or an authorized manual confirmation.</p></div></div></div></section>}

              {section === 'Reports' && renderReport()}

              {section === 'Staff' && <section className="panel full-page-panel"><PageHeader title="Staff" subtitle="Staff and operator access area." /><div className="feature-grid"><div className="feature"><UserRound size={19} /><strong>Super Admin</strong><small>Full FLAMMES HOTSPOT control</small></div><div className="feature"><ShieldCheck size={19} /><strong>Protected operations</strong><small>Credentials stay on the backend</small></div><div className="feature"><Activity size={19} /><strong>Live monitoring</strong><small>Sessions and transactions update through the existing realtime layer</small></div></div><div className="integration-note"><ShieldCheck size={18} /><div><strong>Staff management foundation</strong><p>The current application preserves the protected operator architecture. Role-specific staff provisioning can be extended without changing the dashboard shell.</p></div></div></section>}

              {section === 'Settings' && <section className="panel full-page-panel"><PageHeader title="Settings" subtitle="Production configuration and operational preferences." /><div className="branding-card"><div><span className="section-kicker">BRANDING</span><h2>FLAMMES TECH Logo</h2><p>Import your logo directly from this device. It will be used across the dashboard and captive portal on this browser.</p></div><div className="branding-upload-row">{brandLogo ? <img className="branding-preview" src={brandLogo} alt="Current FLAMMES TECH logo" /> : <div className="branding-preview branding-empty">FT</div>}<label className="upload-logo-button">{brandLogo ? 'Replace Logo' : 'Import Logo'}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => { const file=e.target.files?.[0]; if(!file)return; if(file.size>3*1024*1024){setNotice('Logo must be 3 MB or smaller.');return;} const reader=new FileReader(); reader.onload=()=>{const value=String(reader.result||'');try{localStorage.setItem(LOGO_STORAGE_KEY,value);}catch{setNotice('Unable to save the logo on this device.');return;}setBrandLogo(value);window.dispatchEvent(new Event('flammes-logo-updated'));setNotice('FLAMMES TECH logo imported successfully.');};reader.readAsDataURL(file);e.currentTarget.value='';}} /></label>{brandLogo && <button className="secondary-action" onClick={()=>{localStorage.removeItem(LOGO_STORAGE_KEY);setBrandLogo('');window.dispatchEvent(new Event('flammes-logo-updated'));setNotice('Custom logo removed.');}}>Remove Logo</button>}</div><small className="branding-note">PNG, JPG, WEBP or SVG • Maximum 3 MB • Saved locally on this device/browser.</small></div><div className="feature-grid">{['Payment provider credentials', 'Router credential vault', 'Captive portal domain', 'Business profile', 'Notification channels', 'Admin roles & audit log'].map((item) => <div className="feature" key={item}><Settings size={18} /><strong>{item}</strong><small>Configuration slot</small></div>)}</div><div className="integration-note"><ShieldCheck size={18} /><div><strong>Security boundary preserved.</strong><p>Payment and router secrets must remain server-side. Existing backend integrations are not moved into client code.</p></div></div><div className="settings-checklist"><h3>Launch checklist</h3>{onboarding.map((step) => <div className="check-row" key={step.id}>{step.done ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}<span>{step.label}</span><em>{step.done ? 'Complete' : 'Pending'}</em></div>)}</div></section>}

              {section === 'Customer Portal' && <section className="portal-page"><div className="customer-portal-brand">{brandLogo ? <img src={brandLogo} alt="FLAMMES TECH" /> : <div className="customer-portal-brand-placeholder">FT</div>}<div><strong>FLAMMES HOTSPOT</strong><span>Secure connectivity portal</span></div></div><PageHeader title="Customer Package Portal" subtitle="Select connectivity. Payment confirmation activates the purchased validity." /><div className="package-grid">{packages.map((pkg) => <div className="package-card" key={pkg.id}><Package size={24} /><h3>{pkg.name}</h3><strong>{money(pkg.price)}</strong><p>{duration(pkg.durationMinutes)} validity • {pkg.speedMbps} Mbps</p><button className="primary-action wide" onClick={async () => { const customer = customers[0]; if (!customer) { setNotice('Add a customer first.'); navigate('Customers'); return; } const query = new URLSearchParams(window.location.search); const deviceMac = query.get('mac') || query.get('deviceMac') || undefined; const ipAddress = query.get('ip') || query.get('ipAddress') || undefined; const routerId = query.get('router') || query.get('routerId') || undefined; const gatewayId = query.get('gateway') || query.get('gatewayId') || undefined; const result = await api.post('/api/purchases', { customerId: customer.id, packageId: pkg.id, provider: 'mpesa', deviceMac, ipAddress, routerId, gatewayId }); const payment = await api.post(`/api/transactions/${result.data.id}/mpesa/stk-push`, {}); setNotice(payment.data.customerMessage || `M-PESA prompt sent for ${result.data.reference}. Check the customer's phone and enter the M-PESA PIN.`); const deadline = Date.now() + 60000; let confirmed = false; while (Date.now() < deadline) { await new Promise(resolve => setTimeout(resolve, 3000)); const transactionResponse = await api.get('/api/transactions'); const transaction = transactionResponse.data.items?.find((item: any) => item.id === result.data.id); if (transaction?.status === 'paid') { confirmed = true; setNotice('Payment confirmed. Your connectivity is activating now.'); break; } if (transaction?.status === 'failed') { setNotice(transaction.resultDescription || 'M-PESA payment failed. Please try again.'); break; } } if (!confirmed) setNotice('Payment is still pending. Complete the M-PESA prompt; the portal will activate connectivity when Safaricom confirms payment.'); await load(); navigate('Transactions'); }}>Start Payment <ArrowRight size={16} /></button></div>)}</div></section>}
            </>
          )}
        </main>

        {(editTarget || createTarget) && (
          <div className="modal-backdrop" role="presentation" onMouseDown={closeEdit}>
            <div className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title" onMouseDown={(event) => event.stopPropagation()}>
              <div className="edit-modal-head">
                <div><span className="section-kicker">{createTarget ? 'NEW RECORD' : 'EDIT RECORD'}</span><h2 id="edit-title">{createTarget ? `Create ${createTarget}` : `Edit ${editTarget?.type}`}</h2><p>{createTarget ? 'Enter the details below in a clean form.' : 'Make changes in this clean form and save them securely.'}</p></div>
                <button className="modal-close" onClick={closeEdit} disabled={savingEdit} aria-label="Close edit form"><X size={19} /></button>
              </div>
              <div className="edit-form">
                {(createTarget === 'customer' || editTarget?.type === 'customer') && <><label>Customer name<input value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} autoFocus /></label><label>Phone number<input value={editForm.phone ?? ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></label><label>Status<select value={editForm.status ?? 'active'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label></>}
                {(createTarget === 'package' || editTarget?.type === 'package') && <><label>Package name<input value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} autoFocus /></label><div className="form-two"><label>Price (KES)<input type="number" min="0" value={editForm.price ?? ''} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} /></label><label>Validity (minutes)<input type="number" min="1" value={editForm.durationMinutes ?? ''} onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })} /></label></div><div className="form-two"><label>Speed (Mbps)<input type="number" min="1" value={editForm.speedMbps ?? ''} onChange={(e) => setEditForm({ ...editForm, speedMbps: e.target.value })} /></label><label>Data limit (MB)<input type="number" min="0" value={editForm.dataLimitMb ?? ''} onChange={(e) => setEditForm({ ...editForm, dataLimitMb: e.target.value })} /></label></div><label>Status<select value={editForm.status ?? 'active'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label></>}
                {(createTarget === 'router' || editTarget?.type === 'router') && <><label>Router name<input value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} autoFocus /></label><div className="form-two"><label>Vendor<select value={editForm.vendor ?? ''} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}><option value="MikroTik">MikroTik</option><option value="Ubiquiti">Ubiquiti</option><option value="OpenWrt">OpenWrt</option><option value="Cisco">Cisco</option><option value="TP-Link/Omada">TP-Link / Omada</option><option value="Generic">Generic / Other</option>{editForm.vendor && !['MikroTik','Ubiquiti','OpenWrt','Cisco','TP-Link/Omada','Generic'].includes(editForm.vendor) && <option value={editForm.vendor}>{editForm.vendor}</option>}</select></label><label>Host / IP<input value={editForm.host ?? ''} onChange={(e) => setEditForm({ ...editForm, host: e.target.value })} /></label></div><label>Router MAC address<input value={editForm.macAddress ?? ''} onChange={(e) => setEditForm({ ...editForm, macAddress: e.target.value.toUpperCase() })} placeholder="AA:BB:CC:DD:EE:FF" /></label><div className="form-two"><label>API port<input type="number" min="1" max="65535" value={editForm.apiPort ?? ''} onChange={(e) => setEditForm({ ...editForm, apiPort: e.target.value })} /></label><label>API transport<select value={editForm.apiTransport ?? 'tcp'} onChange={(e) => setEditForm({ ...editForm, apiTransport: e.target.value })}><option value="tcp">RouterOS API — TCP</option><option value="tls">RouterOS API — TLS</option></select></label></div><div className="integration-note"><Network size={16} /><div><strong>RouterOS API connection</strong><p>FLAMMES HOTSPOT will connect from the backend using the stored API username/password. Never enter the password here.</p></div></div><label>Location<input value={editForm.location ?? ''} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} /></label><label>Notes<textarea value={editForm.notes ?? ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} /></label><label>Status<select value={editForm.status ?? 'configured'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="configured">Configured</option><option value="online">Online</option><option value="offline">Offline</option></select></label></>}
                {editTarget?.type === 'session' && <><label>Status<select value={editForm.status ?? 'online'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="online">Online</option><option value="offline">Offline</option></select></label><label>Device MAC<input value={editForm.deviceMac ?? ''} onChange={(e) => setEditForm({ ...editForm, deviceMac: e.target.value })} autoFocus /></label><label>IP address<input value={editForm.ipAddress ?? ''} onChange={(e) => setEditForm({ ...editForm, ipAddress: e.target.value })} /></label><label>Enforcement router<select value={editForm.routerId ?? ''} onChange={(e) => setEditForm({ ...editForm, routerId: e.target.value })}><option value="">Gateway / automatic</option>{routers.map((router) => <option key={router.id} value={router.id}>{router.name} • {router.vendor}</option>)}</select></label><div className="integration-note"><Gauge size={16} /><div><strong>Package speed</strong><p>{(editTarget as Session).bandwidthProfile?.speedMbps ?? 'Package speed will be loaded on authorization'} Mbps</p></div></div></>}
              </div>
              <div className="edit-modal-actions"><button className="secondary-action" onClick={closeEdit} disabled={savingEdit}>Cancel</button><button className="primary-action" onClick={createTarget ? saveCreate : saveEdit} disabled={savingEdit}>{savingEdit ? 'Saving…' : createTarget ? 'Create Record' : 'Save Changes'}</button></div>
            </div>
          </div>
        )}

        {routerDetail && (
          <div className="modal-backdrop" onMouseDown={() => !testingRouter && setRouterDetail(null)}>
            <div className="edit-modal" onMouseDown={(event) => event.stopPropagation()}>
              <div className="edit-modal-head"><div><span className="section-kicker">ROUTER INTEGRATION</span><h2>{routerDetail.name}</h2><p>{routerDetail.vendor} • {routerDetail.host}</p></div><button className="icon-close" onClick={() => setRouterDetail(null)} aria-label="Close router details"><X size={19} /></button></div>
              <div className="feature-grid"><div className="feature"><span>Status</span><strong>{routerDetail.status}</strong></div><div className="feature"><span>Integration</span><strong>{routerDetail.integration ?? 'Generic adapter'}</strong></div><div className="feature"><span>Connection</span><strong>{routerDetail.connectionType ?? 'Not tested'}</strong></div><div className="feature"><span>Location</span><strong>{routerDetail.location}</strong></div></div>
              <div className="integration-note"><Network size={18} /><div><strong>Detected capabilities</strong><p>{routerDetail.capabilities?.length ? routerDetail.capabilities.join(' • ') : 'No capabilities discovered yet. Run the integration test.'}</p></div></div>
              <div className="router-interface-panel">
                <div className="router-manager-strip"><div><span className="section-kicker">REAL ROUTEROS MANAGEMENT</span><h3>LAN / bridge configuration</h3><p>Inspect the actual bridge, DHCP, IP, NAT and interface-list state before assigning ports. FLAMMES HOTSPOT will not invent a LAN topology.</p></div><button className="secondary-action" onClick={()=>void loadRouterLanConfig(routerDetail)} disabled={loadingLanConfig}>{loadingLanConfig?'Reading…':'Inspect Live LAN'}</button></div>
                {routerLanConfig && <div className="router-config-grid"><div><span>LAN bridge</span><strong>{routerLanConfig.recommendedLanBridge||'Not safely identified'}</strong></div><div><span>DHCP servers</span><strong>{routerLanConfig.dhcpServers?.filter((x:any)=>!x.disabled).length??0}</strong></div><div><span>IP addresses</span><strong>{routerLanConfig.ipAddresses?.length??0}</strong></div><div><span>NAT rules</span><strong>{routerLanConfig.natRules?.filter((x:any)=>!x.disabled).length??0}</strong></div></div>}
                <div className="routeros-manufacturer-banner"><div><span className="section-kicker">MANUFACTURER: {routerDetail.vendor.toUpperCase()}</span><h3>{routerDetail.manufacturerModel || routerDetail.boardName || 'RouterOS'} — physical rear panel</h3><p>Router MAC: <b>{routerDetail.macAddress || 'Not registered'}</b> • Model/board: <b>{routerDetail.manufacturerModel || routerDetail.boardName || 'detected after live test'}</b></p></div><div className="manufacturer-badge">{routerDetail.vendor.includes('Mikro') ? 'ROS' : 'ADAPTER'}</div></div>
                <div className="physical-router-visual"><div className="router-rear-label"><span>REAR PANEL PORT SELECTOR</span><small>LIVE HARDWARE INVENTORY</small></div><div className="router-port-bank">{routerInterfaces.filter(item=>item.physical).sort(physicalPortSort).map(iface=>{const isHotspot=visualHotspotPorts.includes(iface.name);const allocation=portAllocations.find(item=>item.interfaceName===iface.name&&item.enabled);return <button type="button" key={iface.id||iface.name} className={`physical-port ${isHotspot?'port-hotspot':'port-other'} ${iface.running?'port-running':'port-down'}`} disabled={savingHotspotInterfaces} onClick={()=>void toggleVisualHotspotPort(iface)} title={`${iface.name} • ${isHotspot?'HOTSPOT':'OTHER USE'}`}><span className="port-hole"><i /></span><strong>{iface.name}</strong><small>{iface.defaultName&&iface.defaultName!==iface.name?iface.defaultName:iface.type}</small><em>{isHotspot?'HOTSPOT':allocation?.customerName?'MONTHLY':'OTHER USE'}</em></button>})}{!routerInterfaces.filter(item=>item.physical).length&&<div className="physical-port-empty">Scan the live RouterOS interface inventory to load the rear-panel ports.</div>}</div><div className="router-visual-legend"><span><i className="legend-hotspot"/> HOTSPOT</span><span><i className="legend-other"/> OTHER USE</span><span><i className="legend-down"/> DOWN</span></div></div>
                <div className="router-interface-head"><div><span className="section-kicker">LIVE ROUTER INTERFACES</span><h3>Exact interface inventory</h3><p>Read directly from the connected router. Nothing is guessed or fabricated.</p></div><button className="secondary-action" onClick={() => void loadRouterInterfaces(routerDetail)} disabled={loadingInterfaces}>{loadingInterfaces?'Scanning…':'Scan Live Router'}</button></div>
                {interfacesScannedAt && <div className="live-scan-meta"><Cable size={14}/> Source: RouterOS API • exact live scan • {new Date(interfacesScannedAt).toLocaleString()}</div>}
                {loadingInterfaces ? <div className="empty-inline">Reading the router's real interface table…</div> : routerInterfaces.length ? <div className="interface-inventory">{routerInterfaces.map(iface => <label className={selectedHotspotInterfaces.includes(iface.name)?'interface-card selected':'interface-card'} key={iface.id||iface.name}><input type="checkbox" checked={selectedHotspotInterfaces.includes(iface.name)} onChange={() => setSelectedHotspotInterfaces(current => current.includes(iface.name)?current.filter(name=>name!==iface.name):[...current,iface.name])}/><span className="interface-main"><strong>{iface.name}</strong><small>{iface.physical?'Physical port':'Logical interface'} • type: {iface.type}{iface.defaultName&&iface.defaultName!==iface.name?` • default: ${iface.defaultName}`:''}</small><small>{iface.macAddress?`MAC ${iface.macAddress} • `:''}{iface.mtu?`MTU ${iface.mtu} • `:''}{iface.running?'RUNNING':'NOT RUNNING'}{iface.disabled?' • DISABLED':''}{iface.dynamic?' • DYNAMIC':''}</small></span><em>{selectedHotspotInterfaces.includes(iface.name)?'HOTSPOT':iface.physical?'AVAILABLE':'INTERFACE'}</em></label>)}</div> : <div className="empty-inline">No live interface inventory is available. Connect the router and scan again.</div>}
                {routerInterfaces.length>0 && <div className="hotspot-selection-actions"><span>{selectedHotspotInterfaces.length} interface(s) selected</span><button className="secondary-action" onClick={() => void saveHotspotInterfaces()} disabled={savingHotspotInterfaces}>{savingHotspotInterfaces?'Saving…':'Save Hotspot Ports'}</button><button className="primary-action" onClick={() => void applyHotspotInterfaces()} disabled={savingHotspotInterfaces||!selectedHotspotInterfaces.length}>{savingHotspotInterfaces?'Applying…':'Apply Router Interface List'}</button></div>}
                <div className="port-allocation-panel"><div className="router-interface-head"><div><span className="section-kicker">PORT ASSIGNMENT</span><h3>Click the rear-panel ports above</h3><p>Green = Hotspot. Dark = Other Use. Every port shown above comes from the live RouterOS inventory; no ports are invented.</p></div></div><div className="port-role-grid">{routerInterfaces.filter(i=>i.physical).map(iface=>{const allocation=portAllocations.find(item=>item.interfaceName===iface.name&&item.enabled);return <div className="port-role-card" key={iface.id||iface.name}><div><strong>{iface.name}</strong><small>{iface.type} • {iface.macAddress||'no port MAC reported'} • {iface.running?'RUNNING':'DOWN'}</small></div>{allocation?<><span className={allocation.role==='hotspot'?'role-hotspot':'role-monthly'}>{allocation.role==='hotspot'?'HOTSPOT':`MONTHLY • ${allocation.customerName||'Customer'}`}</span><button className="secondary-action" disabled={allocationBusy} onClick={()=>void removePortAllocation(allocation)}>Unassign</button></>:<div className="port-role-actions"><button className="secondary-action" disabled={allocationBusy} onClick={()=>void savePortAllocation(iface.name,'hotspot')}>Hotspot</button><select className="port-customer-select" disabled={allocationBusy||customers.length===0} defaultValue="" onChange={e=>{if(e.target.value)void savePortAllocation(iface.name,'monthly_customer',e.target.value);e.currentTarget.value='';}}><option value="">Monthly customer…</option>{customers.map(customer=><option key={customer.id} value={customer.id}>{customer.name} • {customer.phone}</option>)}</select></div>}</div>})}</div></div>
                <div className="captive-activation-panel">
                  <div><span className="section-kicker">REAL CAPTIVE INTERCEPTION</span><h3>Automatic hotspot redirect</h3><p>Installs a dedicated FLAMMES login page on the live RouterOS HotSpot profile and captures the real client MAC/IP from RouterOS.</p></div>
                  <div className="form-two"><label>Gateway Agent<select value={captiveGatewayId} onChange={e=>setCaptiveGatewayId(e.target.value)}><option value="">Select Gateway Agent</option>{gateways.map(g=><option key={g.id} value={g.id}>{g.name} • {g.platform} • {g.status}</option>)}</select></label><label>HotSpot interface<select value={selectedHotspotInterfaces[0]||''} onChange={e=>setSelectedHotspotInterfaces(e.target.value?[e.target.value]:[])}><option value="">Select live interface</option>{routerInterfaces.filter(i=>i.running&&!i.disabled).map(i=><option key={i.name} value={i.name}>{i.name} • {i.type}</option>)}</select></label></div>
                  <button className="primary-action" disabled={activatingCaptive||!captiveGatewayId||!selectedHotspotInterfaces[0]} onClick={async()=>{setActivatingCaptive(true);setCaptiveMessage('');try{const res=await api.post('/api/routers/'+routerDetail.id+'/captive/activate',{interfaceName:selectedHotspotInterfaces[0],gatewayId:captiveGatewayId});setCaptiveMessage(res.data.localInterception?'Captive interception is active. Unauthenticated clients will be redirected by the router HotSpot.':'Captive interception configured.');}catch(e){setCaptiveMessage(e instanceof Error?e.message:'Unable to activate captive interception.');}finally{setActivatingCaptive(false);}}}>{activatingCaptive?'Activating…':'Activate Captive Interception'} <ArrowRight size={15}/></button>
                  {captiveMessage&&<div className="integration-note"><ShieldCheck size={16}/><div><strong>Captive interception status</strong><p>{captiveMessage}</p></div></div>}
                </div>
                <div className="integration-note"><Network size={16}/><div><strong>Safe RouterOS boundary</strong><p>The Apply action creates/updates only the RouterOS interface list <b>FLAMMES-HOTSPOT</b>. It does not change bridge membership, IP addresses, DHCP, NAT or HotSpot server setup. RouterOS HotSpot requires an interface plus network/pool/profile, so those are not guessed.</p></div></div>
                {hotspotServers.length>0 && <div className="hotspot-server-list"><strong>Existing HotSpot servers detected on router</strong>{hotspotServers.map(server=><span key={server.id||server.name}>{server.name} → {server.interface}{server.disabled?' • disabled':''}</span>)}</div>}
              </div>
              <div className="integration-note"><ShieldCheck size={18} /><div><strong>Secure credential vault</strong><p>{loadingCredentials ? 'Checking encrypted backend credentials…' : credentialStatus?.security ?? 'Credential status unavailable.'}</p><div className="capability-list">{[['API username', 'apiUsername'], ['API password', 'apiPassword'], ['API token', 'apiToken'], ['RADIUS secret', 'radiusSecret']].map(([label, key]) => <span key={key}><CheckCircle2 size={15} />{label}: {credentialStatus?.configured?.[key] ? 'Configured' : 'Not configured'}</span>)}</div></div></div>
              {routerTest && <div className={routerTest.status === 'success' ? 'integration-note' : 'integration-note'}><CheckCircle2 size={18} /><div><strong>{routerTest.status === 'success' ? 'Connection test passed' : 'Connection test failed'}</strong><p>{routerTest.message}</p></div></div>}
              <div className="edit-modal-actions"><button className="secondary-action" onClick={() => openEdit('router', routerDetail)}>Edit Router</button><button className="primary-action" onClick={() => testRouterConnection(routerDetail)} disabled={testingRouter}>{testingRouter ? 'Testing…' : 'Test Integration'}</button></div>
            </div>
          </div>
        )}

        <footer className="footer">
          <span>© 2026 FLAMMES TECH. All rights reserved.</span>
          <span>Powered by <b>FLAMMES TECH</b></span>
          <span>© 2026 FLAMMES TECH</span>
        </footer>
      </div>
    </div>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const captiveToken = params.get('context') || undefined;
  const captiveMode = params.get('captive') === '1';
  if (captiveMode) return <CaptivePortalView token={captiveToken} />;
  if (!auth.isSignedIn()) return <LoginPortal />;
  return <DashboardApp />;
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><span className="section-kicker">FLAMMES HOTSPOT</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

export default App;
