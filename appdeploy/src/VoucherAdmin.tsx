import { useEffect, useMemo, useState } from 'react';
import { api } from '@appdeploy/client';
import { Copy, KeyRound, Package, RefreshCw, ShieldCheck, Ticket, Users, X } from 'lucide-react';

type VoucherPackage = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  speedMbps: number;
  dataLimitMb?: number;
  status: string;
};

type VoucherItem = {
  id: string;
  packageId: string;
  packageName: string;
  status: 'active' | 'redeemed' | 'disabled' | 'expired';
  codeHint: string;
  createdAt: number;
  expiresAt?: number;
  redeemedAt?: number;
  redeemedDeviceMac?: string;
};

const duration = (minutes: number) =>
  minutes >= 1440
    ? `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
    : `${minutes} min`;

export default function VoucherAdmin() {
  const [packages, setPackages] = useState<VoucherPackage[]>([]);
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [packageId, setPackageId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [expiryDays, setExpiryDays] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [p, v] = await Promise.all([
        api.get('/api/packages'),
        api.get('/api/vouchers'),
      ]);
      const activePackages = (p.data.items || []).filter((item: VoucherPackage) => item.status === 'active');
      setPackages(activePackages);
      setVouchers(v.data.items || []);
      setPackageId((current) => current || activePackages[0]?.id || '');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to load vouchers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === packageId),
    [packages, packageId],
  );

  const generate = async () => {
    const count = Math.max(1, Math.min(100, Number(quantity) || 0));
    if (!packageId) {
      setMessage('Select a package first.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await api.post('/api/vouchers/generate', {
        packageId,
        quantity: count,
        expiryDays: expiryDays.trim() ? Number(expiryDays) : undefined,
      });
      setGeneratedCodes(result.data.codes || []);
      setMessage(`${result.data.codes?.length || 0} voucher(s) generated. Save or copy these codes now; the full codes are not stored or shown again.`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to generate vouchers.');
    } finally {
      setBusy(false);
    }
  };

  const copyCodes = async () => {
    if (!generatedCodes.length) return;
    try {
      await navigator.clipboard.writeText(generatedCodes.join('\n'));
      setMessage('Voucher codes copied to the clipboard.');
    } catch {
      setMessage('Clipboard access was unavailable. Select the codes manually.');
    }
  };

  return (
    <section className="panel full-page-panel voucher-admin">
      <div className="page-header">
        <div>
          <span className="section-kicker">ACCESS CODES</span>
          <h1>Voucher Management</h1>
          <p>Generate one-use connectivity vouchers tied to your existing packages.</p>
        </div>
        <button className="secondary-action" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card cyan"><div className="stat-icon"><Ticket size={22} /></div><span>Total Vouchers</span><strong>{vouchers.length}</strong><small>Generated access codes</small></div>
        <div className="stat-card green"><div className="stat-icon"><KeyRound size={22} /></div><span>Available</span><strong>{vouchers.filter(v => v.status === 'active').length}</strong><small>Ready for customers</small></div>
        <div className="stat-card purple"><div className="stat-icon"><Users size={22} /></div><span>Redeemed</span><strong>{vouchers.filter(v => v.status === 'redeemed').length}</strong><small>Already used</small></div>
        <div className="stat-card gold"><div className="stat-icon"><ShieldCheck size={22} /></div><span>Code Security</span><strong>HASHED</strong><small>Plaintext codes are not stored</small></div>
      </div>

      <div className="voucher-layout">
        <div className="panel voucher-generator">
          <div className="panel-head">
            <div><h2><KeyRound size={17} /> Generate Vouchers</h2><span>Assign each voucher to one package</span></div>
          </div>
          <div className="edit-form voucher-form">
            <label>Package
              <select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
                <option value="">Select package</option>
                {packages.map(pkg => <option value={pkg.id} key={pkg.id}>{pkg.name} • KES {pkg.price.toLocaleString()} • {duration(pkg.durationMinutes)}</option>)}
              </select>
            </label>
            <label>Quantity
              <input value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="10" />
              <small>1–100 codes per batch.</small>
            </label>
            <label>Voucher expiry in days (optional)
              <input value={expiryDays} onChange={(e) => setExpiryDays(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="No voucher expiry" />
              <small>Package validity starts when the voucher is redeemed.</small>
            </label>
            {selectedPackage && <div className="integration-note"><Package size={18} /><div><strong>{selectedPackage.name}</strong><p>{duration(selectedPackage.durationMinutes)} • {selectedPackage.speedMbps} Mbps{selectedPackage.dataLimitMb ? ` • ${selectedPackage.dataLimitMb} MB` : ' • Unlimited data'}</p></div></div>}
            <button className="primary-action wide" disabled={busy || !packageId} onClick={() => void generate()}>
              <KeyRound size={16} /> {busy ? 'Generating…' : 'Generate Vouchers'}
            </button>
          </div>
        </div>

        <div className="panel voucher-how">
          <div className="panel-head"><div><h2><ShieldCheck size={17} /> Customer Flow</h2><span>Works directly from the captive portal</span></div></div>
          <div className="voucher-flow">
            <div><b>01</b><span>Customer opens the captive portal.</span></div>
            <div><b>02</b><span>Selects <strong>Use Voucher</strong>.</span></div>
            <div><b>03</b><span>Enters the voucher code.</span></div>
            <div><b>04</b><span>Chooses <strong>This device</strong> or <strong>Connect another device</strong>.</span></div>
            <div><b>05</b><span>If another device is selected, its MAC address becomes the device that receives the package.</span></div>
          </div>
        </div>
      </div>

      {message && <div className="integration-note voucher-message"><ShieldCheck size={18} /><div><strong>Voucher status</strong><p>{message}</p></div></div>}

      <div className="panel table-panel voucher-table">
        <div className="panel-head"><div><h2><Ticket size={17} /> Generated Vouchers</h2><span>Only code hints are retained in the admin list</span></div></div>
        <div className="record-list">
          {loading && <div className="empty-inline">Loading vouchers…</div>}
          {!loading && !vouchers.length && <div className="empty-inline">No vouchers generated yet.</div>}
          {!loading && vouchers.map(voucher => (
            <div className="record-row" key={voucher.id}>
              <span className="row-icon"><Ticket size={16} /></span>
              <div>
                <strong>{voucher.codeHint}</strong>
                <small>{voucher.packageName} • created {new Date(voucher.createdAt).toLocaleString()}</small>
              </div>
              <em className={voucher.status === 'active' ? 'transaction-pill success' : 'transaction-pill pending'}>{voucher.status}</em>
              <b>{voucher.redeemedDeviceMac || '—'}</b>
            </div>
          ))}
        </div>
      </div>

      {generatedCodes.length > 0 && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card voucher-code-modal">
            <div className="modal-head">
              <div><span className="section-kicker">ONE-TIME DISPLAY</span><h2>New Voucher Codes</h2></div>
              <button className="icon-button" onClick={() => setGeneratedCodes([])} aria-label="Close"><X size={18} /></button>
            </div>
            <p>Copy or save these codes now. FLAMMES HOTSPOT stores only a secure hash, so the full codes cannot be recovered later.</p>
            <div className="voucher-code-list">{generatedCodes.map(code => <code key={code}>{code}</code>)}</div>
            <div className="modal-actions">
              <button className="secondary-action" onClick={() => void copyCodes()}><Copy size={15} /> Copy All</button>
              <button className="primary-action" onClick={() => setGeneratedCodes([])}>Done</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
