import { router, json, error, db, ws, secrets } from '@appdeploy/sdk';
import { createHash, randomBytes } from 'node:crypto';
import * as net from 'node:net';
import * as tls from 'node:tls';

type PackageRecord = {
  name: string;
  price: number;
  durationMinutes: number;
  speedMbps: number;
  dataLimitMb?: number;
  status: string;
};
type CustomerRecord = {
  name: string;
  phone: string;
  status: string;
  createdAt: number;
};
type RouterRecord = {
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
  createdAt: number;
};
type SessionRecord = {
  customerId?: string;
  customerName: string;
  packageId?: string;
  planName: string;
  status: string;
  accessState?: 'pending' | 'authorized' | 'revoked' | 'expired';
  purchasedAt: number;
  expiresAt: number;
  deviceMac?: string;
  ipAddress?: string;
  routerId?: string;
  gatewayId?: string;
  authorizedAt?: number;
  revokedAt?: number;
  bandwidthApplied?: boolean;
  bandwidthProfile?: { speedMbps: number; dataLimitMb?: number };
  dataUsedMb?: number;
  inputOctets?: number;
  outputOctets?: number;
  lastAccountingAt?: number;
};
type RadiusUserRecord = {
  username: string;
  passwordHash: string;
  status: 'active' | 'disabled';
  customerId?: string;
  packageId?: string;
  createdAt: number;
};
type RadiusPolicyRecord = {
  username: string;
  attributes: Record<string, string>;
  updatedAt: number;
};
type RadiusAccountingRecord = {
  username: string;
  sessionId: string;
  statusType: string;
  framedIp?: string;
  callingStationId?: string;
  calledStationId?: string;
  inputOctets?: number;
  outputOctets?: number;
  sessionTime?: number;
  timestamp: number;
};
type SupportContact = { id: string; label: string; phone: string; enabled: boolean; createdAt: number; updatedAt: number };
type CaptivePortalSettings = {
  siteId: string;
  title: string;
  subtitle: string;
  logoText: string;
  status: 'active' | 'disabled';
  successMessage: string;
  supportContacts?: SupportContact[];
  updatedAt: number;
};
type WalledGardenRule = {
  siteId: string;
  host: string;
  type: 'domain' | 'ip';
  description: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
};
type GatewayRecord = { name:string; siteId:string; platform:string; tokenHash:string; status:string; lastHeartbeatAt?:number; version?:string; ipAddress?:string; createdAt:number; updatedAt:number };
type GatewayCommand = { gatewayId:string; type:string; payload:Record<string,unknown>; status:'queued'|'claimed'|'completed'|'failed'; createdAt:number; claimedAt?:number; completedAt?:number; result?:Record<string,unknown> };
type DeviceContextRecord = { tokenHash:string; siteId:string; gatewayId:string; routerId?:string; deviceMac?:string; ipAddress?:string; createdAt:number; expiresAt:number; usedAt?:number };
type PortAllocationRecord = { routerId:string; interfaceName:string; role:'hotspot'|'monthly_customer'; customerId?:string; customerName?:string; label?:string; enabled:boolean; createdAt:number; updatedAt:number };
type AccessPointRecord = { siteId:string; routerId?:string; parentNodeId?:string; parentInterfaceName?:string; name:string; vendor:string; model?:string; macAddress?:string; ipAddress?:string; location:string; managementProtocol:'api'|'snmp'|'http_api'|'controller'|'gateway'|'unknown'; status:'online'|'offline'|'unknown'|'unmanaged'; lastSeenAt?:number; uptimeSeconds?:number; cpuPercent?:number; memoryPercent?:number; connectedClients?:number; rxMbps?:number; txMbps?:number; credentialSecretPrefix?:string; discoverySource?:string; createdAt:number; updatedAt:number };
type FirewallRuleRecord = { siteId:string; routerId:string; name:string; chain:'input'|'forward'|'output'; action:'accept'|'drop'|'reject'; protocol?:string; source?:string; destination?:string; port?:string; comment?:string; enabled:boolean; createdAt:number; updatedAt:number };
type VoucherRecord = {
  packageId: string;
  packageName: string;
  codeHash: string;
  codeHint: string;
  status: 'active' | 'redeemed' | 'disabled';
  createdAt: number;
  expiresAt?: number;
  redeemedAt?: number;
  redeemedDeviceMac?: string;
  redeemedSessionId?: string;
};
type TransactionRecord = {
  customerId?: string;
  customerName: string;
  packageId: string;
  packageName: string;
  amount: number;
  provider: string;
  status: string;
  reference: string;
  createdAt: number;
  paidAt?: number;
  phone?: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  mpesaReceiptNumber?: string;
  resultCode?: number;
  resultDescription?: string;
  deviceMac?: string;
  ipAddress?: string;
  routerId?: string;
  gatewayId?: string;
};

const sessionsTable = 'hotspot_sessions';
const packagesTable = 'hotspot_packages';
const customersTable = 'hotspot_customers';
const routersTable = 'hotspot_routers';
const transactionsTable = 'hotspot_transactions';
const vouchersTable = 'hotspot_vouchers';
const radiusUsersTable = 'hotspot_radius_users';
const radiusPoliciesTable = 'hotspot_radius_policies';
const radiusAccountingTable = 'hotspot_radius_accounting';
const portalSettingsTable = 'hotspot_captive_portal_settings';
const walledGardenTable = 'hotspot_walled_garden_rules';
const gatewaysTable = 'hotspot_gateways';
const gatewayCommandsTable = 'hotspot_gateway_commands';
const deviceContextsTable = 'hotspot_device_contexts';
const portAllocationsTable = 'hotspot_port_allocations';
const accessPointsTable = 'hotspot_access_points';
const firewallRulesTable = 'hotspot_firewall_rules';
const supportContactsTable = 'hotspot_support_contacts';

function apSecretPrefix(id: string) { return `FLAMMES_AP_${id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`; }
function firewallRuleName(rule: FirewallRuleRecord) { return `FLAMMES-FW-${rule.chain}-${rule.name.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 45)}`; }

async function queueGatewayCommand(gatewayId: string | undefined, type: string, payload: Record<string, unknown>) {
  if (!gatewayId) return;
  await db.add(gatewayCommandsTable, [{ gatewayId, type, payload, status: 'queued', createdAt: Date.now() }]);
}

async function reconcileExpiredSessions() {
  const now = Date.now();
  const items = (await db.list<SessionRecord>(sessionsTable, { limit: 200 })).items;
  let changed = false;
  for (const item of items) {
    if (item.expiresAt > now || item.accessState === 'expired') continue;
    const record = { ...item, status: 'expired', accessState: 'expired' as const, revokedAt: now };
    const [ok] = await db.update(sessionsTable, [{ id: (item as SessionRecord & { id: string }).id, record }]);
    if (ok) {
      changed = true;
      await removeAppliedBandwidth({ ...(item as SessionRecord), id: (item as SessionRecord & { id: string }).id });
      await queueGatewayCommand(item.gatewayId, 'disconnect_client', { sessionId: (item as SessionRecord & { id: string }).id, deviceMac: item.deviceMac, ipAddress: item.ipAddress, reason: 'package_expired' });
    }
  }
  if (changed) await notifySessions();
}

async function listSessions() {
  await reconcileExpiredSessions();
  return (await db.list<SessionRecord>(sessionsTable, { limit: 100 })).items;
}

function presentSession(item: SessionRecord) {
  const remainingMs = Math.max(0, item.expiresAt - Date.now());
  const remainingMinutes = Math.ceil(remainingMs / 60000);
  return {
    ...item,
    status: remainingMs === 0 ? 'expired' : item.status,
    remainingMinutes,
  };
}

async function notifyEntity(entityType: string, entityId: string, data: unknown) {
  const subscriptions = (
    await db.list<{
      entity_type: string;
      entity_id: string;
      connection_id: string;
    }>('entity_subscriptions', { limit: 1000 })
  ).items;
  const targets = subscriptions
    .filter(x => x.entity_type === entityType && x.entity_id === entityId)
    .map(x => x.connection_id);
  if (targets.length) {
    await ws.send(Array.from(new Set(targets)), {
      v: 1,
      type: 'entity.update',
      payload: { entity_type: entityType, entity_id: entityId, data },
    });
  }
}

async function notifySessions() {
  await notifyEntity('sessions', 'all', {
    items: (await listSessions()).map(presentSession),
  });
}

function hashRadiusPassword(password: string) {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

function safeRadiusAttributes(policy: RadiusPolicyRecord | undefined) {
  return policy?.attributes ?? {};
}

async function authenticateRadius(username: string, password: string) {
  const [user] = await db.get<RadiusUserRecord>(radiusUsersTable, [username]);
  if (!user || user.status !== 'active') return null;
  if (user.passwordHash !== hashRadiusPassword(password)) return null;
  const [policy] = await db.get<RadiusPolicyRecord>(radiusPoliciesTable, [username]);
  return {
    username: user.username,
    customerId: user.customerId,
    packageId: user.packageId,
    attributes: safeRadiusAttributes(policy),
  };
}

async function packageById(id: string) {
  const [item] = await db.get<PackageRecord>(packagesTable, [id]);
  return item;
}

const defaultPortalSettings = (siteId: string): CaptivePortalSettings => ({ siteId, title: 'FLAMMES HOTSPOT', subtitle: 'Choose a connectivity package to get online.', logoText: 'FLAMMES', status: 'active', successMessage: 'Your package is ready. Complete payment to activate connectivity.', supportContacts: [], updatedAt: Date.now() });
async function getSupportContacts(siteId: string) { return (await db.list<SupportContact & { siteId?: string }>(supportContactsTable, { limit: 50 })).items.filter(item => item.enabled && item.siteId === siteId); }
async function getAllSupportContacts(siteId: string) { return (await db.list<SupportContact & { siteId?: string }>(supportContactsTable, { limit: 50 })).items.filter(item => item.siteId === siteId); }
function normalizePortalHost(value: string) { return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/\s/g, ''); }
function validWalledGardenHost(value: string, type: 'domain' | 'ip') { if (!value || value.length > 253 || /[<>'"`]/.test(value)) return false; if (type === 'ip') return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value); return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value) || /^localhost(?::\d+)?$/i.test(value); }
async function getPortalSettings(siteId: string) { const [settings] = await db.get<CaptivePortalSettings>(portalSettingsTable, [siteId]); return settings ?? defaultPortalSettings(siteId); }
function hashGatewayToken(token:string){return createHash('sha256').update(token,'utf8').digest('hex');}
async function authenticateGateway(gatewayId:string, token:string){const [gateway]=await db.get<GatewayRecord>(gatewaysTable,[gatewayId]); if(!gateway||gateway.tokenHash!==hashGatewayToken(token)) return null; return gateway;}
async function gatewayPolicy(siteId:string){const [portal]=await db.get<CaptivePortalSettings>(portalSettingsTable,[siteId]); const gardens=(await db.list<WalledGardenRule>(walledGardenTable,{limit:200})).items.filter(x=>x.siteId===siteId&&x.enabled); return {siteId,portal:portal??defaultPortalSettings(siteId),walledGarden:gardens,captivePortal:{enabled:(portal?.status??'active')==='active',registrationPath:'/api/gateways/:id/device-context',portalPath:'/?captive=1&context={contextToken}',contextLifetimeSeconds:1800,enforcementCommands:['authorize_client','set_bandwidth','remove_bandwidth','disconnect_client']},generatedAt:Date.now()};}
function hashDeviceContextToken(token:string){return createHash('sha256').update(token,'utf8').digest('hex');}
function normalizeMac(value:string){const compact=value.trim().replace(/[^0-9a-f]/gi,'').toUpperCase();if(!/^[0-9A-F]{12}$/.test(compact))return '';return compact.match(/.{2}/g)!.join(':');}
function normalizeVoucherCode(value:string){return value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');}
function hashVoucherCode(value:string){return createHash('sha256').update(normalizeVoucherCode(value),'utf8').digest('hex');}
function generateVoucherCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=randomBytes(10);let code='';for(let i=0;i<10;i++)code+=alphabet[bytes[i]%alphabet.length];return code.slice(0,5)+'-'+code.slice(5);}
function validMac(value:string){return Boolean(normalizeMac(value));}
async function activeSessionForDevice(value:{deviceMac?:string;ipAddress?:string}){const now=Date.now();const sessions=(await db.list<SessionRecord>(sessionsTable,{limit:200})).items;return sessions.find(session=>session.expiresAt>now&&session.accessState==='authorized'&&((value.deviceMac&&session.deviceMac===value.deviceMac)||(value.ipAddress&&session.ipAddress===value.ipAddress)));}
async function createDeviceContext(gatewayId:string,siteId:string,value:{routerId?:string;deviceMac?:string;ipAddress?:string}){const active=await activeSessionForDevice(value);if(active)throw new Error('This device already has an active hotspot session. The captive portal will be available again after the session expires or its data limit is depleted.');const token=randomBytes(32).toString('hex');const now=Date.now();const expiresAt=now+30*60*1000;const contextId=hashDeviceContextToken(token);const [id]=await db.add(deviceContextsTable,[{id:contextId,tokenHash:contextId,siteId,gatewayId,routerId:value.routerId?.trim()||undefined,deviceMac:value.deviceMac?.trim()||undefined,ipAddress:value.ipAddress?.trim()||undefined,createdAt:now,expiresAt}]);if(!id)throw new Error('Unable to create device context.');return {contextToken:token,expiresAt,portalPath:'/?captive=1&context='+encodeURIComponent(token)};}
async function resolveDeviceContext(token:string){const [context]=await db.get<DeviceContextRecord>(deviceContextsTable,[hashDeviceContextToken(token)]);if(!context||context.expiresAt<=Date.now())return null;return context;}


async function paystackSecretStatus() {
  const names = await secrets.listSecretNames();
  const required = ['FLAMMES_PAYSTACK_SECRET_KEY', 'FLAMMES_PAYSTACK_PUBLIC_KEY', 'FLAMMES_PAYSTACK_CALLBACK_URL'];
  return { environment: 'live', configured: Object.fromEntries(required.map(name => [name, names.includes(name)])), ready: required.every(name => names.includes(name)) };
}
async function initiatePaystackTransaction(transaction: TransactionRecord & { id: string }) {
  const secretKey = await secrets.readSecret('FLAMMES_PAYSTACK_SECRET_KEY');
  const callbackUrl = await secrets.readSecret('FLAMMES_PAYSTACK_CALLBACK_URL');
  const email = transaction.phone?.includes('@') ? transaction.phone : 'customer-' + transaction.id + '@flammes.local';
  const response = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: 'Bearer ' + secretKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, amount: Math.max(100, Math.round(transaction.amount * 100)), reference: transaction.reference, callback_url: callbackUrl, metadata: { transactionId: transaction.id, packageId: transaction.packageId, deviceMac: transaction.deviceMac } }) });
  const data = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; access_code?: string; reference?: string } };
  if (!response.ok || !data.status || !data.data?.authorization_url) throw new Error(data.message || 'Paystack initialization failed.');
  return data.data;
}
async function mpesaSecretStatus() {
  const names = await secrets.listSecretNames();
  const required = ['FLAMMES_MPESA_CONSUMER_KEY','FLAMMES_MPESA_CONSUMER_SECRET','FLAMMES_MPESA_SHORTCODE','FLAMMES_MPESA_PASSKEY','FLAMMES_MPESA_CALLBACK_URL'];
  return { configured: Object.fromEntries(required.map(name => [name, names.includes(name)])), ready: required.every(name => names.includes(name)) };
}
function normalizeKenyanPhone(value: string) {
  const digits = value.replace(/\\D/g, '');
  if (/^2547\\d{8}$/.test(digits) || /^2541\\d{8}$/.test(digits)) return digits;
  if (/^07\\d{8}$/.test(digits) || /^01\\d{8}$/.test(digits)) return '254' + digits.slice(1);
  if (/^7\\d{8}$/.test(digits) || /^1\\d{8}$/.test(digits)) return '254' + digits;
  return '';
}
async function mpesaAccessToken() {
  const key = await secrets.readSecret('FLAMMES_MPESA_CONSUMER_KEY');
  const secret = await secrets.readSecret('FLAMMES_MPESA_CONSUMER_SECRET');
  const environment = (await secrets.readSecret('FLAMMES_MPESA_ENVIRONMENT').catch(() => 'sandbox')).toLowerCase();
  const base = environment === 'production' || environment === 'live' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const response = await fetch(base + '/oauth/v1/generate?grant_type=client_credentials', { headers: { Authorization: 'Basic ' + Buffer.from(key + ':' + secret).toString('base64') } });
  if (!response.ok) throw new Error('M-PESA OAuth request failed.');
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error('M-PESA OAuth token was not returned.');
  return { token: data.access_token, base };
}
async function initiateMpesaStk(transaction: TransactionRecord & { id: string }, phone: string) {
  const shortcode = await secrets.readSecret('FLAMMES_MPESA_SHORTCODE');
  const passkey = await secrets.readSecret('FLAMMES_MPESA_PASSKEY');
  const callbackUrl = await secrets.readSecret('FLAMMES_MPESA_CALLBACK_URL');
  const normalized = normalizeKenyanPhone(phone);
  if (!normalized) throw new Error('Enter a valid Kenyan M-PESA phone number.');
  const { token, base } = await mpesaAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');
  const response = await fetch(base + '/mpesa/stkpush/v1/processrequest', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, TransactionType: 'CustomerPayBillOnline', Amount: Math.max(1, Math.round(transaction.amount)), PartyA: normalized, PartyB: shortcode, PhoneNumber: normalized, CallBackURL: callbackUrl, AccountReference: transaction.reference, TransactionDesc: 'FLAMMES HOTSPOT ' + transaction.packageName }) });
  const data = await response.json() as { ResponseCode?: string; ResponseDescription?: string; CustomerMessage?: string; CheckoutRequestID?: string; MerchantRequestID?: string };
  if (!response.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) throw new Error(data.ResponseDescription || 'M-PESA STK Push was rejected.');
  return data;
}

function routerSecretPrefix(id: string) {
  return `FLAMMES_ROUTER_${id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
}

type RouterOsSentence = string[];
type RouterInterfaceRecord = {
  id: string; name: string; defaultName?: string; type: string; mtu?: number; l2mtu?: number; macAddress?: string;
  running: boolean; disabled: boolean; dynamic: boolean; physical: boolean;
};
type RouterLanConfig = {
  interfaces: Array<{ name:string; bridge?:string; running:boolean; disabled:boolean; type:string; macAddress?:string; role:'hotspot'|'normal_lan'|'unassigned' }>;
  bridges: Array<{id:string;name:string;disabled:boolean}>;
  bridgePorts: Array<{id:string;bridge:string;interface:string;disabled:boolean}>;
  ipAddresses: Array<{id:string;address:string;interface:string;network?:string;disabled:boolean}>;
  dhcpServers: Array<{id:string;name:string;interface:string;addressPool?:string;disabled:boolean}>;
  natRules: Array<{id:string;chain:string;action:string;outInterface?:string;outInterfaceList?:string;disabled:boolean}>;
  interfaceLists: Array<{list:string;interface:string;disabled:boolean}>;
  recommendedLanBridge?: string;
  safeToApplyNormalLan: boolean;
};

function encodeWord(word: string) {
  const data = Buffer.from(word, 'utf8');
  const len = data.length;
  if (len < 0x80) return Buffer.concat([Buffer.from([len]), data]);
  if (len < 0x4000) {
    const value = len | 0x8000;
    return Buffer.concat([Buffer.from([(value >> 8) & 0xff, value & 0xff]), data]);
  }
  if (len < 0x200000) {
    const value = len | 0xc00000;
    return Buffer.concat([Buffer.from([(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]), data]);
  }
  if (len < 0x10000000) {
    const value = len | 0xe0000000;
    return Buffer.concat([Buffer.from([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]), data]);
  }
  return Buffer.concat([Buffer.from([0xf0]), Buffer.from([(len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff]), data]);
}

function decodeWordLength(buffer: Buffer, offset: number): { length: number; bytes: number } | null {
  if (offset >= buffer.length) return null;
  const first = buffer[offset];
  if (first < 0x80) return { length: first, bytes: 1 };
  if ((first & 0xc0) === 0x80) {
    if (offset + 2 > buffer.length) return null;
    return { length: ((first & 0x3f) << 8) | buffer[offset + 1], bytes: 2 };
  }
  if ((first & 0xe0) === 0xc0) {
    if (offset + 3 > buffer.length) return null;
    return { length: ((first & 0x1f) << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2], bytes: 3 };
  }
  if ((first & 0xf0) === 0xe0) {
    if (offset + 4 > buffer.length) return null;
    return { length: ((first & 0x0f) * 0x1000000) + (buffer[offset + 1] << 16) + (buffer[offset + 2] << 8) + buffer[offset + 3], bytes: 4 };
  }
  if (first === 0xf0) {
    if (offset + 5 > buffer.length) return null;
    return { length: buffer.readUInt32BE(offset + 1), bytes: 5 };
  }
  throw new Error('Unsupported RouterOS API word length encoding.');
}

class RouterOsClient {
  private socket: net.Socket | tls.TLSSocket;
  private buffer = Buffer.alloc(0);
  private sentences: RouterOsSentence[] = [];
  private waiters: Array<(sentence: RouterOsSentence) => void> = [];

  constructor(socket: net.Socket | tls.TLSSocket) {
    this.socket = socket;
    socket.on('data', (chunk: Buffer) => this.consume(chunk));
  }

  private consume(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (true) {
      let offset = 0;
      const words: string[] = [];
      let complete = false;
      while (offset < this.buffer.length) {
        const header = decodeWordLength(this.buffer, offset);
        if (!header || offset + header.bytes + header.length > this.buffer.length) break;
        offset += header.bytes;
        if (header.length === 0) {
          complete = true;
          break;
        }
        words.push(this.buffer.subarray(offset, offset + header.length).toString('utf8'));
        offset += header.length;
      }
      if (!complete) return;
      this.buffer = this.buffer.subarray(offset);
      const waiter = this.waiters.shift();
      if (waiter) waiter(words);
      else this.sentences.push(words);
    }
  }

  private readSentence(timeoutMs = 10000): Promise<RouterOsSentence> {
    if (this.sentences.length) return Promise.resolve(this.sentences.shift()!);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.waiters.indexOf(resolve);
        if (index >= 0) this.waiters.splice(index, 1);
        reject(new Error('RouterOS API response timed out.'));
      }, timeoutMs);
      this.waiters.push((sentence) => {
        clearTimeout(timer);
        resolve(sentence);
      });
    });
  }

  async command(words: string[], timeoutMs = 10000) {
    const payload = Buffer.concat([...words.map(encodeWord), encodeWord('')]);
    await new Promise<void>((resolve, reject) => {
      const onError = (err: Error) => reject(err);
      this.socket.once('error', onError);
      this.socket.write(payload, () => {
        this.socket.off('error', onError);
        resolve();
      });
    });
    const replies: RouterOsSentence[] = [];
    while (true) {
      const sentence = await this.readSentence(timeoutMs);
      if (!sentence.length) continue;
      replies.push(sentence);
      if (sentence[0] === '!trap' || sentence[0] === '!fatal' || sentence[0] === '!done') return replies;
    }
  }

  close() {
    this.socket.destroy();
  }
}

function sentenceAttributes(sentence: RouterOsSentence) {
  return Object.fromEntries(sentence.slice(1).filter(word => word.startsWith('=')).map(word => {
    const separator = word.indexOf('=', 1);
    return separator > 0 ? [word.slice(1, separator), word.slice(separator + 1)] : [word.slice(1), ''];
  }));
}

async function openRouterOsConnection(host: string, port: number, transport: 'tcp' | 'tls', timeoutMs = 8000) {
  const socket = await new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
    const onConnect = (candidate: net.Socket | tls.TLSSocket) => {
      candidate.setTimeout(timeoutMs);
      candidate.once('timeout', () => candidate.destroy(new Error('RouterOS connection timed out.')));
      resolve(candidate);
    };
    if (transport === 'tls') {
      const candidate = tls.connect({ host, port, rejectUnauthorized: false }, () => onConnect(candidate));
      candidate.once('error', reject);
    } else {
      const candidate = net.createConnection({ host, port }, () => onConnect(candidate));
      candidate.once('error', reject);
    }
  });
  return new RouterOsClient(socket);
}

async function testMikrotikRouter(router: RouterRecord, username: string, password: string) {
  const port = router.apiPort ?? (router.apiTransport === 'tls' ? 8729 : 8728);
  const transport = router.apiTransport ?? 'tcp';
  const client = await openRouterOsConnection(router.host, port, transport);
  try {
    let login = await client.command(['/login', `=name=${username}`, `=password=${password}`]);
    const loginDone = login.find(sentence => sentence[0] === '!done');
    const challenge = loginDone ? sentenceAttributes(loginDone).ret : undefined;
    if (challenge) {
      const digest = createHash('md5').update(Buffer.concat([Buffer.from([0]), Buffer.from(password, 'utf8'), Buffer.from(challenge, 'hex')])).digest('hex');
      login = await client.command(['/login', `=name=${username}`, `=response=00${digest}`]);
    }
    const trap = login.find(sentence => sentence[0] === '!trap' || sentence[0] === '!fatal');
    if (trap) {
      const attrs = sentenceAttributes(trap);
      throw new Error(attrs.message || 'RouterOS authentication failed.');
    }
    const identityReplies = await client.command(['/system/identity/print']);
    const resourceReplies = await client.command(['/system/resource/print']);
    const identity = identityReplies.find(sentence => sentence[0] === '!re');
    const resource = resourceReplies.find(sentence => sentence[0] === '!re');
    return {
      identity: identity ? sentenceAttributes(identity).name || router.host : router.host,
      version: resource ? sentenceAttributes(resource).version || 'unknown' : 'unknown',
      board: resource ? sentenceAttributes(resource)['board-name'] || 'unknown' : 'unknown',
      architecture: resource ? sentenceAttributes(resource)['architecture-name'] || 'unknown' : 'unknown',
      apiPort: port,
      apiTransport: transport,
    };
  } finally {
    client.close();
  }
}

async function loginRouterOs(client: RouterOsClient, username: string, password: string) {
  let login = await client.command(['/login', `=name=${username}`, `=password=${password}`]);
  const loginDone = login.find(sentence => sentence[0] === '!done');
  const challenge = loginDone ? sentenceAttributes(loginDone).ret : undefined;
  if (challenge) {
    const digest = createHash('md5').update(Buffer.concat([Buffer.from([0]), Buffer.from(password, 'utf8'), Buffer.from(challenge, 'hex')])).digest('hex');
    login = await client.command(['/login', `=name=${username}`, `=response=00${digest}`]);
  }
  const trap = login.find(sentence => sentence[0] === '!trap' || sentence[0] === '!fatal');
  if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS authentication failed.');
}

function boolAttr(value: string | undefined) { return value === 'yes' || value === 'true'; }
function numberAttr(value: string | undefined) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; }
function isPhysicalRouterInterface(type: string) { return ['ether','sfp','sfpplus','wlan','wifi','lte'].includes(type.toLowerCase()); }
async function discoverMikrotikInterfaces(router: RouterRecord, username: string, password: string) {
  const port = router.apiPort ?? (router.apiTransport === 'tls' ? 8729 : 8728); const transport = router.apiTransport ?? 'tcp';
  const client = await openRouterOsConnection(router.host, port, transport);
  try {
    await loginRouterOs(client, username, password);
    const interfaceReplies = await client.command(['/interface/getall']);
    const hotspotReplies = await client.command(['/ip/hotspot/print']);
    const interfaces: RouterInterfaceRecord[] = interfaceReplies.filter(sentence => sentence[0] === '!re').map(sentence => { const attrs = sentenceAttributes(sentence); const type = attrs.type || 'unknown'; return { id: attrs['.id'] || attrs.name || '', name: attrs.name || '', defaultName: attrs['default-name'] || undefined, type, mtu: numberAttr(attrs.mtu), l2mtu: numberAttr(attrs.l2mtu), macAddress: attrs['mac-address'] || undefined, running: boolAttr(attrs.running), disabled: boolAttr(attrs.disabled), dynamic: boolAttr(attrs.dynamic), physical: isPhysicalRouterInterface(type) }; }).filter(item => item.name);
    const hotspotServers = hotspotReplies.filter(sentence => sentence[0] === '!re').map(sentence => { const attrs = sentenceAttributes(sentence); return { id: attrs['.id'] || attrs.name || '', name: attrs.name || '', interface: attrs.interface || '', profile: attrs.profile || '', disabled: boolAttr(attrs.disabled) }; }).filter(item => item.name);
    return { interfaces, hotspotServers, scannedAt: Date.now(), apiPort: port, apiTransport: transport };
  } finally { client.close(); }
}
async function applyMikrotikHotspotInterfaceList(router: RouterRecord, username: string, password: string, selectedInterfaces: string[]) {
  const client = await openRouterOsConnection(router.host, router.apiPort ?? (router.apiTransport === 'tls' ? 8729 : 8728), router.apiTransport ?? 'tcp');
  try {
    await loginRouterOs(client, username, password);
    const listReplies = await client.command(['/interface/list/print', '?name=FLAMMES-HOTSPOT']); const listRecord = listReplies.find(sentence => sentence[0] === '!re');
    let listId = listRecord ? sentenceAttributes(listRecord)['.id'] : undefined;
    if (!listId) { const created = await client.command(['/interface/list/add','=name=FLAMMES-HOTSPOT','=comment=Managed by FLAMMES HOTSPOT']); const trap = created.find(sentence => sentence[0] === '!trap' || sentence[0] === '!fatal'); if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS rejected the hotspot interface list.'); const reread = await client.command(['/interface/list/print','?name=FLAMMES-HOTSPOT']); const record = reread.find(sentence => sentence[0] === '!re'); listId = record ? sentenceAttributes(record)['.id'] : undefined; }
    if (!listId) throw new Error('FLAMMES-HOTSPOT interface list could not be verified on the router.');
    const membersReplies = await client.command(['/interface/list/member/print','?list=FLAMMES-HOTSPOT']); const currentMembers = membersReplies.filter(sentence => sentence[0] === '!re').map(sentence => sentenceAttributes(sentence)); const desired = new Set(selectedInterfaces);
    for (const member of currentMembers) if (member['.id'] && !desired.has(member.interface)) await client.command(['/interface/list/member/remove','=.id=' + member['.id']]);
    const currentNames = new Set(currentMembers.map(member => member.interface));
    for (const name of selectedInterfaces) if (!currentNames.has(name)) { const added = await client.command(['/interface/list/member/add','=list=FLAMMES-HOTSPOT','=interface=' + name]); const trap = added.find(sentence => sentence[0] === '!trap' || sentence[0] === '!fatal'); if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS rejected interface ' + name + '.'); }
    return { listName:'FLAMMES-HOTSPOT', interfaces:selectedInterfaces };
  } finally { client.close(); }
}

async function inspectMikrotikLanConfig(router: RouterRecord, username: string, password: string): Promise<RouterLanConfig> {
  const port=router.apiPort ?? (router.apiTransport==='tls'?8729:8728); const transport=router.apiTransport ?? 'tcp';
  const client=await openRouterOsConnection(router.host,port,transport);
  try {
    await loginRouterOs(client,username,password);
    const live=await discoverMikrotikInterfaces(router,username,password);
    const bridges=(await client.command(['/interface/bridge/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes).map(x=>({id:x['.id']||x.name,name:x.name||'',disabled:boolAttr(x.disabled)})).filter(x=>x.name);
    const bridgePorts=(await client.command(['/interface/bridge/port/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes).map(x=>({id:x['.id']||'',bridge:x.bridge||'',interface:x.interface||'',disabled:boolAttr(x.disabled)})).filter(x=>x.interface&&x.bridge);
    const ipAddresses=(await client.command(['/ip/address/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes).map(x=>({id:x['.id']||'',address:x.address||'',interface:x.interface||'',network:x.network||undefined,disabled:boolAttr(x.disabled)})).filter(x=>x.address&&x.interface);
    const dhcpServers=(await client.command(['/ip/dhcp-server/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes).map(x=>({id:x['.id']||'',name:x.name||'',interface:x.interface||'',addressPool:x['address-pool']||undefined,disabled:boolAttr(x.disabled)})).filter(x=>x.interface);
    const natRules=(await client.command(['/ip/firewall/nat/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes).map(x=>({id:x['.id']||'',chain:x.chain||'',action:x.action||'',outInterface:x['out-interface']||undefined,outInterfaceList:x['out-interface-list']||undefined,disabled:boolAttr(x.disabled)}));
    const interfaceLists=(await client.command(['/interface/list/member/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes).map(x=>({list:x.list||'',interface:x.interface||'',disabled:boolAttr(x.disabled)})).filter(x=>x.list&&x.interface);
    const hotspotSet=new Set(router.hotspotInterfaces??[]); const dhcpIfaces=new Set(dhcpServers.filter(x=>!x.disabled).map(x=>x.interface));
    const recommended=bridges.filter(b=>!b.disabled).sort((a,b)=>{const score=(name:string)=>bridgePorts.filter(p=>p.bridge===name&&!p.disabled).reduce((n,p)=>n+(dhcpIfaces.has(p.bridge)?5:0)+(/lan|local|bridge/i.test(p.bridge)?2:0),0);return score(b.name)-score(a.name);})[0];
    const safe=!!recommended && dhcpServers.some(d=>!d.disabled&&d.interface===recommended.name) && !/wan|internet|pppoe|uplink/i.test(recommended.name);
    const interfaces=live.interfaces.map(i=>({name:i.name,bridge:bridgePorts.find(p=>p.interface===i.name&&!p.disabled)?.bridge,running:i.running,disabled:i.disabled,type:i.type,macAddress:i.macAddress,role:(hotspotSet.has(i.name)?'hotspot':bridgePorts.some(p=>p.interface===i.name&&!p.disabled)?'normal_lan':'unassigned') as 'hotspot'|'normal_lan'|'unassigned'}));
    return {interfaces,bridges,bridgePorts,ipAddresses,dhcpServers,natRules,interfaceLists,recommendedLanBridge:recommended?.name,safeToApplyNormalLan:safe};
  } finally { client.close(); }
}
async function applyMikrotikNormalLanPort(router: RouterRecord, username: string, password: string, interfaceName: string) {
  const config=await inspectMikrotikLanConfig(router,username,password);
  if(!config.safeToApplyNormalLan||!config.recommendedLanBridge) throw new Error('No existing LAN bridge with an active DHCP server was safely identified. FLAMMES HOTSPOT will not invent a LAN, DHCP or NAT topology.');
  const client=await openRouterOsConnection(router.host,router.apiPort ?? (router.apiTransport==='tls'?8729:8728),router.apiTransport ?? 'tcp');
  try { await loginRouterOs(client,username,password); if(!config.bridgePorts.some(p=>p.bridge===config.recommendedLanBridge&&p.interface===interfaceName&&!p.disabled)){const result=await client.command(['/interface/bridge/port/add','=bridge='+config.recommendedLanBridge,'=interface='+interfaceName,'=comment=FLAMMES HOTSPOT Normal LAN']);const trap=result.find(x=>x[0]==='!trap'||x[0]==='!fatal');if(trap)throw new Error(sentenceAttributes(trap).message||'RouterOS rejected the Normal LAN port assignment.');} return {bridge:config.recommendedLanBridge,interface:interfaceName}; } finally { client.close(); }
}
async function applyMikrotikBandwidth(router: RouterRecord, username: string, password: string, sessionId: string, ipAddress: string, speedMbps: number) {
  if (!ipAddress) throw new Error('An IP address is required for native MikroTik bandwidth enforcement.');
  if (!Number.isFinite(speedMbps) || speedMbps <= 0) throw new Error('Package speed must be a positive number.');
  const client = await openRouterOsConnection(router.host, router.apiPort ?? (router.apiTransport === 'tls' ? 8729 : 8728), router.apiTransport ?? 'tcp');
  try {
    await loginRouterOs(client, username, password);
    const queueName = `FLAMMES-${sessionId}`;
    const existing = await client.command(['/queue/simple/print', `?name=${queueName}`]);
    for (const sentence of existing.filter(item => item[0] === '!re')) {
      const id = sentenceAttributes(sentence)['.id'];
      if (id) await client.command(['/queue/simple/remove', `=.id=${id}`]);
    }
    const result = await client.command(['/queue/simple/add', `=name=${queueName}`, `=target=${ipAddress}/32`, `=max-limit=${speedMbps}M/${speedMbps}M`, '=comment=FLAMMES HOTSPOT package enforcement']);
    const trap = result.find(sentence => sentence[0] === '!trap' || sentence[0] === '!fatal');
    if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS rejected the bandwidth queue.');
  } finally { client.close(); }
}

async function removeMikrotikBandwidth(router: RouterRecord, username: string, password: string, sessionId: string) {
  const client = await openRouterOsConnection(router.host, router.apiPort ?? (router.apiTransport === 'tls' ? 8729 : 8728), router.apiTransport ?? 'tcp');
  try {
    await loginRouterOs(client, username, password);
    const existing = await client.command(['/queue/simple/print', `?name=FLAMMES-${sessionId}`]);
    for (const sentence of existing.filter(item => item[0] === '!re')) {
      const id = sentenceAttributes(sentence)['.id'];
      if (id) await client.command(['/queue/simple/remove', `=.id=${id}`]);
    }
  } finally { client.close(); }
}

async function authorizeMikrotikHotspotClient(router: RouterRecord, username: string, password: string, sessionId: string, deviceMac: string, ipAddress?: string) {
  if (!deviceMac && !ipAddress) throw new Error('A device MAC or IP address is required for HotSpot authorization.');
  const client = await openRouterOsConnection(router.host, router.apiPort ?? (router.apiTransport === 'tls' ? 8729 : 8728), router.apiTransport ?? 'tcp');
  try {
    await loginRouterOs(client, username, password);
    const comment = 'FLAMMES-' + sessionId;
    const existing = await client.command(['/ip/hotspot/ip-binding/print', '?comment=' + comment]);
    for (const sentence of existing.filter(item => item[0] === '!re')) {
      const id = sentenceAttributes(sentence)['.id'];
      if (id) await client.command(['/ip/hotspot/ip-binding/remove', '=.id=' + id]);
    }
    const args = ['/ip/hotspot/ip-binding/add', '=type=bypassed', '=comment=' + comment];
    if (deviceMac) args.push('=mac-address=' + deviceMac);
    if (ipAddress) args.push('=address=' + ipAddress);
    const result = await client.command(args);
    const trap = result.find(sentence => sentence[0] === '!trap' || sentence[0] === '!fatal');
    if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS rejected HotSpot client authorization.');
  } finally { client.close(); }
}
async function removeMikrotikHotspotClient(router: RouterRecord, username: string, password: string, sessionId: string, deviceMac?: string, ipAddress?: string) {
  const client = await openRouterOsConnection(router.host, router.apiPort ?? (router.apiTransport === 'tls' ? 8729 : 8728), router.apiTransport ?? 'tcp');
  try {
    await loginRouterOs(client, username, password);
    const comment = 'FLAMMES-' + sessionId;
    const bindings = await client.command(['/ip/hotspot/ip-binding/print', '?comment=' + comment]);
    for (const sentence of bindings.filter(item => item[0] === '!re')) {
      const id = sentenceAttributes(sentence)['.id'];
      if (id) await client.command(['/ip/hotspot/ip-binding/remove', '=.id=' + id]);
    }
    const active = await client.command(['/ip/hotspot/active/print']);
    for (const sentence of active.filter(item => item[0] === '!re')) {
      const attrs = sentenceAttributes(sentence);
      if ((deviceMac && attrs['mac-address'] === deviceMac) || (ipAddress && attrs.address === ipAddress)) {
        const id = attrs['.id'];
        if (id) await client.command(['/ip/hotspot/active/remove', '=.id=' + id]);
      }
    }
  } finally { client.close(); }
}
async function installMikrotikCaptiveInterception(router: RouterRecord & { id: string }, username: string, password: string, interfaceName: string, gatewayId: string) {
  const client = await openRouterOsConnection(router.host, router.apiPort ?? (router.apiTransport === 'tls' ? 8729 : 8728), router.apiTransport ?? 'tcp');
  const cloudHost = 'flammes-hotspot-vm77k9.v2.appdeploy.ai';
  try {
    await loginRouterOs(client, username, password);
    const servers = (await client.command(['/ip/hotspot/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes);
    const server = servers.find(x=>x.interface===interfaceName && x.disabled!=='yes');
    if (!server) throw new Error('No active RouterOS HotSpot server exists on the selected interface. Run RouterOS HotSpot setup on that exact interface first; FLAMMES HOTSPOT will not guess a network topology.');
    const profiles = (await client.command(['/ip/hotspot/profile/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes);
    const sourceProfile = profiles.find(x=>x.name===server.profile);
    if (!sourceProfile) throw new Error('The live HotSpot profile could not be verified.');
    const files = (await client.command(['/file/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes);
    const hasFlash = files.some(x=>x.name==='flash' && x.type==='directory');
    const customDir = hasFlash ? 'flash/flammes-hotspot' : 'flammes-hotspot';
    if (!files.some(x=>x.name===customDir)) {
      const copied = await client.command(['/file/copy', '=from=' + (sourceProfile['html-directory'] || 'hotspot'), '=name=' + customDir]);
      const trap = copied.find(x=>x[0]==='!trap'||x[0]==='!fatal');
      if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS could not copy the HotSpot HTML directory.');
    }
    const loginPath = customDir + '/login.html';
    const refreshedFiles = (await client.command(['/file/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes);
    if (!refreshedFiles.some(x=>x.name===loginPath)) {
      const created = await client.command(['/file/add', '=name=' + loginPath, '=type=file']);
      const trap = created.find(x=>x[0]==='!trap'||x[0]==='!fatal');
      if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS could not create the FLAMMES login page.');
    }
    const loginHtml = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=https://' + cloudHost + '/?captive=1&gatewayId=' + gatewayId + '&routerId=' + router.id + '&mac=$(mac-esc)&ip=$(ip)"><title>FLAMMES HOTSPOT</title><style>body{font-family:system-ui;background:#020914;color:#eaf7ff;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:420px;padding:28px;text-align:center;border:1px solid #168dff;border-radius:16px;background:#061426}h1{font-size:24px}p{color:#9bb1c8;line-height:1.6}a{display:inline-block;margin-top:15px;padding:12px 18px;border-radius:9px;background:#0c8cff;color:white;text-decoration:none}</style></head><body><main><h1>FLAMMES HOTSPOT</h1><p>Opening the secure package portal…</p><a href="https://' + cloudHost + '/?captive=1&gatewayId=' + gatewayId + '&routerId=' + router.id + '&mac=$(mac-esc)&ip=$(ip)">Continue to captive portal</a></main></body></html>';
    const fileRecord = refreshedFiles.find(x=>x.name===loginPath);
    const setResult = await client.command(['/file/set', '=.id=' + (fileRecord?.['.id'] || loginPath), '=contents=' + loginHtml]);
    const setTrap = setResult.find(x=>x[0]==='!trap'||x[0]==='!fatal');
    if (setTrap) throw new Error(sentenceAttributes(setTrap).message || 'RouterOS rejected the FLAMMES login page.');
    let customProfile = profiles.find(x=>x.name==='FLAMMES-HOTSPOT-CAPTIVE');
    if (!customProfile) {
      const added = await client.command(['/ip/hotspot/profile/add', '=copy-from=' + sourceProfile.name, '=name=FLAMMES-HOTSPOT-CAPTIVE', '=html-directory-override=' + customDir, '=https-redirect=no']);
      const trap = added.find(x=>x[0]==='!trap'||x[0]==='!fatal');
      if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS rejected the FLAMMES captive profile.');
      customProfile = (await client.command(['/ip/hotspot/profile/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes).find(x=>x.name==='FLAMMES-HOTSPOT-CAPTIVE');
    } else {
      await client.command(['/ip/hotspot/profile/set', '=.id=' + customProfile['.id'], '=html-directory-override=' + customDir, '=https-redirect=no']);
    }
    if (!customProfile?.['.id']) throw new Error('FLAMMES captive profile could not be verified.');
    await client.command(['/ip/hotspot/set', '=.id=' + server['.id'], '=profile=FLAMMES-HOTSPOT-CAPTIVE']);
    const gardens = (await client.command(['/ip/hotspot/walled-garden/print'])).filter(x=>x[0]==='!re').map(sentenceAttributes);
    if (!gardens.some(x=>x['dst-host']===cloudHost)) {
      const addedGarden = await client.command(['/ip/hotspot/walled-garden/add', '=dst-host=' + cloudHost, '=comment=FLAMMES HOTSPOT captive portal cloud']);
      const trap = addedGarden.find(x=>x[0]==='!trap'||x[0]==='!fatal');
      if (trap) throw new Error(sentenceAttributes(trap).message || 'RouterOS rejected the captive portal walled-garden rule.');
    }
    return { ok:true, interface:interfaceName, server:server.name, profile:'FLAMMES-HOTSPOT-CAPTIVE', portalHost:cloudHost, localInterception:true };
  } finally { client.close(); }
}
async function removeAppliedBandwidth(session: SessionRecord & { id: string }) {
  if (!session.bandwidthApplied || !session.routerId) return;
  const [routerRecord] = await db.get<RouterRecord>(routersTable, [session.routerId]);
  if (!routerRecord?.vendor.toLowerCase().includes('mikrotik')) return;
  const prefix = routerSecretPrefix(session.routerId);
  const usernameName = `${prefix}_API_USERNAME`;
  const passwordName = `${prefix}_API_PASSWORD`;
  const names = await secrets.listSecretNames();
  if (!names.includes(usernameName) || !names.includes(passwordName)) return;
  try { await removeMikrotikBandwidth(routerRecord, await secrets.readSecret(usernameName), await secrets.readSecret(passwordName), session.id); } catch {}
}

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],

  'GET /api/routers/:id/credentials/status': [
    async ({ params }) => {
      const [existing] = await db.get<RouterRecord>(routersTable, [params.id]);
      if (!existing) return error('Router not found', 404);
      const names = await secrets.listSecretNames();
      const prefix = routerSecretPrefix(params.id);
      return json({
        routerId: params.id,
        configured: {
          apiUsername: names.includes(`${prefix}_API_USERNAME`),
          apiPassword: names.includes(`${prefix}_API_PASSWORD`),
          apiToken: names.includes(`${prefix}_API_TOKEN`),
          radiusSecret: names.includes(`${prefix}_RADIUS_SECRET`),
        },
        security: 'Backend-only encrypted secrets. Values are never returned to the client.',
      });
    },
  ],

  'GET /api/dashboard': [
    async () => {
      const [customers, packages, sessions, routers, transactions] = await Promise.all([
        db.list<CustomerRecord>(customersTable, { limit: 100 }),
        db.list<PackageRecord>(packagesTable, { limit: 100 }),
        db.list<SessionRecord>(sessionsTable, { limit: 100 }),
        db.list<RouterRecord>(routersTable, { limit: 100 }),
        db.list<TransactionRecord>(transactionsTable, { limit: 100 }),
      ]);
      const revenue = transactions.items
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0);
      const activeSessions = sessions.items.filter(
        s => s.status === 'online' && s.expiresAt > Date.now() && s.accessState !== 'expired' && s.accessState !== 'revoked'
      ).length;
      return json({
        customers: customers.items.length,
        packages: packages.items.length,
        activeSessions,
        routers: routers.items.length,
        revenue,
        pendingPayments: transactions.items.filter(t => t.status === 'pending').length,
      });
    },
  ],

  'GET /api/packages': [
    async () => json({ items: (await db.list<PackageRecord>(packagesTable, { limit: 100 })).items }),
  ],
  'PATCH /api/packages/:id': [
    async ({ params, body }) => {
      const value = body as Partial<PackageRecord>;
      if (!value.name?.trim() || !Number.isFinite(value.price) || value.price < 0 || !Number.isFinite(value.durationMinutes) || value.durationMinutes <= 0 || !Number.isFinite(value.speedMbps) || value.speedMbps <= 0) return error('Name, positive price, validity and speed are required', 400);
      const [existing] = await db.get<PackageRecord>(packagesTable, [params.id]);
      if (!existing) return error('Package not found', 404);
      const record = { ...existing, name: value.name.trim(), price: value.price, durationMinutes: value.durationMinutes, speedMbps: value.speedMbps, dataLimitMb: Number.isFinite(value.dataLimitMb) && (value.dataLimitMb ?? 0) > 0 ? value.dataLimitMb : undefined, status: value.status?.trim() || existing.status };
      const [ok] = await db.update(packagesTable, [{ id: params.id, record }]);
      return ok ? json({ ok: true }) : error('Unable to update package', 500);
    },
  ],
  'POST /api/packages': [
    async ({ body }) => {
      const value = body as Partial<PackageRecord>;
      if (
        !value.name?.trim() ||
        !Number.isFinite(value.price) ||
        value.price < 0 ||
        !Number.isFinite(value.durationMinutes) ||
        value.durationMinutes <= 0 ||
        !Number.isFinite(value.speedMbps) ||
        value.speedMbps <= 0
      ) {
        return error('Name, positive price, validity and speed are required', 400);
      }
      const [id] = await db.add(packagesTable, [{
        name: value.name.trim(),
        price: value.price,
        durationMinutes: value.durationMinutes,
        speedMbps: value.speedMbps,
        dataLimitMb: Number.isFinite(value.dataLimitMb) && (value.dataLimitMb ?? 0) > 0
          ? value.dataLimitMb
          : undefined,
        status: 'active',
      }]);
      if (!id) return error('Unable to create package', 500);
      return json({ id });
    },
  ],

  'GET /api/customers': [
    async () => json({ items: (await db.list<CustomerRecord>(customersTable, { limit: 100 })).items }),
  ],
  'PATCH /api/customers/:id': [
    async ({ params, body }) => {
      const value = body as Partial<CustomerRecord>;
      if (!value.name?.trim() || !value.phone?.trim()) return error('Name and phone are required', 400);
      const [existing] = await db.get<CustomerRecord>(customersTable, [params.id]);
      if (!existing) return error('Customer not found', 404);
      const record = { ...existing, name: value.name.trim(), phone: value.phone.trim(), status: value.status?.trim() || existing.status };
      const [ok] = await db.update(customersTable, [{ id: params.id, record }]);
      return ok ? json({ ok: true }) : error('Unable to update customer', 500);
    },
  ],
  'POST /api/customers': [
    async ({ body }) => {
      const value = body as Partial<CustomerRecord>;
      if (!value.name?.trim() || !value.phone?.trim()) {
        return error('Name and phone are required', 400);
      }
      const [id] = await db.add(customersTable, [{
        name: value.name.trim(),
        phone: value.phone.trim(),
        status: 'active',
        createdAt: Date.now(),
      }]);
      if (!id) return error('Unable to create customer', 500);
      return json({ id });
    },
  ],

  'GET /api/radius/config': [
    async () => {
      const routers = (await db.list<RouterRecord>(routersTable, { limit: 100 })).items;
      const names = await secrets.listSecretNames();
      return json({
        protocol: 'RADIUS',
        authenticationPort: 1812,
        accountingPort: 1813,
        sharedSecretConfiguredForRouters: routers.filter(r => names.includes(`${routerSecretPrefix((r as RouterRecord & { id?: string }).id || '')}_RADIUS_SECRET`)).length,
        mode: 'HTTP AAA engine + gateway/RADIUS bridge',
        note: 'The AppDeploy HTTP backend cannot bind a public UDP 1812/1813 listener directly. This engine provides centralized AAA decisions and accounting APIs for a RADIUS bridge/gateway to consume.',
      });
    },
  ],
  'POST /api/radius/users': [
    async ({ body }) => {
      const value = body as { username?: string; password?: string; status?: string; customerId?: string; packageId?: string };
      if (!value.username?.trim() || !value.password) return error('Username and password are required', 400);
      const username = value.username.trim();
      const [id] = await db.add(radiusUsersTable, [{
        username,
        passwordHash: hashRadiusPassword(value.password),
        status: value.status === 'disabled' ? 'disabled' : 'active',
        customerId: value.customerId,
        packageId: value.packageId,
        createdAt: Date.now(),
      }]);
      if (!id) return error('Unable to create RADIUS user', 500);
      return json({ id, username, status: value.status === 'disabled' ? 'disabled' : 'active' });
    },
  ],
  'POST /api/radius/authenticate': [
    async ({ body }) => {
      const value = body as { username?: string; password?: string };
      if (!value.username?.trim() || !value.password) return error('Username and password are required', 400);
      const result = await authenticateRadius(value.username.trim(), value.password);
      if (!result) return json({ authenticated: false, reason: 'invalid_credentials_or_disabled_user' }, 401);
      return json({ authenticated: true, ...result });
    },
  ],
  'POST /api/radius/accounting': [
    async ({ body }) => {
      const value = body as Partial<RadiusAccountingRecord>;
      if (!value.username?.trim() || !value.sessionId?.trim() || !value.statusType?.trim()) {
        return error('Username, sessionId and statusType are required', 400);
      }
      const inputOctets = Number.isFinite(value.inputOctets) ? Math.max(0, Number(value.inputOctets)) : 0;
      const outputOctets = Number.isFinite(value.outputOctets) ? Math.max(0, Number(value.outputOctets)) : 0;
      const sessionTime = Number.isFinite(value.sessionTime) ? Math.max(0, Number(value.sessionTime)) : 0;
      const [id] = await db.add(radiusAccountingTable, [{
        username: value.username.trim(), sessionId: value.sessionId.trim(), statusType: value.statusType.trim(),
        framedIp: value.framedIp?.trim() || '', callingStationId: value.callingStationId?.trim() || '', calledStationId: value.calledStationId?.trim() || '',
        inputOctets, outputOctets, sessionTime, timestamp: Date.now(),
      }]);
      if (!id) return error('Unable to record RADIUS accounting event', 500);
      const [session] = await db.get<SessionRecord>(sessionsTable, [value.sessionId.trim()]);
      if (session) {
        const totalInput = Math.max(session.inputOctets ?? 0, inputOctets);
        const totalOutput = Math.max(session.outputOctets ?? 0, outputOctets);
        const dataUsedMb = Number(((totalInput + totalOutput) / 1048576).toFixed(2));
        const dataLimitMb = session.bandwidthProfile?.dataLimitMb;
        const limitReached = Number.isFinite(dataLimitMb) && (dataLimitMb ?? 0) > 0 && dataUsedMb >= (dataLimitMb ?? 0);
        const record = { ...session, inputOctets: totalInput, outputOctets: totalOutput, dataUsedMb, lastAccountingAt: Date.now(), ...(limitReached ? { status: 'expired', accessState: 'expired' as const, revokedAt: Date.now() } : {}) };
        const [updated] = await db.update(sessionsTable, [{ id: value.sessionId.trim(), record }]);
        if (updated && limitReached) {
          await removeAppliedBandwidth({ ...session, id: value.sessionId.trim(), bandwidthApplied: session.bandwidthApplied, routerId: session.routerId });
          await queueGatewayCommand(session.gatewayId, 'remove_bandwidth', { sessionId: value.sessionId.trim(), deviceMac: session.deviceMac, ipAddress: session.ipAddress, reason: 'data_limit_reached' });
          await queueGatewayCommand(session.gatewayId, 'disconnect_client', { sessionId: value.sessionId.trim(), deviceMac: session.deviceMac, ipAddress: session.ipAddress, reason: 'data_limit_reached' });
          await notifySessions();
        }
      }
      return json({ ok: true, id, dataUsedMb: session?.dataUsedMb ?? 0 });
    },
  ],
  'GET /api/gateways': [async () => json({ items:(await db.list<GatewayRecord>(gatewaysTable,{limit:100})).items.map(({tokenHash,...safe})=>safe) })],
  'POST /api/gateways/register': [async ({body})=>{const value=body as {name?:string;siteId?:string;platform?:string}; if(!value.name?.trim()) return error('Gateway name is required',400); const token=randomBytes(32).toString('hex'); const [id]=await db.add(gatewaysTable,[{name:value.name.trim(),siteId:value.siteId?.trim()||'default',platform:value.platform?.trim()||'linux',tokenHash:hashGatewayToken(token),status:'offline',createdAt:Date.now(),updatedAt:Date.now()}]); return id?json({gatewayId:id,enrollmentToken:token,warning:'Store this token securely. It will not be returned again.'}):error('Unable to register gateway',500)}],
  'POST /api/gateways/:id/device-context': [async ({params,body})=>{const value=body as {token?:string;routerId?:string;deviceMac?:string;ipAddress?:string};if(!value.token)return error('Gateway token required',401);const gateway=await authenticateGateway(params.id,value.token);if(!gateway)return error('Invalid gateway credentials',401);if(!value.deviceMac?.trim()&&!value.ipAddress?.trim())return error('Device MAC or IP address is required',400);try{return json({ok:true,...await createDeviceContext(params.id,gateway.siteId,value)});}catch(e){return error(e instanceof Error?e.message:'Unable to create device context',500);}}],
  'GET /api/captive/context/:token': [async ({params})=>{const context=await resolveDeviceContext(params.token);if(!context)return error('Captive portal context is invalid or expired',410);const active=await activeSessionForDevice({deviceMac:context.deviceMac,ipAddress:context.ipAddress});if(active)return error('This device is already connected. The captive portal will be available again after your session expires or its data limit is depleted.',409);const settings=await getPortalSettings(context.siteId);const packages=(await db.list<PackageRecord>(packagesTable,{limit:100})).items.filter(item=>item.status==='active');return json({context:{gatewayId:context.gatewayId,routerId:context.routerId,deviceMac:context.deviceMac,ipAddress:context.ipAddress,expiresAt:context.expiresAt},settings,packages}); }],
  'POST /api/gateways/:id/heartbeat': [async ({params,body})=>{const value=body as {token?:string;version?:string;ipAddress?:string}; if(!value.token) return error('Gateway token required',401); const gateway=await authenticateGateway(params.id,value.token); if(!gateway) return error('Invalid gateway credentials',401); const record={...gateway,status:'online',lastHeartbeatAt:Date.now(),version:value.version?.trim()||gateway.version,ipAddress:value.ipAddress?.trim()||gateway.ipAddress,updatedAt:Date.now()}; const [ok]=await db.update(gatewaysTable,[{id:params.id,record}]); return ok?json({ok:true,status:'online',serverTime:Date.now()}):error('Unable to update gateway heartbeat',500)}],
  'POST /api/gateways/:id/poll': [async ({params,body})=>{const value=body as {token?:string}; if(!value.token) return error('Gateway token required',401); const gateway=await authenticateGateway(params.id,value.token); if(!gateway) return error('Invalid gateway credentials',401); await reconcileExpiredSessions(); const commands=(await db.list<GatewayCommand>(gatewayCommandsTable,{limit:200})).items.filter(c=>c.gatewayId===params.id&&c.status==='queued').slice(0,20); for(const command of commands) await db.update(gatewayCommandsTable,[{id:(command as GatewayCommand&{id:string}).id,record:{...command,status:'claimed',claimedAt:Date.now()}}]); return json({commands,policy:await gatewayPolicy(gateway.siteId),serverTime:Date.now()})}],
  'POST /api/gateways/:id/commands/:commandId/result': [async ({params,body})=>{const value=body as {token?:string;status?:'completed'|'failed';result?:Record<string,unknown>}; if(!value.token) return error('Gateway token required',401); const gateway=await authenticateGateway(params.id,value.token); if(!gateway) return error('Invalid gateway credentials',401); const [command]=await db.get<GatewayCommand>(gatewayCommandsTable,[params.commandId]); if(!command||command.gatewayId!==params.id) return error('Command not found',404); const status=value.status==='failed'?'failed':'completed'; const [ok]=await db.update(gatewayCommandsTable,[{id:params.commandId,record:{...command,status,completedAt:Date.now(),result:value.result||{}}}]); return ok?json({ok:true}):error('Unable to save command result',500)}],
  'POST /api/gateways/:id/commands': [async ({params,body})=>{const value=body as {type?:string;payload?:Record<string,unknown>}; if(!value.type?.trim()) return error('Command type is required',400); const [gateway]=await db.get<GatewayRecord>(gatewaysTable,[params.id]); if(!gateway) return error('Gateway not found',404); const [id]=await db.add(gatewayCommandsTable,[{gatewayId:params.id,type:value.type.trim(),payload:value.payload||{},status:'queued',createdAt:Date.now()}]); return id?json({id}):error('Unable to queue gateway command',500)}],
  'GET /api/gateways/:id/policy': [async ({params})=>{const [gateway]=await db.get<GatewayRecord>(gatewaysTable,[params.id]); if(!gateway) return error('Gateway not found',404); return json(await gatewayPolicy(gateway.siteId));}],
  'GET /api/access-points': [async () => {
    const items = (await db.list<AccessPointRecord>(accessPointsTable,{limit:300})).items;
    const routers = (await db.list<RouterRecord>(routersTable,{limit:100})).items;
    const routerMap = new Map(routers.map(r => [(r as RouterRecord & {id:string}).id,r.name]));
    const names = await secrets.listSecretNames();
    return json({items:items.map((item)=>({...item,routerName:item.routerId ? routerMap.get(item.routerId) : undefined,credentialsConfigured:['USERNAME','PASSWORD','TOKEN','SNMP_SECRET'].some(k=>names.includes(`${apSecretPrefix((item as AccessPointRecord & {id:string}).id)}_${k}`))}))});
  }],
  'POST /api/access-points': [async ({body})=>{
    const value=body as Partial<AccessPointRecord>;
    if(!value.name?.trim()||!value.vendor?.trim()||!value.location?.trim()) return error('AP name, vendor and location are required',400);
    const mac=value.macAddress ? normalizeMac(value.macAddress) : undefined; if(value.macAddress&&!mac)return error('Enter a valid AP MAC address.',400);
    const protocols:['api','snmp','http_api','controller','gateway','unknown']=['api','snmp','http_api','controller','gateway','unknown']; const managementProtocol=protocols.includes(value.managementProtocol as any)?value.managementProtocol as AccessPointRecord['managementProtocol']:'unknown';
    const now=Date.now(); const [id]=await db.add(accessPointsTable,[{siteId:value.siteId?.trim()||'default',routerId:value.routerId?.trim()||undefined,parentNodeId:value.parentNodeId?.trim()||undefined,parentInterfaceName:value.parentInterfaceName?.trim()||undefined,name:value.name.trim(),vendor:value.vendor.trim(),model:value.model?.trim()||undefined,macAddress:mac,ipAddress:value.ipAddress?.trim()||undefined,location:value.location.trim(),managementProtocol,status:'unknown',discoverySource:'manual',createdAt:now,updatedAt:now}]);
    return id?json({id}):error('Unable to register access point',500);
  }],
  'PATCH /api/access-points/:id': [async ({params,body})=>{
    const [existing]=await db.get<AccessPointRecord>(accessPointsTable,[params.id]); if(!existing)return error('Access point not found',404); const value=body as Partial<AccessPointRecord>; const mac=value.macAddress===undefined?existing.macAddress:(normalizeMac(value.macAddress||'')); if(value.macAddress&&!mac)return error('Enter a valid AP MAC address.',400); const record={...existing,name:value.name?.trim()||existing.name,vendor:value.vendor?.trim()||existing.vendor,model:value.model?.trim()||existing.model,macAddress:mac,ipAddress:value.ipAddress?.trim()||existing.ipAddress,location:value.location?.trim()||existing.location,routerId:value.routerId?.trim()||existing.routerId,parentNodeId:value.parentNodeId?.trim()||existing.parentNodeId,parentInterfaceName:value.parentInterfaceName?.trim()||existing.parentInterfaceName,updatedAt:Date.now()}; const [ok]=await db.update(accessPointsTable,[{id:params.id,record}]); return ok?json({ok:true}):error('Unable to update access point',500);
  }],
  'GET /api/access-points/:id/credentials/status': [async ({params})=>{const [ap]=await db.get<AccessPointRecord>(accessPointsTable,[params.id]);if(!ap)return error('Access point not found',404);const names=await secrets.listSecretNames();const prefix=apSecretPrefix(params.id);return json({accessPointId:params.id,configured:{username:names.includes(`${prefix}_USERNAME`),password:names.includes(`${prefix}_PASSWORD`),token:names.includes(`${prefix}_TOKEN`),snmpSecret:names.includes(`${prefix}_SNMP_SECRET`)},security:'Backend-only encrypted secrets. Values are never returned to the client.'});}],
  'GET /api/access-points/topology': [async ()=>{
    const routers=(await db.list<RouterRecord>(routersTable,{limit:100})).items.map(r=>({...r,type:'router',nodeId:(r as RouterRecord&{id:string}).id}));
    const aps=(await db.list<AccessPointRecord>(accessPointsTable,{limit:300})).items.map(ap=>({...ap,type:'access_point',nodeId:(ap as AccessPointRecord&{id:string}).id}));
    const links: Array<Record<string,unknown>>=[];
    for(const ap of aps){ if(ap.routerId) links.push({from:ap.routerId,to:ap.nodeId,type:ap.parentInterfaceName?'ethernet':'managed',interfaceName:ap.parentInterfaceName,source:'configured'}); if(ap.parentNodeId) links.push({from:ap.parentNodeId,to:ap.nodeId,type:'ap_chain',source:'configured'}); }
    const liveDiscovery: Array<Record<string,unknown>>=[];
    for(const r of routers){ if(!String(r.vendor).toLowerCase().includes('mikrotik')) continue; const id=String(r.id); const prefix=routerSecretPrefix(id); const names=await secrets.listSecretNames(); const u=prefix+'_API_USERNAME',p=prefix+'_API_PASSWORD'; if(!names.includes(u)||!names.includes(p)) continue; try { const client=await openRouterOsConnection(r.host,r.apiPort??(r.apiTransport==='tls'?8729:8728),r.apiTransport??'tcp'); await loginRouterOs(client,await secrets.readSecret(u),await secrets.readSecret(p)); const replies=await client.command(['/ip/neighbor/print','detail']); const neighbors=replies.filter(s=>s[0]==='!re').map(s=>sentenceAttributes(s)); for(const n of neighbors){ liveDiscovery.push({routerId:id,interfaceName:n.interface,identity:n.identity||n['system-identity'],address:n.address||n['ip-address'],macAddress:n['mac-address'],platform:n.platform||n['version'],protocol:n.protocol||n['discovery-protocol'],source:'routeros_neighbor'}); } client.close(); } catch {} }
    return json({routers,accessPoints:aps,links,liveDiscovery,generatedAt:Date.now(),note:'Topology links are only shown when configured or reported by live discovery. Unknown links are never invented.'});
  }],
  'GET /api/analytics/ap-earnings': [async ({query})=>{
    const requested=String(query?.date||'').trim(); const date=/^\\d{4}-\\d{2}-\\d{2}$/.test(requested)?requested:new Date().toISOString().slice(0,10); const start=Date.parse(`${date}T00:00:00.000Z`); const end=start+86400000; const transactions=(await db.list<TransactionRecord>(transactionsTable,{limit:1000})).items.filter(t=>t.status==='paid'&&(t.paidAt??t.createdAt)>=start&&(t.paidAt??t.createdAt)<end); const aps=(await db.list<AccessPointRecord>(accessPointsTable,{limit:300})).items; const rows=aps.map(ap=>{const id=(ap as AccessPointRecord&{id:string}).id;const matched=transactions.filter(t=>(t as TransactionRecord&{accessPointId?:string}).accessPointId===id);return {accessPointId:id,name:ap.name,location:ap.location,revenue:matched.reduce((s,t)=>s+t.amount,0),transactions:matched.length,customers:new Set(matched.map(t=>t.customerId||t.customerName)).size};}); const unattributed=transactions.filter(t=>!(t as TransactionRecord&{accessPointId?:string}).accessPointId); return json({date,rows,totalRevenue:transactions.reduce((s,t)=>s+t.amount,0),unattributedRevenue:unattributed.reduce((s,t)=>s+t.amount,0),generatedAt:Date.now(),storage:'Calculated from transaction records at request time; no daily revenue snapshots are stored.'});
  }],
  'GET /api/firewall/:routerId': [async ({params})=>{const [routerRecord]=await db.get<RouterRecord>(routersTable,[params.routerId]);if(!routerRecord)return error('Router not found',404);const rules=(await db.list<FirewallRuleRecord>(firewallRulesTable,{limit:300})).items.filter(r=>r.routerId===params.routerId);let live:any={supported:false};if(routerRecord.vendor.toLowerCase().includes('mikrotik')){const prefix=routerSecretPrefix(params.routerId);const names=await secrets.listSecretNames();const u=prefix+'_API_USERNAME',p=prefix+'_API_PASSWORD';if(names.includes(u)&&names.includes(p)){try{const client=await openRouterOsConnection(routerRecord.host,routerRecord.apiPort??(routerRecord.apiTransport==='tls'?8729:8728),routerRecord.apiTransport??'tcp');await loginRouterOs(client,await secrets.readSecret(u),await secrets.readSecret(p));const replies=await client.command(['/ip/firewall/filter/print','detail']);live={supported:true,rules:replies.filter(s=>s[0]==='!re').map(s=>sentenceAttributes(s)),source:'live_routeros'};client.close();}catch(e){live={supported:true,error:e instanceof Error?e.message:'Firewall inspection failed'};}}} return json({router:routerRecord,rules,live});}],
  'POST /api/firewall/:routerId/baseline': [async ({params})=>{
    const [routerRecord]=await db.get<RouterRecord>(routersTable,[params.routerId]);if(!routerRecord)return error('Router not found',404);if(!routerRecord.vendor.toLowerCase().includes('mikrotik'))return error('Safe native firewall baseline is currently implemented for MikroTik RouterOS; other vendors use the gateway firewall path.',409);const prefix=routerSecretPrefix(params.routerId);const names=await secrets.listSecretNames();const u=prefix+'_API_USERNAME',p=prefix+'_API_PASSWORD';if(!names.includes(u)||!names.includes(p))return error('MikroTik API credentials are not configured.',409);try{const client=await openRouterOsConnection(routerRecord.host,routerRecord.apiPort??(routerRecord.apiTransport==='tls'?8729:8728),routerRecord.apiTransport??'tcp');await loginRouterOs(client,await secrets.readSecret(u),await secrets.readSecret(p));const lists=(await client.command(['/interface/list/print'])).filter(s=>s[0]==='!re').map(sentenceAttributes);const wan=lists.find(x=>x.name==='WAN');if(!wan)return error('RouterOS has no WAN interface list. FLAMMES HOTSPOT will not guess the WAN interface; create/verify a WAN interface list first.',409);const rules=[['input','accept','connection-state=established,related','FLAMMES-HOTSPOT established/related'],['input','drop','connection-state=invalid','FLAMMES-HOTSPOT invalid'],['input','accept','protocol=icmp','FLAMMES-HOTSPOT allow ICMP'],['input','drop','in-interface-list=WAN','FLAMMES-HOTSPOT block WAN input'],['forward','accept','connection-state=established,related','FLAMMES-HOTSPOT forward established/related'],['forward','drop','connection-state=invalid','FLAMMES-HOTSPOT forward invalid']];const hotspotList=lists.find(x=>x.name==='FLAMMES-HOTSPOT');if(hotspotList)rules.push(['forward','accept','in-interface-list=FLAMMES-HOTSPOT out-interface-list=WAN','FLAMMES-HOTSPOT clients to internet']);const liveRules=(await client.command(['/ip/firewall/filter/print','detail'])).filter(s=>s[0]==='!re').map(sentenceAttributes);for(const [chain,action,condition,comment] of rules){const props=[`=chain=${chain}`,`=action=${action}`,`=comment=${comment}`];for(const token of condition.split(' ')){const [k,v]=token.split('=');if(k&&v)props.push(`=${k}=${v}`);}const existing=liveRules.some(x=>x.comment===comment);if(!existing){const result=await client.command(['/ip/firewall/filter/add',...props]);const trap=result.find(s=>s[0]==='!trap'||s[0]==='!fatal');if(trap)throw new Error(sentenceAttributes(trap).message||'RouterOS rejected a firewall rule.');}}client.close();const now=Date.now();for(const [chain,action,condition,comment] of rules){const [name,source,destination,port]=['',undefined,undefined,undefined];const existing=(await db.list<FirewallRuleRecord>(firewallRulesTable,{limit:300})).items.find(r=>r.routerId===params.routerId&&r.name===comment);if(!existing)await db.add(firewallRulesTable,[{siteId:'default',routerId:params.routerId,name:comment,chain:chain as FirewallRuleRecord['chain'],action:action as FirewallRuleRecord['action'],comment,enabled:true,createdAt:now,updatedAt:now,source,destination,port}]);}return json({ok:true,applied:true,scope:'RouterOS input/forward baseline',rules:rules.map(r=>r[3]),hotspotForwardRule:Boolean(hotspotList),note:'FLAMMES HOTSPOT firewall rules were added idempotently. Existing firewall rules are preserved. The guest-to-internet rule is added only when the live FLAMMES-HOTSPOT interface list exists.'});}catch(e){return error(e instanceof Error?e.message:'Unable to apply firewall baseline',502);}}
  ],
  'GET /api/routers': [
    async () => json({ items: (await db.list<RouterRecord>(routersTable, { limit: 100 })).items }),
  ],
  'GET /api/routers/:id/port-allocations': [async ({params})=>{
    const [routerRecord]=await db.get<RouterRecord>(routersTable,[params.id]);
    if(!routerRecord)return error('Router not found',404);
    return json({items:(await db.list<PortAllocationRecord>(portAllocationsTable,{limit:300})).items.filter(item=>item.routerId===params.id)});
  }],
  'POST /api/routers/:id/port-allocations': [async ({params,body})=>{
    const value=body as Partial<PortAllocationRecord>;
    const [routerRecord]=await db.get<RouterRecord>(routersTable,[params.id]);
    if(!routerRecord)return error('Router not found',404);
    const interfaceName=String(value.interfaceName||'').trim();
    const role=value.role==='monthly_customer'?'monthly_customer':'hotspot';
    if(!interfaceName)return error('A live router interface is required',400);
    if(routerRecord.vendor.toLowerCase().includes('mikrotik')){
      const prefix=routerSecretPrefix(params.id);const names=await secrets.listSecretNames();const u=prefix+'_API_USERNAME',p=prefix+'_API_PASSWORD';
      if(!names.includes(u)||!names.includes(p))return error('MikroTik API credentials are not configured.',409);
      const live=await discoverMikrotikInterfaces(routerRecord,await secrets.readSecret(u),await secrets.readSecret(p));
      const found=live.interfaces.find(item=>item.name===interfaceName);
      if(!found)return error('The selected interface was not returned by the live RouterOS scan.',409);
      if(!found.physical)return error('Only real physical ports can be allocated to hotspot or monthly customers.',400);
    }
    const existing=(await db.list<PortAllocationRecord>(portAllocationsTable,{limit:300})).items.filter(item=>item.routerId===params.id&&item.interfaceName===interfaceName&&item.enabled);
    if(existing.length)return error('This physical port is already allocated. Edit or disable the existing allocation first.',409);
    let customerName=value.customerName?.trim()||undefined;
    if(value.customerId){const [customer]=await db.get<CustomerRecord>(customersTable,[value.customerId]);if(!customer)return error('Customer not found',404);customerName=customer.name;}
    if(role==='monthly_customer'&&!value.customerId&&!customerName)return error('Select a monthly customer for this port.',400);
    const now=Date.now();const [id]=await db.add(portAllocationsTable,[{routerId:params.id,interfaceName,role,customerId:value.customerId,customerName,label:value.label?.trim()||interfaceName,enabled:value.enabled!==false,createdAt:now,updatedAt:now}]);
    if(!id)return error('Unable to save port allocation',500);
    return json({ok:true,id});
  }],
  'DELETE /api/routers/:id/port-allocations/:allocationId': [async ({params})=>{
    const [item]=await db.get<PortAllocationRecord>(portAllocationsTable,[params.allocationId]);
    if(!item||item.routerId!==params.id)return error('Port allocation not found',404);
    await db.delete(portAllocationsTable,[params.allocationId]);
    return json({ok:true});
  }],
  'POST /api/routers/:id/captive/activate': [async ({params,body})=>{const value=body as {interfaceName?:string;gatewayId?:string};if(!value.interfaceName?.trim()||!value.gatewayId?.trim())return error('HotSpot interface and Gateway Agent are required',400);const [routerRecord]=await db.get<RouterRecord>(routersTable,[params.id]);if(!routerRecord)return error('Router not found',404);if(!routerRecord.vendor.toLowerCase().includes('mikrotik'))return error('Native captive interception is implemented for MikroTik RouterOS; other vendors use the Gateway Agent interception path.',409);const [gateway]=await db.get<GatewayRecord>(gatewaysTable,[value.gatewayId]);if(!gateway)return error('Gateway Agent not found',404);const prefix=routerSecretPrefix(params.id);const names=await secrets.listSecretNames();const u=prefix+'_API_USERNAME',p=prefix+'_API_PASSWORD';if(!names.includes(u)||!names.includes(p))return error('MikroTik API credentials are not configured.',409);try{const live=await discoverMikrotikInterfaces(routerRecord,await secrets.readSecret(u),await secrets.readSecret(p));if(!live.interfaces.some(i=>i.name===value.interfaceName))return error('Selected interface is not present in the latest live scan.',409);return json(await installMikrotikCaptiveInterception({...routerRecord,id:params.id},await secrets.readSecret(u),await secrets.readSecret(p),value.interfaceName,value.gatewayId));}catch(e){return error(e instanceof Error?e.message:'Unable to activate captive interception.',502);}}],
  'GET /api/captive/entry': [async ({query})=>{const gatewayId=String(query?.gatewayId||'').trim(); const routerId=String(query?.routerId||'').trim()||undefined; const deviceMac=String(query?.mac||'').trim()||undefined; const ipAddress=String(query?.ip||'').trim()||undefined; if(!gatewayId||(!deviceMac&&!ipAddress)) return error('Gateway and device identity are required',400); const [gateway]=await db.get<GatewayRecord>(gatewaysTable,[gatewayId]); if(!gateway)return error('Gateway not found',404); try{return json({ok:true,...await createDeviceContext(gatewayId,gateway.siteId,{routerId,deviceMac,ipAddress})});}catch(e){return error(e instanceof Error?e.message:'This device already has an active session.',409);} }],
  'POST /api/routers/:id/captive/authorize-test': [async ({params,body})=>{const value=body as {deviceMac?:string;ipAddress?:string}; const [routerRecord]=await db.get<RouterRecord>(routersTable,[params.id]); if(!routerRecord)return error('Router not found',404); if(!routerRecord.vendor.toLowerCase().includes('mikrotik'))return error('Native HotSpot authorization is currently implemented for MikroTik RouterOS.',409); const names=await secrets.listSecretNames(); const prefix=routerSecretPrefix(params.id); const u=prefix+'_API_USERNAME',p=prefix+'_API_PASSWORD'; if(!names.includes(u)||!names.includes(p))return error('MikroTik API credentials are not configured.',409); return error('Use a paid device-bound session to authorize the real client. This endpoint does not create access by itself.',409); }],

  'GET /api/routers/:id/interfaces': [async ({ params }) => {
    const [existing] = await db.get<RouterRecord>(routersTable,[params.id]); if (!existing) return error('Router not found',404);
    if (!existing.vendor.toLowerCase().includes('mikrotik')) return error('Live interface discovery is not available for this vendor yet. No interface data is guessed or synthesized.',409);
    const prefix=routerSecretPrefix(params.id); const names=await secrets.listSecretNames(); const usernameName=prefix+'_API_USERNAME'; const passwordName=prefix+'_API_PASSWORD';
    if (!names.includes(usernameName)||!names.includes(passwordName)) return error('MikroTik API credentials are not configured.',409);
    try { const result=await discoverMikrotikInterfaces(existing,await secrets.readSecret(usernameName),await secrets.readSecret(passwordName)); await db.update(routersTable,[{id:params.id,record:{...existing,status:'online',lastCheckedAt:result.scannedAt}}]); return json({source:'live_routeros_api',exact:true,scannedAt:result.scannedAt,apiPort:result.apiPort,apiTransport:result.apiTransport,interfaces:result.interfaces,hotspotServers:result.hotspotServers,configuredHotspotInterfaces:existing.hotspotInterfaces??[]}); }
    catch (scanError) { const message=scanError instanceof Error?scanError.message:'Live interface discovery failed.'; await db.update(routersTable,[{id:params.id,record:{...existing,status:'offline',lastCheckedAt:Date.now()}}]); return json({source:'live_routeros_api',exact:false,error:message},502); }
  }],
  'POST /api/routers/:id/hotspot-interfaces': [async ({ params, body }) => {
    const [existing]=await db.get<RouterRecord>(routersTable,[params.id]); if(!existing) return error('Router not found',404); if(!existing.vendor.toLowerCase().includes('mikrotik')) return error('Hotspot interface configuration is only enabled where a live vendor adapter can verify the interface names.',409);
    const value=body as {interfaces?:unknown}; if(!Array.isArray(value.interfaces)) return error('Interfaces must be an array of exact router interface names.',400); const selected=Array.from(new Set(value.interfaces.map(item=>String(item).trim()).filter(Boolean)));
    const prefix=routerSecretPrefix(params.id); const names=await secrets.listSecretNames(); const usernameName=prefix+'_API_USERNAME'; const passwordName=prefix+'_API_PASSWORD'; if(!names.includes(usernameName)||!names.includes(passwordName)) return error('MikroTik API credentials are not configured.',409);
    const result=await discoverMikrotikInterfaces(existing,await secrets.readSecret(usernameName),await secrets.readSecret(passwordName)); const knownNames=new Set(result.interfaces.map(item=>item.name)); const unknown=selected.filter(name=>!knownNames.has(name)); if(unknown.length) return error('These interface names were not returned by the live router scan: '+unknown.join(', '),400);
    const record={...existing,hotspotInterfaces:selected,hotspotInterfaceConfiguredAt:Date.now(),status:'online',lastCheckedAt:result.scannedAt}; const [ok]=await db.update(routersTable,[{id:params.id,record}]); if(!ok) return error('Unable to save hotspot interface selection.',500); return json({ok:true,exact:true,source:'live_routeros_api',interfaces:selected,configuredAt:record.hotspotInterfaceConfiguredAt});
  }],
  'POST /api/routers/:id/hotspot-interfaces/apply': [async ({ params }) => {
    const [existing]=await db.get<RouterRecord>(routersTable,[params.id]); if(!existing) return error('Router not found',404); if(!existing.vendor.toLowerCase().includes('mikrotik')) return error('Hotspot interface list application is not available for this vendor yet.',409); const selected=existing.hotspotInterfaces??[]; if(!selected.length) return error('Select and save at least one live router interface first.',400);
    const prefix=routerSecretPrefix(params.id); const names=await secrets.listSecretNames(); const usernameName=prefix+'_API_USERNAME'; const passwordName=prefix+'_API_PASSWORD'; if(!names.includes(usernameName)||!names.includes(passwordName)) return error('MikroTik API credentials are not configured.',409);
    const result=await discoverMikrotikInterfaces(existing,await secrets.readSecret(usernameName),await secrets.readSecret(passwordName)); const knownNames=new Set(result.interfaces.map(item=>item.name)); const unknown=selected.filter(name=>!knownNames.has(name)); if(unknown.length) return error('The saved selection is stale. Re-scan and choose live interfaces again: '+unknown.join(', '),409);
    const applied=await applyMikrotikHotspotInterfaceList(existing,await secrets.readSecret(usernameName),await secrets.readSecret(passwordName),selected); return json({ok:true,exact:true,source:'live_routeros_api',listName:applied.listName,interfaces:applied.interfaces,note:'RouterOS interface list FLAMMES-HOTSPOT was updated. This does not create or alter a HotSpot server, IP address, DHCP pool, bridge, or NAT configuration.'});
  }],
  'GET /api/routers/:id/lan-config': [async ({params})=>{
    const [existing]=await db.get<RouterRecord>(routersTable,[params.id]); if(!existing)return error('Router not found',404); if(!existing.vendor.toLowerCase().includes('mikrotik'))return error('Live RouterOS LAN inspection is currently implemented for MikroTik.',409);
    const prefix=routerSecretPrefix(params.id);const names=await secrets.listSecretNames();const u=prefix+'_API_USERNAME',p=prefix+'_API_PASSWORD';if(!names.includes(u)||!names.includes(p))return error('MikroTik API credentials are not configured.',409);
    try{return json({source:'live_routeros_api',exact:true,scannedAt:Date.now(),config:await inspectMikrotikLanConfig(existing,await secrets.readSecret(u),await secrets.readSecret(p))});}catch(e){return error(e instanceof Error?e.message:'Unable to inspect RouterOS LAN configuration.',502);}
  }],
  'POST /api/routers/:id/port-role': [async ({params,body})=>{
    const value=body as {interfaceName?:string;role?:'hotspot'|'normal_lan'}; const interfaceName=String(value.interfaceName||'').trim(); const role=value.role; if(!interfaceName||!role)return error('Interface name and port role are required.',400);
    const [existing]=await db.get<RouterRecord>(routersTable,[params.id]);if(!existing)return error('Router not found',404);if(!existing.vendor.toLowerCase().includes('mikrotik'))return error('Live port role enforcement is currently implemented for MikroTik RouterOS.',409);
    const prefix=routerSecretPrefix(params.id);const names=await secrets.listSecretNames();const u=prefix+'_API_USERNAME',p=prefix+'_API_PASSWORD';if(!names.includes(u)||!names.includes(p))return error('MikroTik API credentials are not configured.',409);
    try{const username=await secrets.readSecret(u),password=await secrets.readSecret(p);const live=await discoverMikrotikInterfaces(existing,username,password);const iface=live.interfaces.find(i=>i.name===interfaceName&&i.physical);if(!iface)return error('Selected port is not a real physical interface from the live RouterOS scan.',409);
      if(role==='hotspot'){const selected=Array.from(new Set([...(existing.hotspotInterfaces??[]),interfaceName]));await applyMikrotikHotspotInterfaceList(existing,username,password,selected);const record={...existing,hotspotInterfaces:selected,hotspotInterfaceConfiguredAt:Date.now(),status:'online',lastCheckedAt:live.scannedAt};await db.update(routersTable,[{id:params.id,record}]);return json({ok:true,role,interfaceName,note:'Port is assigned to the FLAMMES-HOTSPOT RouterOS interface list. Existing bridge/DHCP/NAT settings were not changed.'});}
      const selected=(existing.hotspotInterfaces??[]).filter(name=>name!==interfaceName);const current={...existing,hotspotInterfaces:selected};await applyMikrotikHotspotInterfaceList(existing,username,password,selected);const lan=await applyMikrotikNormalLanPort(current,username,password,interfaceName);const record={...current,hotspotInterfaceConfiguredAt:Date.now(),status:'online',lastCheckedAt:Date.now()};await db.update(routersTable,[{id:params.id,record}]);return json({ok:true,role,interfaceName,bridge:lan.bridge,note:interfaceName+' is now a normal LAN port on existing bridge '+lan.bridge+'. Existing DHCP/NAT configuration was preserved.'});
    }catch(e){return error(e instanceof Error?e.message:'Unable to apply port role.',502);}
  }],
  'GET /api/portal/:siteId/config': [async ({ params }) => { const settings = await getPortalSettings(params.siteId); const packages = (await db.list<PackageRecord>(packagesTable, { limit: 100 })).items.filter(item => item.status === 'active'); const supportContacts = await getSupportContacts(params.siteId); return json({ settings: { ...settings, supportContacts }, packages, supportContacts }); }],
  'GET /api/sites/:siteId/support': [async ({ params }) => json({ items: await getAllSupportContacts(params.siteId) })],
  'POST /api/sites/:siteId/support': [async ({ params, body }) => { const value = body as Partial<SupportContact>; const phone = value.phone?.trim() || ''; const label = value.label?.trim() || ''; if (!phone || !label) return error('Support label and phone number are required.', 400); if (!/^[+0-9 ()-]{7,25}$/.test(phone)) return error('Enter a valid support phone number.', 400); const now = Date.now(); const [id] = await db.add(supportContactsTable, [{ id: randomBytes(12).toString('hex'), siteId: params.siteId, label, phone, enabled: value.enabled !== false, createdAt: now, updatedAt: now }]); return id ? json({ id }) : error('Unable to add support number.', 500); }],
  'PUT /api/sites/:siteId/support/:id': [async ({ params, body }) => { const [existing] = await db.get<SupportContact & { siteId?: string }>(supportContactsTable, [params.id]); if (!existing || existing.siteId !== params.siteId) return error('Support contact not found.', 404); const value = body as Partial<SupportContact>; const phone = value.phone?.trim() ?? existing.phone; const label = value.label?.trim() ?? existing.label; if (!label || !phone || !/^[+0-9 ()-]{7,25}$/.test(phone)) return error('Enter a valid support label and phone number.', 400); const record = { ...existing, label, phone, enabled: value.enabled ?? existing.enabled, updatedAt: Date.now() }; const [ok] = await db.update(supportContactsTable, [{ id: params.id, record }]); return ok ? json({ ok: true }) : error('Unable to update support number.', 500); }],
  'DELETE /api/sites/:siteId/support/:id': [async ({ params }) => { const [existing] = await db.get<SupportContact & { siteId?: string }>(supportContactsTable, [params.id]); if (!existing || existing.siteId !== params.siteId) return error('Support contact not found.', 404); await db.delete(supportContactsTable, [params.id]); return json({ ok: true }); }],
  'PUT /api/portal/:siteId/config': [async ({ params, body }) => { const value = body as Partial<CaptivePortalSettings>; const current = await getPortalSettings(params.siteId); const record: CaptivePortalSettings = { ...current, siteId: params.siteId, title: value.title?.trim() || current.title, subtitle: value.subtitle?.trim() || current.subtitle, logoText: value.logoText?.trim() || current.logoText, status: value.status === 'disabled' ? 'disabled' : 'active', successMessage: value.successMessage?.trim() || current.successMessage, supportContacts: current.supportContacts, updatedAt: Date.now() }; const [existing] = await db.get<CaptivePortalSettings>(portalSettingsTable, [params.siteId]); if (existing) { const [ok] = await db.update(portalSettingsTable, [{ id: params.siteId, record }]); return ok ? json({ settings: record }) : error('Unable to save captive portal settings', 500); } const [id] = await db.add(portalSettingsTable, [{ id: params.siteId, ...record }]); return id ? json({ settings: record }) : error('Unable to save captive portal settings', 500); }],
  'GET /api/sites/:siteId/walled-garden': [async ({ params }) => json({ items: (await db.list<WalledGardenRule>(walledGardenTable, { limit: 200 })).items.filter(item => item.siteId === params.siteId) })],
  'POST /api/sites/:siteId/walled-garden': [async ({ params, body }) => { const value = body as Partial<WalledGardenRule>; const type = value.type === 'ip' ? 'ip' : 'domain'; const host = normalizePortalHost(value.host ?? ''); if (!validWalledGardenHost(host, type)) return error('Enter a valid domain or IPv4 address for the walled garden rule', 400); const [id] = await db.add(walledGardenTable, [{ siteId: params.siteId, host, type, description: value.description?.trim() || '', enabled: value.enabled !== false, createdAt: Date.now(), updatedAt: Date.now() }]); return id ? json({ id }) : error('Unable to create walled garden rule', 500); }],
  'PUT /api/sites/:siteId/walled-garden/:id': [async ({ params, body }) => { const [existing] = await db.get<WalledGardenRule>(walledGardenTable, [params.id]); if (!existing || existing.siteId !== params.siteId) return error('Walled garden rule not found', 404); const value = body as Partial<WalledGardenRule>; const type = value.type === 'ip' ? 'ip' : value.type === 'domain' ? 'domain' : existing.type; const host = normalizePortalHost(value.host ?? existing.host); if (!validWalledGardenHost(host, type)) return error('Enter a valid domain or IPv4 address for the walled garden rule', 400); const record = { ...existing, host, type, description: value.description?.trim() ?? existing.description, enabled: value.enabled ?? existing.enabled, updatedAt: Date.now() }; const [ok] = await db.update(walledGardenTable, [{ id: params.id, record }]); return ok ? json({ ok: true }) : error('Unable to update walled garden rule', 500); }],
  'DELETE /api/sites/:siteId/walled-garden/:id': [async ({ params }) => { const [existing] = await db.get<WalledGardenRule>(walledGardenTable, [params.id]); if (!existing || existing.siteId !== params.siteId) return error('Walled garden rule not found', 404); await db.delete(walledGardenTable, [params.id]); return json({ ok: true }); }],
  'POST /api/routers/:id/test-connection': [
    async ({ params }) => {
      const [existing] = await db.get<RouterRecord>(routersTable, [params.id]);
      if (!existing) return error('Router not found', 404);
      const vendor = existing.vendor.trim().toLowerCase();
      const integration = vendor.includes('mikrotik') ? 'MikroTik adapter' : vendor.includes('ubiquiti') ? 'Ubiquiti adapter' : vendor.includes('openwrt') ? 'OpenWrt gateway adapter' : vendor.includes('cisco') ? 'Cisco adapter' : vendor.includes('tp-link') || vendor.includes('omada') ? 'TP-Link Omada adapter' : 'Generic RADIUS / Gateway adapter';
      const connectionType = vendor.includes('mikrotik') ? 'RouterOS API + RADIUS' : vendor.includes('cisco') || vendor.includes('ubiquiti') || vendor.includes('openwrt') ? 'RADIUS / API' : 'RADIUS / Gateway';
      const capabilities = vendor.includes('mikrotik')
        ? ['authentication', 'accounting', 'captive_portal', 'bandwidth_policy', 'session_control', 'routeros_api']
        : ['authentication', 'accounting', 'captive_portal', 'bandwidth_policy', 'session_control'];

      if (vendor.includes('mikrotik')) {
        const prefix = routerSecretPrefix(params.id);
        const names = await secrets.listSecretNames();
        const usernameName = `${prefix}_API_USERNAME`;
        const passwordName = `${prefix}_API_PASSWORD`;
        if (!names.includes(usernameName) || !names.includes(passwordName)) {
          const record = { ...existing, integration, connectionType, capabilities, status: 'configured', lastCheckedAt: Date.now() };
          await db.update(routersTable, [{ id: params.id, record }]);
          return json({
            status: 'failed',
            code: 'credentials_not_configured',
            message: 'MikroTik credentials are not configured. Add the backend API username and API password secrets, then test again.',
            capabilities,
          });
        }
        try {
          const username = await secrets.readSecret(usernameName);
          const password = await secrets.readSecret(passwordName);
          const details = await testMikrotikRouter({ ...existing, integration, connectionType, capabilities }, username, password);
          const record = { ...existing, integration, connectionType, capabilities, boardName: details.board, manufacturerModel: details.board, status: 'online', apiPort: details.apiPort, apiTransport: details.apiTransport, lastCheckedAt: Date.now() };
          const [ok] = await db.update(routersTable, [{ id: params.id, record }]);
          if (!ok) return error('Router connected but status could not be saved', 500);
          return json({
            status: 'success',
            message: `Live MikroTik RouterOS handshake succeeded: ${details.identity} • RouterOS ${details.version} • ${details.board}.`,
            identity: details.identity,
            version: details.version,
            board: details.board,
            architecture: details.architecture,
            apiPort: details.apiPort,
            apiTransport: details.apiTransport,
            capabilities,
          });
        } catch (connectionError) {
          const message = connectionError instanceof Error ? connectionError.message : 'RouterOS connection failed.';
          await db.update(routersTable, [{ id: params.id, record: { ...existing, integration, connectionType, capabilities, status: 'offline', lastCheckedAt: Date.now() } }]);
          return json({
            status: 'failed',
            code: 'hardware_handshake_failed',
            message: `MikroTik RouterOS handshake failed: ${message}`,
            capabilities,
          }, 502);
        }
      }

      const record = { ...existing, integration, connectionType, capabilities, status: 'configured', lastCheckedAt: Date.now() };
      const [ok] = await db.update(routersTable, [{ id: params.id, record }]);
      if (!ok) return error('Unable to update router integration status', 500);
      return json({
        status: 'success',
        message: `${integration} registration validated. Live hardware communication for this vendor will be added through its adapter in a later step.`,
        capabilities,
      });
    },
  ],
  'PATCH /api/routers/:id': [
    async ({ params, body }) => {
      const value = body as Partial<RouterRecord>;
      if (!value.name?.trim() || !value.vendor?.trim() || !value.host?.trim() || !value.location?.trim()) return error('Name, vendor, host and location are required', 400);
      const [existing] = await db.get<RouterRecord>(routersTable, [params.id]);
      if (!existing) return error('Router not found', 404);
      const apiPort = Number(value.apiPort);
      const normalizedMac = value.macAddress ? normalizeMac(value.macAddress) : existing.macAddress || '';
      if (value.macAddress && !normalizedMac) return error('Enter a valid router MAC address.',400);
      if (value.vendor.trim().toLowerCase().includes('mikrotik') && !normalizedMac) return error('RouterOS/MikroTik routers require the hardware MAC address.',400);
      const record = { ...existing, name: value.name.trim(), vendor: value.vendor.trim(), macAddress: normalizedMac || undefined, manufacturerModel: value.manufacturerModel?.trim() || existing.manufacturerModel, boardName: existing.boardName, host: value.host.trim(), location: value.location.trim(), apiPort: Number.isInteger(apiPort) && apiPort > 0 && apiPort <= 65535 ? apiPort : existing.apiPort, apiTransport: value.apiTransport === 'tls' ? 'tls' : value.apiTransport === 'tcp' ? 'tcp' : existing.apiTransport, status: value.status?.trim() || existing.status, notes: value.notes?.trim() ?? existing.notes ?? '', integration: existing.integration, connectionType: existing.connectionType, capabilities: existing.capabilities, lastCheckedAt: existing.lastCheckedAt };
      const [ok] = await db.update(routersTable, [{ id: params.id, record }]);
      return ok ? json({ ok: true }) : error('Unable to update router', 500);
    },
  ],
  'POST /api/routers': [
    async ({ body }) => {
      const value = body as Partial<RouterRecord>;
      if (!value.name?.trim() || !value.vendor?.trim() || !value.host?.trim() || !value.location?.trim()) {
        return error('Name, vendor, host and location are required', 400);
      }
      const vendor = value.vendor.trim();
      const macAddress = value.macAddress ? normalizeMac(value.macAddress) : '';
      if (value.macAddress && !macAddress) return error('Enter a valid router MAC address.',400);
      if (vendor.toLowerCase().includes('mikrotik') && !macAddress) return error('RouterOS/MikroTik routers require the hardware MAC address.',400);
      const integration = vendor.toLowerCase().includes('mikrotik') ? 'MikroTik adapter' : vendor.toLowerCase().includes('ubiquiti') ? 'Ubiquiti adapter' : vendor.toLowerCase().includes('openwrt') ? 'OpenWrt gateway adapter' : vendor.toLowerCase().includes('cisco') ? 'Cisco adapter' : vendor.toLowerCase().includes('tp-link') || vendor.toLowerCase().includes('omada') ? 'TP-Link Omada adapter' : 'Generic RADIUS / Gateway adapter';
      const [id] = await db.add(routersTable, [{
        name: value.name.trim(),
        vendor,
        macAddress: macAddress || undefined,
        host: value.host.trim(),
        location: value.location.trim(),
        apiPort: Number.isInteger(Number(value.apiPort)) && Number(value.apiPort) > 0 && Number(value.apiPort) <= 65535 ? Number(value.apiPort) : (vendor.toLowerCase().includes('mikrotik') ? 8728 : undefined),
        apiTransport: value.apiTransport === 'tls' ? 'tls' : 'tcp',
        status: 'configured',
        notes: value.notes?.trim() || '',
        integration,
        connectionType: 'Not tested',
        capabilities: [],
        createdAt: Date.now(),
      }]);
      if (!id) return error('Unable to add router', 500);
      return json({ id });
    },
  ],

  'GET /api/sessions': [
    async () => json({ items: (await listSessions()).map(presentSession) }),
  ],
  'POST /api/sessions/:id/authorize': [
    async ({ params, body }) => {
      const value = body as { deviceMac?: string; ipAddress?: string; routerId?: string; gatewayId?: string };
      const [existing] = await db.get<SessionRecord>(sessionsTable, [params.id]);
      if (!existing) return error('Session not found', 404);
      if (existing.expiresAt <= Date.now()) {
        const record = { ...existing, status: 'expired', accessState: 'expired' as const, revokedAt: Date.now() };
        await db.update(sessionsTable, [{ id: params.id, record }]);
        await queueGatewayCommand(existing.gatewayId || value.gatewayId, 'disconnect_client', { sessionId: params.id, deviceMac: existing.deviceMac || value.deviceMac, ipAddress: existing.ipAddress || value.ipAddress, reason: 'package_expired' });
        await notifySessions();
        return error('Session has expired and cannot be authorized', 409);
      }
      const now = Date.now();
      const packageRecord = existing.packageId ? await packageById(existing.packageId) : undefined;
      if (!packageRecord) return error('The package linked to this session no longer exists', 409);
      const routerId = value.routerId || existing.routerId;
      const gatewayId = value.gatewayId || existing.gatewayId;
      const deviceMac = value.deviceMac?.trim() || existing.deviceMac || '';
      const ipAddress = value.ipAddress?.trim() || existing.ipAddress || '';
      let bandwidthApplied = false;
      if (routerId) {
        const [routerRecord] = await db.get<RouterRecord>(routersTable, [routerId]);
        if (!routerRecord) return error('Selected router not found', 404);
        if (routerRecord.vendor.toLowerCase().includes('mikrotik')) {
          const prefix = routerSecretPrefix(routerId);
          const usernameName = `${prefix}_API_USERNAME`;
          const passwordName = `${prefix}_API_PASSWORD`;
          const names = await secrets.listSecretNames();
          if (!names.includes(usernameName) || !names.includes(passwordName)) return error('MikroTik credentials are not configured for the selected router', 409);
          try { await applyMikrotikBandwidth(routerRecord, await secrets.readSecret(usernameName), await secrets.readSecret(passwordName), params.id, ipAddress, packageRecord.speedMbps); bandwidthApplied = true; }
          catch (connectionError) { return error(`Bandwidth enforcement failed: ${connectionError instanceof Error ? connectionError.message : 'Unable to apply bandwidth policy.'}`, 502); }
        } else if (!gatewayId) return error('This router requires a Gateway Agent for bandwidth enforcement.', 409);
      } else if (!gatewayId) return error('Select a router or assign a Gateway Agent before authorizing this session.', 409);
      let accessApplied = false;
      if (routerId && deviceMac) {
        const [routerRecord] = await db.get<RouterRecord>(routersTable, [routerId]);
        if (routerRecord?.vendor.toLowerCase().includes('mikrotik')) {
          const prefix = routerSecretPrefix(routerId); const names = await secrets.listSecretNames();
          const usernameName = prefix + '_API_USERNAME'; const passwordName = prefix + '_API_PASSWORD';
          if (names.includes(usernameName) && names.includes(passwordName)) {
            try { await authorizeMikrotikHotspotClient(routerRecord, await secrets.readSecret(usernameName), await secrets.readSecret(passwordName), params.id, deviceMac, ipAddress); accessApplied = true; }
            catch (e) { return error('HotSpot authorization failed: ' + (e instanceof Error ? e.message : 'Unable to authorize client.'), 502); }
          }
        }
      }
      const record = { ...existing, status: 'online', accessState: 'authorized' as const, authorizedAt: now, deviceMac, ipAddress, routerId, gatewayId, bandwidthApplied, accessApplied, bandwidthProfile: { speedMbps: packageRecord.speedMbps, dataLimitMb: packageRecord.dataLimitMb } };
      const [ok] = await db.update(sessionsTable, [{ id: params.id, record }]);
      if (!ok) return error('Unable to authorize session', 500);
      if (record.gatewayId && !bandwidthApplied) await queueGatewayCommand(record.gatewayId, 'set_bandwidth', { sessionId: params.id, customerId: record.customerId, deviceMac: record.deviceMac, ipAddress: record.ipAddress, speedMbps: packageRecord.speedMbps, dataLimitMb: packageRecord.dataLimitMb });
      await queueGatewayCommand(record.gatewayId, 'authorize_client', { sessionId: params.id, customerId: record.customerId, deviceMac: record.deviceMac, ipAddress: record.ipAddress, expiresAt: record.expiresAt, packageId: record.packageId, speedMbps: packageRecord.speedMbps, dataLimitMb: packageRecord.dataLimitMb });
      await notifySessions();
      return json({ ok: true, accessState: 'authorized', expiresAt: record.expiresAt });
    },
  ],
  'POST /api/sessions/:id/disconnect': [
    async ({ params, body }) => {
      const value = body as { reason?: string };
      const [existing] = await db.get<SessionRecord>(sessionsTable, [params.id]);
      if (!existing) return error('Session not found', 404);
      const now = Date.now();
      const expired = existing.expiresAt <= now;
      const record = { ...existing, status: expired ? 'expired' : 'offline', accessState: expired ? 'expired' as const : 'revoked' as const, revokedAt: now };
      const [ok] = await db.update(sessionsTable, [{ id: params.id, record }]);
      if (!ok) return error('Unable to disconnect session', 500);
      await removeAppliedBandwidth({ ...existing, id: params.id });
      if (existing.routerId && existing.deviceMac) {
        const [routerRecord] = await db.get<RouterRecord>(routersTable,[existing.routerId]);
        if (routerRecord?.vendor.toLowerCase().includes('mikrotik')) {
          const prefix=routerSecretPrefix(existing.routerId); const names=await secrets.listSecretNames(); const u=prefix+'_API_USERNAME', p=prefix+'_API_PASSWORD';
          if(names.includes(u)&&names.includes(p)) { try { await removeMikrotikHotspotClient(routerRecord, await secrets.readSecret(u), await secrets.readSecret(p), params.id, existing.deviceMac, existing.ipAddress); } catch {} }
        }
      }
      await queueGatewayCommand(existing.gatewayId, 'remove_bandwidth', { sessionId: params.id, deviceMac: existing.deviceMac, ipAddress: existing.ipAddress });
      await queueGatewayCommand(existing.gatewayId, 'disconnect_client', { sessionId: params.id, deviceMac: existing.deviceMac, ipAddress: existing.ipAddress, reason: value.reason || (expired ? 'package_expired' : 'admin_disconnect') });
      await notifySessions();
      return json({ ok: true, accessState: record.accessState });
    },
  ],
  'POST /api/sessions/:id/heartbeat': [
    async ({ params, body }) => {
      const value = body as { deviceMac?: string; ipAddress?: string; gatewayId?: string };
      const [existing] = await db.get<SessionRecord>(sessionsTable, [params.id]);
      if (!existing) return error('Session not found', 404);
      if (existing.expiresAt <= Date.now()) return error('Session expired', 410);
      const record = { ...existing, deviceMac: value.deviceMac?.trim() || existing.deviceMac, ipAddress: value.ipAddress?.trim() || existing.ipAddress, gatewayId: value.gatewayId || existing.gatewayId };
      const [ok] = await db.update(sessionsTable, [{ id: params.id, record }]);
      return ok ? json({ ok: true, expiresAt: record.expiresAt, accessState: record.accessState || 'authorized' }) : error('Unable to update session heartbeat', 500);
    },
  ],
  'PATCH /api/sessions/:id': [
    async ({ params, body }) => {
      const value = body as Partial<SessionRecord>;
      const [existing] = await db.get<SessionRecord>(sessionsTable, [params.id]);
      if (!existing) return error('Session not found', 404);
      const record = { ...existing, deviceMac: value.deviceMac?.trim() ?? existing.deviceMac ?? '', ipAddress: value.ipAddress?.trim() ?? existing.ipAddress ?? '', status: value.status?.trim() || existing.status };
      const [ok] = await db.update(sessionsTable, [{ id: params.id, record }]);
      if (!ok) return error('Unable to update session', 500);
      await notifySessions();
      return json({ ok: true });
    },
  ],
  'POST /api/sessions': [
    async ({ body }) => {
      const value = body as {
        customerId?: string;
        customerName?: string;
        packageId?: string;
        deviceMac?: string;
        ipAddress?: string;
      };
      let customerName = value.customerName?.trim() || '';
      if (value.customerId) {
        const [customer] = await db.get<CustomerRecord>(customersTable, [value.customerId]);
        if (!customer) return error('Customer not found', 404);
        customerName = customer.name;
      }
      if (!customerName || !value.packageId) {
        return error('Customer and package are required', 400);
      }
      const pkg = await packageById(value.packageId);
      if (!pkg) return error('Package not found', 404);
      const purchasedAt = Date.now();
      const expiresAt = purchasedAt + pkg.durationMinutes * 60000;
      const [id] = await db.add(sessionsTable, [{
        customerId: value.customerId,
        customerName,
        packageId: value.packageId,
        planName: pkg.name,
        status: 'online',
        accessState: 'authorized',
        purchasedAt,
        expiresAt,
        deviceMac: value.deviceMac?.trim() || '',
        ipAddress: value.ipAddress?.trim() || '',
      }]);
      if (!id) return error('Unable to create session', 500);
      await notifySessions();
      return json({ id, expiresAt });
    },
  ],

  'GET /api/vouchers': [
    async () => json({
      items: (await db.list<VoucherRecord>(vouchersTable, { limit: 200 })).items.map(({ codeHash, ...voucher }) => voucher),
    }),
  ],
  'POST /api/vouchers/generate': [
    async ({ body }) => {
      const value = body as { packageId?: string; quantity?: number; expiryDays?: number };
      const [pkg] = await db.get<PackageRecord>(packagesTable, [String(value.packageId || '')]);
      if (!pkg || pkg.status !== 'active') return error('Select an active package.', 400);
      const quantity = Math.max(1, Math.min(100, Math.floor(Number(value.quantity) || 0)));
      const expiryDays = Number.isFinite(value.expiryDays) && Number(value.expiryDays) > 0 ? Math.min(3650, Math.floor(Number(value.expiryDays))) : undefined;
      const createdAt = Date.now();
      const expiresAt = expiryDays ? createdAt + expiryDays * 86400000 : undefined;
      const records: Array<Record<string, unknown>> = [];
      const codes: string[] = [];
      const seen = new Set<string>();
      while (codes.length < quantity) {
        const code = generateVoucherCode();
        const hash = hashVoucherCode(code);
        if (seen.has(hash)) continue;
        seen.add(hash);
        codes.push(code);
        records.push({ packageId: String(value.packageId), packageName: pkg.name, codeHash: hash, codeHint: code.slice(0, 5) + '-*****', status: 'active', createdAt, expiresAt });
      }
      const ids = await db.add(vouchersTable, records);
      if (ids.some(id => !id)) return error('Unable to create the complete voucher batch.', 500);
      return json({ codes, package: { id: String(value.packageId), name: pkg.name, durationMinutes: pkg.durationMinutes, speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb }, expiresAt });
    },
  ],
  'POST /api/vouchers/redeem': [
    async ({ body }) => {
      const value = body as { code?: string; contextToken?: string; targetDeviceMac?: string };
      const code = normalizeVoucherCode(value.code || '');
      if (code.length !== 10) return error('Enter a valid 10-character voucher code.', 400);
      if (!value.contextToken?.trim()) return error('A secure captive portal context is required.', 400);
      const context = await resolveDeviceContext(value.contextToken.trim());
      if (!context) return error('The captive portal context is invalid or expired. Reconnect to Wi-Fi and open the portal again.', 410);
      const requestedTargetMac = value.targetDeviceMac?.trim() || context.deviceMac || '';
      const normalizedTargetMac = normalizeMac(requestedTargetMac);
      if (!normalizedTargetMac) return error('A valid target device MAC address is required.', 400);
      if (context.deviceMac && normalizeMac(context.deviceMac) === normalizedTargetMac && value.targetDeviceMac) return error('The target device MAC must be different from the device currently opening the captive portal.', 400);
      const activeTarget = await activeSessionForDevice({ deviceMac: normalizedTargetMac });
      if (activeTarget) return error('That device already has an active hotspot session.', 409);
      const [voucher] = await db.get<VoucherRecord>(vouchersTable, [hashVoucherCode(code)]);
      if (!voucher) return error('Invalid voucher code.', 401);
      if (voucher.status !== 'active') return error('This voucher has already been used or disabled.', 409);
      if (voucher.expiresAt && voucher.expiresAt <= Date.now()) return error('This voucher has expired.', 410);
      const [pkg] = await db.get<PackageRecord>(packagesTable, [voucher.packageId]);
      if (!pkg || pkg.status !== 'active') return error('The package attached to this voucher is no longer available.', 409);
      const purchasedAt = Date.now();
      const expiresAt = purchasedAt + pkg.durationMinutes * 60000;
      const [sessionId] = await db.add(sessionsTable, [{ customerName: 'Voucher Customer', packageId: voucher.packageId, planName: pkg.name, status: 'online', accessState: 'authorized', purchasedAt, expiresAt, deviceMac: normalizedTargetMac, ipAddress: context.ipAddress || '', routerId: context.routerId, gatewayId: context.gatewayId, bandwidthApplied: false, bandwidthProfile: { speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb } }]);
      if (!sessionId) return error('Unable to activate voucher session.', 500);
      let bandwidthApplied = false;
      if (context.routerId && context.ipAddress) {
        const [routerRecord] = await db.get<RouterRecord>(routersTable, [context.routerId]);
        if (routerRecord?.vendor.toLowerCase().includes('mikrotik')) {
          const prefix = routerSecretPrefix(context.routerId);
          const names = await secrets.listSecretNames();
          const u = prefix + '_API_USERNAME';
          const p = prefix + '_API_PASSWORD';
          if (names.includes(u) && names.includes(p)) {
            try {
              const username = await secrets.readSecret(u);
              const password = await secrets.readSecret(p);
              await applyMikrotikBandwidth(routerRecord, username, password, sessionId, context.ipAddress, pkg.speedMbps);
              await authorizeMikrotikHotspotClient(routerRecord, username, password, sessionId, normalizedTargetMac, context.ipAddress);
              bandwidthApplied = true;
            } catch (enforcementError) {
              console.warn('Voucher MikroTik enforcement failed:', enforcementError);
            }
          }
        }
      }
      if (context.gatewayId) {
        await queueGatewayCommand(context.gatewayId, 'set_bandwidth', { sessionId, deviceMac: normalizedTargetMac, ipAddress: context.ipAddress, speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb });
        await queueGatewayCommand(context.gatewayId, 'authorize_client', { sessionId, deviceMac: normalizedTargetMac, ipAddress: context.ipAddress, expiresAt, packageId: voucher.packageId, speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb });
        bandwidthApplied = true;
      }
      if (bandwidthApplied) await db.update(sessionsTable, [{ id: sessionId, record: { customerName: 'Voucher Customer', packageId: voucher.packageId, planName: pkg.name, status: 'online', accessState: 'authorized', purchasedAt, expiresAt, deviceMac: normalizedTargetMac, ipAddress: context.ipAddress || '', routerId: context.routerId, gatewayId: context.gatewayId, bandwidthApplied, bandwidthProfile: { speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb } } }]);
      const [updated] = await db.update(vouchersTable, [{ id: (voucher as VoucherRecord & { id: string }).id, record: { ...voucher, status: 'redeemed', redeemedAt: Date.now(), redeemedDeviceMac: normalizedTargetMac, redeemedSessionId: sessionId } }]);
      if (!updated) return error('The voucher session was created but the voucher could not be marked redeemed.', 500);
      await notifySessions();
      return json({ ok: true, sessionId, expiresAt, packageName: pkg.name, deviceMac: normalizedTargetMac });
    },
  ],

  'GET /api/transactions': [
    async () => json({
      items: (await db.list<TransactionRecord>(transactionsTable, { limit: 100 })).items,
    }),
  ],
  'GET /api/payments/mpesa/status': [async () => json(await mpesaSecretStatus())],
  'GET /api/payments/paystack/status': [async () => json(await paystackSecretStatus())],
  'POST /api/transactions/:id/paystack/initialize': [async ({ params }) => { const [transaction] = await db.get<TransactionRecord>(transactionsTable, [params.id]); if (!transaction) return error('Transaction not found', 404); if (transaction.status === 'paid') return json({ ok: true, status: 'paid', reference: transaction.reference }); const status = await paystackSecretStatus(); if (!status.ready) return error('Paystack live integration is not configured. Add the secure Paystack live keys and callback URL.', 409); try { const result = await initiatePaystackTransaction({ ...transaction, id: params.id }); await db.update(transactionsTable, [{ id: params.id, record: { ...transaction, provider: 'paystack', status: 'pending' } }]); return json({ ok: true, status: 'pending', reference: result.reference || transaction.reference, authorizationUrl: result.authorization_url, accessCode: result.access_code }); } catch (e) { return error(e instanceof Error ? e.message : 'Unable to initialize Paystack.', 502); } }],
  'POST /api/payments/mpesa/callback': [async ({ body }) => {
    const payload = body as { Body?: { stkCallback?: { CheckoutRequestID?: string; ResultCode?: number; ResultDesc?: string; CallbackMetadata?: { Item?: Array<{ Name?: string; Value?: string | number }> } } } };
    const callback = payload.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) return json({ ResultCode: 0, ResultDesc: 'Accepted' });
    const transactions = (await db.list<TransactionRecord>(transactionsTable, { limit: 500 })).items;
    const transaction = transactions.find(item => item.checkoutRequestId === callback.CheckoutRequestID) as (TransactionRecord & { id: string }) | undefined;
    if (!transaction) return json({ ResultCode: 0, ResultDesc: 'Accepted' });
    const items = callback.CallbackMetadata?.Item ?? [];
    const receipt = items.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
    const paid = callback.ResultCode === 0;
    const updated = { ...transaction, status: paid ? 'paid' : 'failed', paidAt: paid ? Date.now() : transaction.paidAt, resultCode: callback.ResultCode, resultDescription: callback.ResultDesc, mpesaReceiptNumber: receipt ? String(receipt) : transaction.mpesaReceiptNumber };
    await db.update(transactionsTable, [{ id: transaction.id, record: updated }]);
    if (paid) {
      const pkg = await packageById(transaction.packageId);
      if (pkg) {
        const existingSessions = (await db.list<SessionRecord>(sessionsTable, { limit: 500 })).items;
        const duplicate = existingSessions.some(session => session.purchasedAt >= (transaction.paidAt ?? 0) && session.customerId === transaction.customerId && session.packageId === transaction.packageId);
        if (!duplicate) {
          const purchasedAt = Date.now();
          const expiresAt = purchasedAt + pkg.durationMinutes * 60000;
          const [sessionId] = await db.add(sessionsTable, [{ customerId: transaction.customerId, customerName: transaction.customerName, packageId: transaction.packageId, planName: pkg.name, status: 'online', accessState: 'authorized', purchasedAt, expiresAt, deviceMac: transaction.deviceMac, ipAddress: transaction.ipAddress, routerId: transaction.routerId, gatewayId: transaction.gatewayId, bandwidthApplied: false, bandwidthProfile: { speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb } }]);
          if (sessionId) {
            let bandwidthApplied = false;
            if (transaction.routerId && transaction.ipAddress) {
              const [routerRecord] = await db.get<RouterRecord>(routersTable, [transaction.routerId]);
              if (routerRecord?.vendor.toLowerCase().includes('mikrotik')) {
                const prefix = routerSecretPrefix(transaction.routerId);
                const names = await secrets.listSecretNames();
                const usernameName = `${prefix}_API_USERNAME`;
                const passwordName = `${prefix}_API_PASSWORD`;
                if (names.includes(usernameName) && names.includes(passwordName)) {
                  try {
                    await applyMikrotikBandwidth(routerRecord, await secrets.readSecret(usernameName), await secrets.readSecret(passwordName), sessionId, transaction.ipAddress, pkg.speedMbps);
                    if (transaction.deviceMac) await authorizeMikrotikHotspotClient(routerRecord, await secrets.readSecret(usernameName), await secrets.readSecret(passwordName), sessionId, transaction.deviceMac, transaction.ipAddress);
                    bandwidthApplied = true;
                  } catch (enforcementError) {
                    console.warn('Payment bandwidth enforcement failed:', enforcementError);
                  }
                }
              }
            }
            if (transaction.gatewayId) {
              await queueGatewayCommand(transaction.gatewayId, 'set_bandwidth', { sessionId, customerId: transaction.customerId, deviceMac: transaction.deviceMac, ipAddress: transaction.ipAddress, speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb });
              await queueGatewayCommand(transaction.gatewayId, 'authorize_client', { sessionId, customerId: transaction.customerId, deviceMac: transaction.deviceMac, ipAddress: transaction.ipAddress, expiresAt, packageId: transaction.packageId, speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb });
              bandwidthApplied = true;
            }
            if (bandwidthApplied) await db.update(sessionsTable, [{ id: sessionId, record: { customerId: transaction.customerId, customerName: transaction.customerName, packageId: transaction.packageId, planName: pkg.name, status: 'online', accessState: 'authorized', purchasedAt, expiresAt, deviceMac: transaction.deviceMac, ipAddress: transaction.ipAddress, routerId: transaction.routerId, gatewayId: transaction.gatewayId, bandwidthApplied, bandwidthProfile: { speedMbps: pkg.speedMbps, dataLimitMb: pkg.dataLimitMb } } }]);
          }
          await notifySessions();
        }
      }
    }
    await notifyEntity('transactions', 'all', { items: (await db.list<TransactionRecord>(transactionsTable, { limit: 100 })).items });
    return json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }],

  'POST /api/purchases': [
    async ({ body }) => {
      const value = body as { customerId?: string; customerName?: string; phone?: string; email?: string; packageId?: string; provider?: string; deviceMac?: string; targetDeviceMac?: string; ipAddress?: string; routerId?: string; gatewayId?: string; contextToken?: string };
      const context = value.contextToken ? await resolveDeviceContext(value.contextToken) : null;
      if (value.contextToken && !context) return error('Captive portal context is invalid or expired. Reconnect to Wi-Fi and open the portal again.',410);
      const captiveRequest = Boolean(value.contextToken && context);
      const requestedTargetMac = value.targetDeviceMac?.trim() || value.deviceMac?.trim() || '';
      const normalizedTargetMac = requestedTargetMac ? normalizeMac(requestedTargetMac) : '';
      if (requestedTargetMac && !normalizedTargetMac) return error('Enter a valid target device MAC address, for example AA:BB:CC:DD:EE:FF.',400);
      if (normalizedTargetMac) {
        const activeTarget = await activeSessionForDevice({ deviceMac: normalizedTargetMac });
        if (activeTarget) return error('That device already has an active hotspot session. Wait until its package expires or its data limit is depleted.',409);
      }
      if (captiveRequest && value.targetDeviceMac && normalizeMac(value.targetDeviceMac) === normalizeMac(context!.deviceMac || '')) return error('The target device MAC must be different from the phone/device currently opening the captive portal.',400);
      if (!value.packageId || (!value.customerId && !value.customerName?.trim() && !captiveRequest)) {
        return error('Package is required. A customer name is not required for captive portal purchases.', 400);
      }
      let customerName = value.customerName?.trim() || (captiveRequest ? 'Hotspot Customer' : '');
      if (value.customerId) {
        const [customer] = await db.get<CustomerRecord>(customersTable, [value.customerId]);
        if (!customer) return error('Customer not found', 404);
        customerName = customer.name;
      }
      const pkg = await packageById(value.packageId);
      if (!pkg) return error('Package not found', 404);
      const reference = `FH-${Date.now().toString(36).toUpperCase()}`;
      const [id] = await db.add(transactionsTable, [{
        customerId: value.customerId,
        customerName,
        packageId: value.packageId,
        packageName: pkg.name,
        amount: pkg.price,
        provider: value.provider || 'mpesa',
        status: 'pending',
        reference,
        phone: value.email?.trim() || (value.customerId ? (await db.get<CustomerRecord>(customersTable, [value.customerId]))[0]?.phone : value.phone?.trim() || undefined),
        deviceMac: captiveRequest ? (normalizedTargetMac || context?.deviceMac) : (value.deviceMac?.trim() || undefined),
        ipAddress: context?.ipAddress || value.ipAddress?.trim() || undefined,
        routerId: context?.routerId || value.routerId?.trim() || undefined,
        gatewayId: context?.gatewayId || value.gatewayId?.trim() || undefined,
        createdAt: Date.now(),
      }]);
      if (!id) return error('Unable to create payment transaction', 500);
      return json({ id, reference, status: 'pending' });
    },
  ],

  'POST /api/transactions/:id/mpesa/stk-push': [async ({ params }) => {
    const [transaction] = await db.get<TransactionRecord>(transactionsTable, [params.id]);
    if (!transaction) return error('Transaction not found', 404);
    if (transaction.status === 'paid') return json({ ok: true, status: 'paid', reference: transaction.reference });
    const status = await mpesaSecretStatus();
    if (!status.ready) return error('M-PESA is not configured. Add the backend Daraja secrets before starting STK Push.', 409);
    const phone = transaction.phone?.trim() || '';
    try {
      const result = await initiateMpesaStk({ ...transaction, id: params.id }, phone);
      const updated = { ...transaction, status: 'pending', checkoutRequestId: result.CheckoutRequestID, merchantRequestId: result.MerchantRequestID, phone };
      await db.update(transactionsTable, [{ id: params.id, record: updated }]);
      return json({ ok: true, status: 'pending', reference: transaction.reference, checkoutRequestId: result.CheckoutRequestID, customerMessage: result.CustomerMessage || 'Check your phone and enter your M-PESA PIN.' });
    } catch (e) { return error(e instanceof Error ? e.message : 'Unable to start M-PESA STK Push.', 502); }
  }],

  'POST /api/transactions/:id/confirm': [
    async ({ params }) => {
      const [transaction] = await db.get<TransactionRecord>(transactionsTable, [params.id]);
      if (!transaction) return error('Transaction not found', 404);
      if (transaction.status === 'paid') return json({ ok: true, status: 'paid' });
      const pkg = await packageById(transaction.packageId);
      if (!pkg) return error('Package no longer exists', 404);
      const purchasedAt = Date.now();
      const expiresAt = purchasedAt + pkg.durationMinutes * 60000;
      const [sessionId] = await db.add(sessionsTable, [{
        customerId: transaction.customerId,
        customerName: transaction.customerName,
        packageId: transaction.packageId,
        planName: pkg.name,
        status: 'online',
        accessState: 'authorized',
        purchasedAt,
        expiresAt,
      }]);
      if (!sessionId) return error('Payment recorded but session activation failed', 500);
      const updated = { ...transaction, status: 'paid', paidAt: purchasedAt, resultDescription: 'Manual confirmation' };
      const [ok] = await db.update(transactionsTable, [{ id: params.id, record: updated }]);
      if (!ok) return error('Session activated but payment update failed', 500);
      await notifySessions();
      await notifyEntity('transactions', 'all', {
        items: (await db.list<TransactionRecord>(transactionsTable, { limit: 100 })).items,
      });
      return json({ ok: true, status: 'paid', sessionId, expiresAt });
    },
  ],


  'GET /api/usage/summary': [
    async () => {
      const items = (await db.list<SessionRecord>(sessionsTable, { limit: 500 })).items;
      const totalDataUsedMb = items.reduce((sum, item) => sum + (item.dataUsedMb ?? 0), 0);
      const limitedSessions = items.filter(item => (item.bandwidthProfile?.dataLimitMb ?? 0) > 0);
      const exhaustedSessions = limitedSessions.filter(item => (item.dataUsedMb ?? 0) >= (item.bandwidthProfile?.dataLimitMb ?? Infinity));
      return json({ totalDataUsedMb, limitedSessions: limitedSessions.length, exhaustedSessions: exhaustedSessions.length, sessions: items.map(item => ({ id: (item as SessionRecord & { id: string }).id, customerName: item.customerName, planName: item.planName, dataUsedMb: item.dataUsedMb ?? 0, dataLimitMb: item.bandwidthProfile?.dataLimitMb, status: item.status })) });
    },
  ],

  'GET /api/onboarding': [
    async () => {
      const [routers, packages, transactions] = await Promise.all([
        db.list<RouterRecord>(routersTable, { limit: 100 }),
        db.list<PackageRecord>(packagesTable, { limit: 100 }),
        db.list<TransactionRecord>(transactionsTable, { limit: 100 }),
      ]);
      return json({
        steps: [
          { id: 'location', label: 'Create hotspot location', done: routers.items.length > 0 },
          { id: 'router', label: 'Register a router', done: routers.items.length > 0 },
          { id: 'packages', label: 'Create your first package', done: packages.items.length > 0 },
          { id: 'payments', label: 'Connect payment provider', done: transactions.items.some(t => t.provider === 'mpesa' && t.status === 'paid') },
          { id: 'test', label: 'Complete a test purchase', done: transactions.items.some(t => t.status === 'paid') },
        ],
      });
    },
  ],

  'POST /api/subscriptions': [
    async ({ body }) => {
      const value = body as Record<string, string>;
      if (!value.entity_type || !value.entity_id || !value.connection_id) {
        return error('entity_type, entity_id, connection_id are required', 400);
      }
      await db.add('entity_subscriptions', [{
        entity_type: value.entity_type,
        entity_id: value.entity_id,
        connection_id: value.connection_id,
        created_at: Date.now(),
      }]);
      return json({ ok: true });
    },
  ],
  'POST /api/subscriptions/remove': [
    async ({ body }) => {
      const value = body as Record<string, string>;
      if (!value.entity_type || !value.entity_id || !value.connection_id) {
        return error('entity_type, entity_id, connection_id are required', 400);
      }
      const items = (
        await db.list<{
          entity_type: string;
          entity_id: string;
          connection_id: string;
        }>('entity_subscriptions', { limit: 1000 })
      ).items;
      const ids = items
        .filter(x => x.entity_type === value.entity_type && x.entity_id === value.entity_id && x.connection_id === value.connection_id)
        .map(x => x.id);
      if (ids.length) await db.delete('entity_subscriptions', ids);
      return json({ ok: true });
    },
  ],
});
