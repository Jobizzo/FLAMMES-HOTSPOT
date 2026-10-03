import { useState } from 'react';
import { auth } from '@appdeploy/client';
import { Apple, AtSign, Chrome, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function LoginPortal() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const signIn = async () => {
    setBusy(true);
    setNotice('');
    try { await auth.signIn({ scope: 'openid email profile offline_access' }); window.location.reload(); }
    catch (error) {
      const code = (error as { code?: string })?.code;
      setNotice(code === 'popup_blocked' ? 'Allow pop-ups and try again.' : code === 'popup_closed' ? 'Sign-in was cancelled.' : 'Unable to complete sign-in.');
    } finally { setBusy(false); }
  };
  return <div className="auth-page"><div className="auth-glow" /><div className="auth-card">
    <div className="auth-brand"><div className="auth-mark">FT</div><div><strong>FLAMMES TECH</strong><span>FLAMMES HOTSPOT</span></div></div>
    <div className="auth-heading"><span className="section-kicker">SECURE ACCESS</span><h1>Admin Login</h1><p>Sign in to manage routers, gateways, packages, payments, captive portals and network security.</p></div>
    <button className="auth-provider-button" disabled={busy} onClick={() => void signIn()}><Chrome size={18} /><span>Continue with Google</span></button>
    <button className="auth-provider-button" disabled={busy} onClick={() => void signIn()}><Apple size={18} /><span>Continue with Apple</span></button>
    <button className="auth-provider-button" disabled={busy} onClick={() => void signIn()}><AtSign size={18} /><span>Continue with Email</span></button>
    <div className="auth-divider"><span>SECURE APPDEPLOY AUTHENTICATION</span></div>
    <div className="auth-security"><LockKeyhole size={17} /><div><strong>Email sign-in</strong><p>AppDeploy's supported email method uses a secure email sign-in flow instead of storing passwords in FLAMMES HOTSPOT.</p></div></div>
    {notice && <div className="notice"><ShieldCheck size={16} /><span>{notice}</span></div>}
  </div></div>;
}