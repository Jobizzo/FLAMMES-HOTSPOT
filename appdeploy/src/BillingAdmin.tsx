import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { ArrowRight, CreditCard, Gauge, Package, Receipt, Router, Users, Wifi, Zap } from 'lucide-react';

type BillingCustomer = { id:string; name:string; phone:string; status:string; createdAt:number };
type BillingPackage = { id:string; name:string; price:number; durationMinutes:number; speedMbps:number; dataLimitMb?:number; status:string };
type BillingSession = { id:string; customerName:string; planName:string; status:string; accessState?:string; expiresAt:number; bandwidthProfile?:{speedMbps:number;dataLimitMb?:number}; dataUsedMb?:number };
type BillingTransaction = { id:string; customerName:string; packageName:string; amount:number; provider:string; status:string; reference:string; createdAt:number; paidAt?:number };

const money = (value:number) => `KES ${value.toLocaleString()}`;
const duration = (minutes:number) => minutes >= 1440 ? `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h` : `${minutes} min`;

export default function BillingAdmin({ onNavigate }:{ onNavigate:(name:string)=>void }) {
  const [customers,setCustomers] = useState<BillingCustomer[]>([]);
  const [packages,setPackages] = useState<BillingPackage[]>([]);
  const [sessions,setSessions] = useState<BillingSession[]>([]);
  const [transactions,setTransactions] = useState<BillingTransaction[]>([]);
  const [mpesaReady,setMpesaReady] = useState(false);
  const [paystackReady,setPaystackReady] = useState(false);
  const [loading,setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [c,p,s,t,m,ps] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/packages'),
        api.get('/api/sessions'),
        api.get('/api/transactions'),
        api.get('/api/payments/mpesa/status'),
        api.get('/api/payments/paystack/status'),
      ]);
      setCustomers(c.data.items || []);
      setPackages(p.data.items || []);
      setSessions(s.data.items || []);
      setTransactions(t.data.items || []);
      setMpesaReady(Boolean(m.data.ready));
      setPaystackReady(Boolean(ps.data.ready));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const paidRevenue = useMemo(() => transactions.filter(x => x.status === 'paid').reduce((sum,x) => sum + Number(x.amount || 0),0), [transactions]);
  const pending = transactions.filter(x => x.status === 'pending').length;
  const active = sessions.filter(x => x.expiresAt > Date.now() && x.accessState !== 'expired' && x.accessState !== 'revoked').length;
  const limited = sessions.filter(x => x.bandwidthProfile?.dataLimitMb).length;

  return (
    <section className="panel full-page-panel billing-admin">
      <div className="page-header">
        <div>
          <span className="section-kicker">ISP BILLING</span>
          <h1>Billing & Subscriber Operations</h1>
          <p>Central billing control for subscribers, service plans, payments and connectivity activation.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-action" onClick={() => onNavigate('Customer Portal')}>Customer Portal <ArrowRight size={15} /></button>
          <button className="primary-action" onClick={() => onNavigate('Packages')}>Manage Packages <ArrowRight size={15} /></button>
        </div>
      </div>

      {loading ? <div className="empty-inline">Loading billing data…</div> : <>
        <div className="stat-grid">
          <div className="stat-card cyan"><div className="stat-icon"><Users size={23} /></div><span>Subscribers</span><strong>{customers.length}</strong><small>Registered customer accounts</small></div>
          <div className="stat-card green"><div className="stat-icon"><CreditCard size={23} /></div><span>Collected Revenue</span><strong>{money(paidRevenue)}</strong><small>Confirmed transactions</small></div>
          <div className="stat-card purple"><div className="stat-icon"><Wifi size={23} /></div><span>Active Connectivity</span><strong>{active}</strong><small>Sessions inside validity</small></div>
          <div className="stat-card gold"><div className="stat-icon"><Receipt size={23} /></div><span>Pending Payments</span><strong>{pending}</strong><small>Awaiting provider confirmation</small></div>
        </div>

        <div className="billing-grid">
          <div className="panel table-panel">
            <div className="panel-head"><div><h2><Package size={17} /> Service Plans</h2><span>Sellable hotspot packages</span></div><button onClick={() => onNavigate('Packages')}>Open Plans <ArrowRight size={14} /></button></div>
            <div className="record-list compact-record-list">
              {packages.slice(0,8).map(pkg => <div className="record-row" key={pkg.id}><span className="row-icon"><Package size={16} /></span><div><strong>{pkg.name}</strong><small>{duration(pkg.durationMinutes)} • {pkg.speedMbps} Mbps{pkg.dataLimitMb ? ` • ${pkg.dataLimitMb} MB` : ' • Unlimited data'}</small></div><b>{money(pkg.price)}</b><em className="status-pill online"><i />{pkg.status}</em></div>)}
              {!packages.length && <div className="empty-inline">No service plans configured.</div>}
            </div>
          </div>

          <div className="panel table-panel">
            <div className="panel-head"><div><h2><CreditCard size={17} /> Payment Gateway</h2><span>Provider readiness and billing lifecycle</span></div><em className={mpesaReady ? 'status-pill online' : 'status-pill offline'}><i />{mpesaReady ? 'M-PESA READY' : 'SETUP REQUIRED'}</em></div>
            <div className="feature-grid">
              <div className="feature"><CreditCard size={18} /><strong>M-PESA STK Push</strong><small>{mpesaReady ? 'Backend credentials configured' : 'Add Daraja credentials in the secure secret vault'}</small></div><div className="feature"><CreditCard size={18} /><strong>Paystack Live</strong><small>{paystackReady ? 'Live keys configured' : 'Ready to integrate: add Paystack live keys and callback URL in the secure secret vault'}</small></div>
              <div className="feature"><Zap size={18} /><strong>Automatic activation</strong><small>Successful payment can authorize the bound device</small></div>
              <div className="feature"><Receipt size={18} /><strong>Transaction records</strong><small>Payment reference and receipt lifecycle retained</small></div>
            </div>
            <button className="secondary-action portal-link" onClick={() => onNavigate('Transactions')}>Open Transactions <ArrowRight size={15} /></button>
          </div>
        </div>

        <div className="billing-grid">
          <div className="panel table-panel">
            <div className="panel-head"><div><h2><Users size={17} /> Recent Subscribers</h2><span>Customer accounts and service activity</span></div><button onClick={() => onNavigate('Customers')}>Manage Customers <ArrowRight size={14} /></button></div>
            <div className="record-list compact-record-list">
              {customers.slice(0,8).map(customer => <div className="record-row" key={customer.id}><span className="row-icon"><Users size={16} /></span><div><strong>{customer.name}</strong><small>{customer.phone} • joined {new Date(customer.createdAt).toLocaleDateString()}</small></div><em className="status-pill online"><i />{customer.status}</em></div>)}
              {!customers.length && <div className="empty-inline">No subscribers yet.</div>}
            </div>
          </div>

          <div className="panel table-panel">
            <div className="panel-head"><div><h2><Receipt size={17} /> Billing Activity</h2><span>Latest payment records</span></div><button onClick={() => onNavigate('Transactions')}>View All <ArrowRight size={14} /></button></div>
            <div className="record-list compact-record-list">
              {transactions.slice(0,8).map(tx => <div className="record-row" key={tx.id}><span className="row-icon"><CreditCard size={16} /></span><div><strong>{tx.customerName}</strong><small>{tx.packageName} • {tx.reference} • {tx.provider}</small></div><b>{money(tx.amount)}</b><em className={tx.status === 'paid' ? 'transaction-pill success' : 'transaction-pill pending'}>{tx.status}</em></div>)}
              {!transactions.length && <div className="empty-inline">No billing activity yet.</div>}
            </div>
          </div>
        </div>

        <div className="feature-grid billing-feature-grid">
          <div className="feature"><Router size={19} /><strong>Router billing enforcement</strong><small>Paid sessions can carry router/gateway context into authorization and bandwidth control.</small><button onClick={() => onNavigate('Routers')}>Manage Routers <ArrowRight size={14} /></button></div>
          <div className="feature"><Wifi size={19} /><strong>Hotspot portal</strong><small>Customers can select packages and start payment from the captive portal.</small><button onClick={() => onNavigate('Portal')}>Manage Portal <ArrowRight size={14} /></button></div>
          <div className="feature"><Gauge size={19} /><strong>Usage & validity</strong><small>{limited} session(s) currently have finite data limits. Fixed package expiry remains independent of online/offline time.</small><button onClick={() => onNavigate('Sessions')}>Open Sessions <ArrowRight size={14} /></button></div>
        </div>

        <div className="integration-note">
          <Zap size={18} />
          <div>
            <strong>Reference workflow mapped into FLAMMES HOTSPOT</strong>
            <p>The uploaded reference demonstrates an ISP billing stack around MikroTik, service plans, subscriber billing, dashboard monitoring, payment gateway setup and customer access. FLAMMES HOTSPOT now exposes those operational areas in one billing control center while keeping its vendor-neutral gateway/RADIUS architecture.</p>
          </div>
        </div>
      </>}
    </section>
  );
}
