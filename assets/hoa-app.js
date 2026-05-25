var __bwcRoot = typeof globalThis !== 'undefined' ? globalThis : this;
(function(root){
const memoryStore = {};
const storage = (()=>{ try{ const s=root.localStorage; const t='bwcStorageTest'; s.setItem(t,t); s.removeItem(t); return s; }catch{ return {getItem:k=>memoryStore[k]||null,setItem:(k,v)=>{memoryStore[k]=String(v);},removeItem:k=>{delete memoryStore[k];}}; } })();
const KEY='bwcDataV3';
const SESSION='bwcSessionV1';
const defaultPin = '2468';

async function loadSeed(){ const r=await fetch('/app-data.json'); return r.json(); }
async function getData(){
  const seed=await loadSeed();
  const raw=storage.getItem(KEY);
  if(raw){
    let data;
    try{ data=JSON.parse(raw); }
    catch{
      storage.setItem(KEY,JSON.stringify(seed));
      return seed;
    }
    if((data.mapLots||[]).length < (seed.mapLots||[]).length){
      data.mapLots=seed.mapLots||[];
    }else{
      for(const seedLot of seed.mapLots||[]){
        const localLot=(data.mapLots||[]).find(l=>String(l.lot)===String(seedLot.lot)||l.id===seedLot.id);
        if(localLot&&seedLot.zillowUrl&&!localLot.zillowUrl) localLot.zillowUrl=seedLot.zillowUrl;
      }
    }
    ensurePortal(data); ensurePortal(seed);
    normalizeResidents(data);
    data.portal.deletedSeedResidentEmails=data.portal.deletedSeedResidentEmails||[];
    const deletedSeedResidentEmails=new Set(data.portal.deletedSeedResidentEmails.map(email=>String(email).toLowerCase()));
    for(const seedResident of seed.portal.residents||[]){
      if(deletedSeedResidentEmails.has(String(seedResident.email).toLowerCase())) continue;
      const localResident=data.portal.residents.find(r=>String(r.email).toLowerCase()===String(seedResident.email).toLowerCase());
      if(!localResident){
        data.portal.residents.push(seedResident);
      }else if(seedResident.role==='admin'){
        Object.assign(localResident,seedResident);
      }else if(!localResident.lot&&seedResident.lot){
        Object.assign(localResident,seedResident);
      }
    }
    normalizeResidents(data);
    storage.setItem(KEY,JSON.stringify(data));
    return data;
  }
  ensurePortal(seed);
  normalizeResidents(seed);
  storage.setItem(KEY,JSON.stringify(seed));
  return seed;
}
function saveData(d){ storage.setItem(KEY,JSON.stringify(d)); }
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
  d.portal.deletedSeedResidentEmails=d.portal.deletedSeedResidentEmails||[];
}
function normalizeHouseholdContacts(resident){
  const contacts=Array.isArray(resident.householdContacts)?resident.householdContacts:[];
  const cleaned=contacts.map(contact=>({
    name:sanitize(contact.name,120),
    phone:sanitize(contact.phone,40),
    email:sanitize(contact.email,120).toLowerCase()
  })).filter(contact=>contact.name||contact.phone||contact.email);
  if(!cleaned.length&&(resident.name||resident.phone||resident.email)){
    cleaned.push({name:sanitize(resident.name,120),phone:sanitize(resident.phone,40),email:sanitize(resident.email,120).toLowerCase()});
  }
  resident.householdContacts=cleaned;
  return cleaned;
}
function normalizeResidents(d){ ensurePortal(d); d.portal.residents.forEach(normalizeHouseholdContacts); }
function logAction(d,actorId,action,details){ ensurePortal(d); d.portal.auditLogs.unshift({id:uid('log'),timestamp:new Date().toISOString(),actorId:actorId||'anonymous',action:sanitize(action,60),details:sanitize(details,240)}); d.portal.auditLogs=d.portal.auditLogs.slice(0,1000); }
function removeResidentFromData(d,residentId,actorId='system'){
  ensurePortal(d);
  const index=d.portal.residents.findIndex(r=>r.id===residentId);
  if(index<0) return null;
  const resident=d.portal.residents[index];
  if(resident.role==='admin') throw new Error('Admin accounts cannot be removed here.');
  const email=String(resident.email||'').toLowerCase();
  if(email&&!d.portal.deletedSeedResidentEmails.includes(email)) d.portal.deletedSeedResidentEmails.push(email);
  d.portal.residents.splice(index,1);
  logAction(d,actorId,'resident.removed',email||residentId);
  return resident;
}

async function registerResident(payload){
  const d=await getData(); ensurePortal(d);
  const name=sanitize(payload.name,120), email=sanitize(payload.email,120).toLowerCase(), address=sanitize(payload.address,160);
  const phone=sanitize(payload.phone,40), lot=sanitize(payload.lot,20), parcel=sanitize(payload.parcel,40);
  const password=String(payload.password||'');
  if(!name||!validateEmail(email)||password.length<10) throw new Error('Use a valid email and password (10+ chars).');
  if(d.portal.residents.some(r=>String(r.email).toLowerCase()===email)) throw new Error('Resident already exists.');
  const householdContacts=Array.isArray(payload.householdContacts)?payload.householdContacts.map(contact=>({
    name:sanitize(contact.name,120),
    phone:sanitize(contact.phone,40),
    email:sanitize(contact.email,120).toLowerCase()
  })).filter(contact=>contact.name||contact.phone||contact.email):[];
  const rec={id:uid('res'),name,email,phone,address,lot,parcel,status:'pending',role:'resident',directoryOptIn:!!payload.directoryOptIn,householdContacts,passwordHash:await sha256(password),createdAt:new Date().toISOString()};
  normalizeHouseholdContacts(rec);
  d.portal.residents.push(rec); logAction(d,rec.id,'resident.registered',email); saveData(d); return rec;
}

async function loginResident(email,password){
  const d=await getData(); ensurePortal(d);
  const target=String(email||'').toLowerCase().trim();
  const hash=await sha256(String(password||''));
  const resident=d.portal.residents.find(r=>String(r.email).toLowerCase()===target && r.passwordHash===hash);
  if(!resident) throw new Error('Invalid credentials.');
  storage.setItem(SESSION,JSON.stringify({residentId:resident.id,role:resident.role||'resident',ts:Date.now()}));
  logAction(d,resident.id,'auth.login','Login successful'); saveData(d); return resident;
}
function logout(){ storage.removeItem(SESSION); }
async function removeCurrentResident(){
  const resident=await getSessionResident();
  if(!resident) throw new Error('No resident is signed in.');
  const d=await getData();
  removeResidentFromData(d,resident.id,resident.id);
  saveData(d);
  logout();
  return true;
}
async function getSessionResident(){ const s=storage.getItem(SESSION); if(!s) return null; const session=JSON.parse(s); const d=await getData(); ensurePortal(d); return d.portal.residents.find(r=>r.id===session.residentId)||null; }
function requireRole(resident,roles){ if(!resident||!roles.includes(resident.role)) throw new Error('Not authorized.'); }
async function wireSiteNav(){
  const logoutBtn=document.getElementById('siteTopLogout');
  const userEl=document.getElementById('siteTopUser');
  const resident=await getSessionResident();
  if(userEl) userEl.textContent=resident?`${resident.name} (${resident.role||'resident'})`:'';
  if(logoutBtn){
    logoutBtn.style.display=resident?'inline-flex':'none';
    logoutBtn.onclick=()=>{ logout(); location.href='/resident-portal/'; };
  }
}

root.BWC={getData,saveData,defaultPin,normalizeAssetUrl,sanitize,validateEmail,uid,ensurePortal,normalizeHouseholdContacts,normalizeResidents,logAction,removeResidentFromData,removeCurrentResident,registerResident,loginResident,getSessionResident,logout,requireRole,sha256,wireSiteNav};
})(__bwcRoot);
