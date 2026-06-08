var __bwcRoot = typeof globalThis !== 'undefined' ? globalThis : this;
(function(root){
const memoryStore = {};
const storage = (()=>{ try{ const s=root.localStorage; const t='bwcStorageTest'; s.setItem(t,t); s.removeItem(t); return s; }catch{ return {getItem:k=>memoryStore[k]||null,setItem:(k,v)=>{memoryStore[k]=String(v);},removeItem:k=>{delete memoryStore[k];}}; } })();
const KEY='bwcDataV3';
const SESSION='bwcSessionV1';
const API='/api/hoa-data';
const defaultPin = '2468';

async function loadSeed(){ const r=await fetch('/app-data.json'); return r.json(); }
async function remoteGet(){
  try{
    const r=await fetch(API,{method:'GET',headers:{accept:'application/json'},cache:'no-store'});
    if(!r.ok) return null;
    const payload=await r.json();
    return payload&&payload.ok?payload.data:null;
  }catch{
    return null;
  }
}
async function remoteSave(d){
  try{
    const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'save',data:d})});
    return r.ok;
  }catch{
    return false;
  }
}
async function getData(){
  const seed=await loadSeed();
  const remote=await remoteGet();
  if(remote){
    ensurePortal(remote);
    normalizeResidents(remote);
    storage.setItem(KEY,JSON.stringify(remote));
    return remote;
  }
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
  remoteSave(seed);
  return seed;
}
function saveData(d){ storage.setItem(KEY,JSON.stringify(d)); return remoteSave(d); }
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
  d.portal.forumCategories=d.portal.forumCategories||[
    {id:'general',name:'General Discussion',description:'General resident discussion and questions.'},
    {id:'projects',name:'Projects',description:'Neighborhood project ideas and updates.'},
    {id:'maintenance',name:'Maintenance',description:'Common area maintenance topics.'},
    {id:'social',name:'Social Events',description:'Community gatherings and volunteer opportunities.'}
  ];
  d.portal.forumThreads=d.portal.forumThreads||[];
  d.portal.forumPosts=d.portal.forumPosts||[];
  d.portal.forumSubscriptions=d.portal.forumSubscriptions||[];
  d.portal.newsletters=d.portal.newsletters||[];
  d.portal.polls=d.portal.polls||[];
  d.portal.pollResponses=d.portal.pollResponses||[];
  d.portal.bulletins=d.portal.bulletins||[];
  d.portal.notifications=d.portal.notifications||[];
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
  resident.notificationPreferences=resident.notificationPreferences||{};
  if(resident.notificationPreferences.newsletters===undefined) resident.notificationPreferences.newsletters=true;
  if(resident.notificationPreferences.mentions===undefined) resident.notificationPreferences.mentions=true;
  if(resident.notificationPreferences.forumReplies===undefined) resident.notificationPreferences.forumReplies=true;
  if(resident.notificationPreferences.bulletins===undefined) resident.notificationPreferences.bulletins=true;
  resident.forumCategorySubscriptions=resident.forumCategorySubscriptions||{};
  ['general','projects','maintenance','social'].forEach(category=>{
    if(resident.forumCategorySubscriptions[category]===undefined) resident.forumCategorySubscriptions[category]=true;
  });
  return cleaned;
}
function normalizeResidents(d){ ensurePortal(d); d.portal.residents.forEach(normalizeHouseholdContacts); }
function logAction(d,actorId,action,details){ ensurePortal(d); d.portal.auditLogs.unshift({id:uid('log'),timestamp:new Date().toISOString(),actorId:actorId||'anonymous',action:sanitize(action,60),details:sanitize(details,240)}); d.portal.auditLogs=d.portal.auditLogs.slice(0,1000); }
function confirmAction({title='Confirm action',message='Are you sure?',confirmText='Confirm',cancelText='Cancel',danger=true}={}){
  return new Promise(resolve=>{
    let modal=document.getElementById('bwcConfirmModal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='bwcConfirmModal';
      modal.className='modal';
      modal.innerHTML="<div class='modal-card confirm-card' role='dialog' aria-modal='true' aria-labelledby='bwcConfirmTitle'><h2 id='bwcConfirmTitle'></h2><p id='bwcConfirmMessage'></p><div class='modal-actions'><button id='bwcConfirmYes'></button><button id='bwcConfirmNo' class='secondary'></button></div></div>";
      document.body.appendChild(modal);
    }
    const titleEl=modal.querySelector('#bwcConfirmTitle');
    const messageEl=modal.querySelector('#bwcConfirmMessage');
    const yes=modal.querySelector('#bwcConfirmYes');
    const no=modal.querySelector('#bwcConfirmNo');
    titleEl.textContent=title;
    messageEl.textContent=message;
    yes.textContent=confirmText;
    no.textContent=cancelText;
    yes.className=danger?'danger':'';
    modal.classList.add('open');
    no.focus();
    const close=(answer)=>{
      modal.classList.remove('open');
      yes.onclick=null;
      no.onclick=null;
      modal.onclick=null;
      document.onkeydown=null;
      resolve(answer);
    };
    yes.onclick=()=>close(true);
    no.onclick=()=>close(false);
    modal.onclick=(event)=>{ if(event.target===modal) close(false); };
    document.onkeydown=(event)=>{ if(event.key==='Escape') close(false); };
  });
}
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
  d.portal.residents.push(rec); logAction(d,rec.id,'resident.registered',email); await saveData(d); return rec;
}

async function loginResident(email,password){
  const d=await getData(); ensurePortal(d);
  const target=String(email||'').toLowerCase().trim();
  const hash=await sha256(String(password||''));
  const resident=d.portal.residents.find(r=>String(r.email).toLowerCase()===target && r.passwordHash===hash);
  if(!resident) throw new Error('Invalid credentials.');
  storage.setItem(SESSION,JSON.stringify({residentId:resident.id,role:resident.role||'resident',ts:Date.now()}));
  logAction(d,resident.id,'auth.login','Login successful'); await saveData(d); return resident;
}
function logout(){ storage.removeItem(SESSION); }
async function removeCurrentResident(){
  const resident=await getSessionResident();
  if(!resident) throw new Error('No resident is signed in.');
  const d=await getData();
  removeResidentFromData(d,resident.id,resident.id);
  await saveData(d);
  logout();
  return true;
}
async function getSessionResident(){ const s=storage.getItem(SESSION); if(!s) return null; const session=JSON.parse(s); const d=await getData(); ensurePortal(d); return d.portal.residents.find(r=>r.id===session.residentId)||null; }
function requireRole(resident,roles){ if(!resident||!roles.includes(resident.role)) throw new Error('Not authorized.'); }
async function wireSiteNav(){
  const logoutBtn=document.getElementById('siteTopLogout');
  const userEl=document.getElementById('siteTopUser');
  const siteTop=document.querySelector('.site-top');
  if(siteTop&&!siteTop.querySelector('.site-mobile-nav')){
    const options=[
      ['','Navigate to...'],
      ['/','Home'],
      ['/home/','Home'],
      ['/about/','Our Association'],
      ['/welcome-to-the-neighborhood/','Welcome to the Neighborhood'],
      ['/welcome-new-homeowners/','New Homeowners'],
      ['/upcoming-events/','Upcoming Events'],
      ['/neighborhood-projects/','Neighborhood Projects'],
      ['/neighborhood-map/','Neighborhood Map'],
      ['/quick-reference/','Quick Reference'],
      ['/reminders-alerts/','Reminders and Alerts'],
      ['/safety-security/','Safety and Security'],
      ['/directory/','Resident Directory'],
      ['/contact/','Contacts'],
      ['/resident-portal/','Resident Login']
    ];
    const currentPath=location.pathname.endsWith('/')?location.pathname:`${location.pathname}/`;
    const select=document.createElement('select');
    select.className='site-mobile-nav';
    select.setAttribute('aria-label','Primary navigation');
    const hasCurrentOption=options.some(([value])=>value===currentPath);
    select.innerHTML=options.map(([value,label],index)=>`<option value="${value}" ${index===0?'disabled':''} ${value===currentPath||(!value&&!hasCurrentOption)?'selected':''}>${label}</option>`).join('');
    select.onchange=()=>{ if(select.value) location.href=select.value; };
    siteTop.prepend(select);
  }
  const resident=await getSessionResident();
  if(userEl) userEl.textContent=resident?`${resident.name} (${resident.role||'resident'})`:'';
  if(logoutBtn){
    logoutBtn.style.display=resident?'inline-flex':'none';
    logoutBtn.onclick=()=>{ logout(); location.href='/resident-portal/'; };
  }
}

root.BWC={getData,saveData,defaultPin,normalizeAssetUrl,sanitize,validateEmail,uid,ensurePortal,normalizeHouseholdContacts,normalizeResidents,logAction,confirmAction,removeResidentFromData,removeCurrentResident,registerResident,loginResident,getSessionResident,logout,requireRole,sha256,wireSiteNav};
})(__bwcRoot);
