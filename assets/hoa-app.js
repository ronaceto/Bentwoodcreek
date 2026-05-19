(function(){
const KEY='bwcDataV1';
const defaultPin = window.BWC_ADMIN_PIN || '2468';
async function loadSeed(){ const r=await fetch('/app-data.json'); return r.json(); }
async function getData(){ let data=localStorage.getItem(KEY); if(data) return JSON.parse(data); const seed=await loadSeed(); localStorage.setItem(KEY,JSON.stringify(seed)); return seed; }
function saveData(d){ localStorage.setItem(KEY,JSON.stringify(d)); }
window.BWC={getData,saveData,defaultPin};
})();
