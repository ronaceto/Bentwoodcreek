(function(){
const KEY='bwcDataV3';
const SESSION='bwcSessionV1';
const defaultPin = window.BWC_ADMIN_PIN || '2468';

async function loadSeed(){ const r=await fetch('/app-data.json'); return r.json(); }
async function getData(){ const raw=localStorage.getItem(KEY); if(raw) return JSON.parse(raw); const seed=await loadSeed(); localStorage.setItem(KEY,JSON.stringify(seed)); return seed; }
function saveData(d){ localStorage.setItem(KEY,JSON.stringify(d)); }
function normalizeAssetUrl(path){ if(!path) return ''; const clean=String(path).trim().replace(/\\/g,'/'); if(/^https?:\/\//i.test(clean)||clean.startsWith('/')) return encodeURI(clean); return encodeURI('/'+clean.replace(/^\.\/?/,'').replace(/^\/+/,'')); }

function sanitize(v,max=160){ return String(v||'').trim().replace(/[<>]/g,'').slice(0,max); }
function validateEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'')); }
function uid(prefix){ return `${prefix}-${Date.now()}-${Math.floor(Math.random()*1e4)}`; }
async function sha256(text){ const enc=new TextEncoder().encode(String(text)); const buf=await crypto.subtle.digest('SHA-256',enc); return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''); }

function ensurePortal(d){
  d.portal=d.portal||{};
  d.portal.residents=d.portal.residents||[];
  d.portal.announcements=d.portal.announcements||[];
  d.portal.documents=d.portal.documents||[];
  d.portal.requests=d.portal.requests||[];
  d.portal.rsvps=d.portal.rsvps||[];
  d.portal.auditLogs=d.portal.auditLogs||[];
}
function logAction(d,actorId,action,details){ ensurePortal(d); d.portal.auditLogs.unshift({id:uid('log'),timestamp:new Date().toISOString(),actorId:actorId||'anonymous',action:sanitize(action,60),details:sanitize(details,240)}); d.portal.auditLogs=d.portal.auditLogs.slice(0,1000); }

async function registerResident(payload){
  const d=await getData(); ensurePortal(d);
  const name=sanitize(payload.name,80), email=sanitize(payload.email,120).toLowerCase(), address=sanitize(payload.address,120);
  const password=String(payload.password||'');
  if(!name||!validateEmail(email)||password.length<10) throw new Error('Use a valid email and password (10+ chars).');
  if(d.portal.residents.some(r=>String(r.email).toLowerCase()===email)) throw new Error('Resident already exists.');
  const rec={id:uid('res'),name,email,address,status:'pending',role:'resident',directoryOptIn:false,passwordHash:await sha256(password),createdAt:new Date().toISOString()};
  d.portal.residents.push(rec); logAction(d,rec.id,'resident.registered',email); saveData(d); return rec;
}

async function loginResident(email,password){
  const d=await getData(); ensurePortal(d);
  const target=String(email||'').toLowerCase().trim();
  const hash=await sha256(String(password||''));
  const resident=d.portal.residents.find(r=>String(r.email).toLowerCase()===target && r.passwordHash===hash);
  if(!resident) throw new Error('Invalid credentials.');
  localStorage.setItem(SESSION,JSON.stringify({residentId:resident.id,role:resident.role||'resident',ts:Date.now()}));
  logAction(d,resident.id,'auth.login','Login successful'); saveData(d); return resident;
}
function logout(){ localStorage.removeItem(SESSION); }
async function getSessionResident(){ const s=localStorage.getItem(SESSION); if(!s) return null; const session=JSON.parse(s); const d=await getData(); ensurePortal(d); return d.portal.residents.find(r=>r.id===session.residentId)||null; }
function requireRole(resident,roles){ if(!resident||!roles.includes(resident.role)) throw new Error('Not authorized.'); }

window.BWC={getData,saveData,defaultPin,normalizeAssetUrl,sanitize,validateEmail,uid,ensurePortal,logAction,registerResident,loginResident,getSessionResident,logout,requireRole,sha256};
})();
