import { useEffect, useState } from 'react';
import { api } from '@appdeploy/client';
import { CreditCard, Gauge, Globe2, Network, Plug, RefreshCw, Router, ShieldCheck } from 'lucide-react';

type IntegrationAdminProps = { onNavigate: (name: string) => void };
type RouterItem = { id: string; name: string; vendor: string; host: string; status: string };
type Gateway = { id: string; name: string; platform: string; status: string; version?: string };
type RadiusConfig = { authenticationPort: number; accountingPort: number; configuredRouters: number; mode: string };
type MpesaStatus = { environment?: string; configured?: Record<string, boolean> };
type PaystackStatus = { environment?: string; configured?: Record<string, boolean>; ready?: boolean };

type CardProps = { icon: React.ReactNode; title: string; status: string; pending?: boolean; description: string; details: [string, string][]; action: string; onAction: () => void };

export default function IntegrationAdmin({ onNavigate }: IntegrationAdminProps) {
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [radius, setRadius] = useState<RadiusConfig | null>(null);
  const [mpesa, setMpesa] = useState<MpesaStatus | null>(null);
  const [paystack, setPaystack] = useState<PaystackStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [routerResult, gatewayResult, radiusResult, mpesaResult, paystackResult] = await Promise.all([
        api.get('/api/routers'),
        api.get('/api/gateways'),
        api.get('/api/radius/config'),
        api.get('/api/payments/mpesa/status'),
        api.get('/api/payments/paystack/status'),
      ]);
      setRouters(routerResult.data.items ?? []);
      setGateways(gatewayResult.data.items ?? []);
      setRadius(radiusResult.data);
      setMpesa(mpesaResult.data);
      setPaystack(paystackResult.data);
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load integration status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const onlineRouters = routers.filter((item) => item.status.toLowerCase() === 'online').length;
  const onlineGateways = gateways.filter((item) => item.status.toLowerCase() === 'online').length;
  const configured = mpesa?.configured ?? {};
  const mpesaReady = Object.values(configured).every(Boolean) && Object.keys(configured).length > 0;
  const paystackReady = Boolean(paystack?.ready);

  return (
    <section className='panel full-page-panel'>
      <div className='page-header'>
        <div><span className='section-kicker'>FLAMMES HOTSPOT</span><h1>Integrations</h1><p>Central control center for routers, AAA, gateways, captive portal and payment connectivity.</p></div>
        <button className='secondary-action' onClick={() => void load()} disabled={loading}><RefreshCw size={14} />Refresh</button>
      </div>
      {notice && <div className='notice'><ShieldCheck size={16} /><span>{notice}</span></div>}
      <div className='integration-summary'>
        <div className='integration-summary-card'><span>Routers</span><strong className={onlineRouters ? 'ready' : ''}>{onlineRouters} / {routers.length} online</strong></div>
        <div className='integration-summary-card'><span>Gateways</span><strong className={onlineGateways ? 'ready' : ''}>{onlineGateways} / {gateways.length} online</strong></div>
        <div className='integration-summary-card'><span>RADIUS</span><strong className={radius?.configuredRouters ? 'ready' : ''}>{radius?.configuredRouters ?? 0} configured</strong></div>
        <div className='integration-summary-card'><span>M-PESA</span><strong className={mpesaReady ? 'ready' : ''}>{mpesaReady ? 'Ready' : 'Setup required'}</strong></div>
      </div>
      {loading ? <div className='loading-card'><div className='spinner' />Loading integrations…</div> : (
        <div className='integration-cards'>
          <IntegrationCard icon={<Router size={20} />} title='Router Integrations' status={routers.length ? 'Available' : 'Setup required'} pending={!routers.length} description='Universal vendor adapter layer with live RouterOS hardware testing and backend credential vault.' details={[['Registered', String(routers.length)],['Online', String(onlineRouters)],['Families', routers.length ? Array.from(new Set(routers.map((item) => item.vendor))).join(', ') : 'MikroTik, Ubiquiti, OpenWrt, Cisco, Omada, Generic']]} action='Manage Routers' onAction={() => onNavigate('Routers')} />
          <IntegrationCard icon={<ShieldCheck size={20} />} title='RADIUS / AAA' status={radius?.configuredRouters ? 'Configured' : 'Foundation ready'} pending={!radius?.configuredRouters} description='Central authentication, authorization and accounting engine bridged to capable routers and gateways.' details={[['Authentication', 'UDP ' + (radius?.authenticationPort ?? 1812)],['Accounting', 'UDP ' + (radius?.accountingPort ?? 1813)],['Mode', radius?.mode ?? 'HTTP AAA engine + gateway/RADIUS bridge']]} action='Open Network' onAction={() => onNavigate('Network')} />
          <IntegrationCard icon={<Network size={20} />} title='Gateway Agents' status={onlineGateways ? 'Online' : gateways.length ? 'Offline' : 'Not enrolled'} pending={!onlineGateways} description='Local enforcement path for routers and gateways that need an intermediary agent.' details={[['Enrolled', String(gateways.length)],['Online', String(onlineGateways)],['Platforms', gateways.length ? Array.from(new Set(gateways.map((item) => item.platform))).join(', ') : 'Linux, OpenWrt, Windows, Android']]} action='Manage Gateways' onAction={() => onNavigate('Gateways')} />
          <IntegrationCard icon={<Globe2 size={20} />} title='Captive Portal' status='Configured' description='Customer entry, package selection and walled-garden policy centralized for router/gateway enforcement.' details={[['Portal', 'Active configuration'],['Policy', 'Walled garden'],['Enforcement', 'Router adapter / Gateway']]} action='Manage Portal' onAction={() => onNavigate('Portal')} />
          <IntegrationCard icon={<CreditCard size={20} />} title='M-PESA' status={mpesaReady ? 'Configured' : 'Credentials required'} pending={!mpesaReady} description='Safaricom Daraja STK Push payment lifecycle with secure backend-only credential handling.' details={[['Environment', mpesa?.environment ?? 'sandbox'],['Consumer key', configured.consumerKey ? 'Configured' : 'Not configured'],['Consumer secret', configured.consumerSecret ? 'Configured' : 'Not configured'],['Shortcode / Passkey', configured.shortcode && configured.passkey ? 'Configured' : 'Not configured'],['Callback URL', configured.callbackUrl ? 'Configured' : 'Not configured']]} action='Open Transactions' onAction={() => onNavigate('Transactions')} />
          <IntegrationCard icon={<CreditCard size={20} />} title='Paystack Live' status={paystackReady ? 'Ready' : 'Ready to integrate'} pending={!paystackReady} description='Live Paystack checkout foundation with secure backend-only keys.' details={[['Environment','LIVE'],['Secret key',paystack?.configured?.FLAMMES_PAYSTACK_SECRET_KEY?'Configured':'Not configured'],['Public key',paystack?.configured?.FLAMMES_PAYSTACK_PUBLIC_KEY?'Configured':'Not configured'],['Callback URL',paystack?.configured?.FLAMMES_PAYSTACK_CALLBACK_URL?'Configured':'Not configured']]} action='Open Billing' onAction={() => onNavigate('Billing')} />
          <IntegrationCard icon={<Gauge size={20} />} title='Session Enforcement' status='Active' description='Connectivity validity, bandwidth, usage limits and disconnect commands are coordinated through the integration layer.' details={[['Validity', 'Purchase-time expiry'],['Bandwidth', 'Package Mbps'],['Usage', 'Input / output accounting'],['Disconnect', 'Router / Gateway']]} action='Open Sessions' onAction={() => onNavigate('Sessions')} />
        </div>
      )}
      <div className='integration-note'><Plug size={18} /><div><strong>One integration center, vendor-neutral enforcement</strong><p>This module does not replace the existing Router, Network, Portal, Gateway or Transactions pages. It gives you one place to see their integration state and jump directly to the detailed controls.</p></div></div>
    </section>
  );
}

function IntegrationCard({ icon, title, status, pending = false, description, details, action, onAction }: CardProps) {
  return <article className='integration-card'>
    <div className='integration-card-head'><div className='integration-card-icon'>{icon}</div><div><h2>{title}</h2><p>{description}</p></div><span className={pending ? 'integration-status pending' : 'integration-status'}>{status}</span></div>
    <div className='integration-details'>{details.map(([label, value]) => <div className='integration-detail' key={label}><span>{label}</span><b>{value}</b></div>)}</div>
    <div className='integration-actions'><button className='secondary-action' onClick={onAction}>{action}</button></div>
  </article>;
}
