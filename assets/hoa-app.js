(function(){
const KEY='bwcDataV2';
const defaultPin = window.BWC_ADMIN_PIN || '2468';
const SESSION='bwcSessionV1';

async function loadSeed(){ const r=await fetch('/app-data.json'); return r.json(); }
async function getData(){ let data=localStorage.getItem(KEY); if(data) return JSON.parse(data); const seed=await loadSeed(); localStorage.setItem(KEY,JSON.stringify(seed)); return seed; }
function saveData(d){ localStorage.setItem(KEY,JSON.stringify(d)); }
function normalizeAssetUrl(path){ if(!path) return ''; const clean=String(path).trim().replace(/\\/g,'/'); if(/^https?:\/\//i.test(clean)||clean.startsWith('/')) return encodeURI(clean); return encodeURI('/'+clean.replace(/^\.\/?/,'').replace(/^\/+/,'')); }
function nowIso(){ return new Date().toISOString(); }
function uid(prefix){ return `${prefix}-${Date.now()}-${Math.floor(Math.random()*1e4)}`; }
function sanitize(v,max=160){ return String(v||'').trim().replace(/[<>]/g,'').slice(0,max); }
function validateEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'')); }

function ensurePortal(d){
  d.portal=d.portal||{};
  d.portal.residents=d.portal.residents||[];
  d.portal.announcements=d.portal.announcements||[];
  d.portal.documents=d.portal.documents||[];
  d.portal.requests=d.portal.requests||[];
  d.portal.rsvps=d.portal.rsvps||[];
  d.portal.auditLogs=d.portal.auditLogs||[];
}
function logAction(d,actorId,action,details){ ensurePortal(d); d.portal.auditLogs.unshift({id:uid('log'),timestamp:nowIso(),actorId:actorId||'anonymous',action:sanitize(action,60),details:sanitize(details,240)}); d.portal.auditLogs=d.portal.auditLogs.slice(0,500); }

async function registerResident(payload){
  const d=await getData(); ensurePortal(d);
  const name=sanitize(payload.name,80),email=sanitize(payload.email,120).toLowerCase(),address=sanitize(payload.address,120),password=sanitize(payload.password,64);
  if(!name||!validateEmail(email)||password.length<8) throw new Error('Invalid registration input.');
  if(d.portal.residents.some(r=>r.email===email)) throw new Error('Resident already exists.');
  const rec={id:uid('res'),name,email,address,password,status:'pending',role:'resident',directoryOptIn:false,createdAt:nowIso()};
  d.portal.residents.push(rec); logAction(d,rec.id,'resident.registered',`Resident ${email} registered`); saveData(d); return rec;
}
async function loginResident(email,password){
  const d=await getData(); ensurePortal(d);
  const resident=d.portal.residents.find(r=>r.email===String(email).toLowerCase().trim()&&r.password===String(password));
  if(!resident) throw new Error('Invalid credentials.');
  localStorage.setItem(SESSION,JSON.stringify({residentId:resident.id,role:resident.role||'resident'}));
  logAction(d,resident.id,'auth.login','Resident login'); saveData(d); return resident;
}
async function getSessionResident(){ const s=localStorage.getItem(SESSION); if(!s) return null; const d=await getData(); const session=JSON.parse(s); return d.portal.residents.find(r=>r.id===session.residentId)||null; }
function logout(){ localStorage.removeItem(SESSION); }

window.BWC={getData,saveData,defaultPin,normalizeAssetUrl,sanitize,validateEmail,registerResident,loginResident,getSessionResident,logout,logAction,ensurePortal,uid};
})();
