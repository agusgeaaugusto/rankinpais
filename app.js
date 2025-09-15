/* App v3.6: realtime robust + PIN + -1 */
const TEAMS = [
  { id: "jpn", country: "Japón", continent: "Asia", monitors: "Rossana - Norma", color: "#0b0b0b", jersey: "Negro", flag: "flags/jp.svg" },
  { id: "aus", country: "Australia", continent: "Oceanía", monitors: "Camila", color: "#0b77c5", jersey: "Azul con detalles", flag: "flags/au.svg" },
  { id: "ita", country: "Italia", continent: "Europa", monitors: "Evelyn", color: "#f3f4f6", jersey: "Blanco con detalles pintados", flag: "flags/it.svg" },
  { id: "nzl", country: "Nueva Zelanda", continent: "Oceanía", monitors: "Mariela A.", color: "#d90429", jersey: "Rojo con detalles", flag: "flags/nz.svg" },
  { id: "usa", country: "Estados Unidos", continent: "América", monitors: "Derlis", color: "#0f172a", jersey: "Remeras NBA", flag: "flags/us.svg" },
  { id: "egy", country: "Egipto", continent: "África", monitors: "Germán - Crysthian", color: "#ffffff", jersey: "Blanco c/detalles negro y rojo", flag: "flags/eg.svg" },
  { id: "fra", country: "Francia", continent: "Europa", monitors: "Ana - Ramona", color: "#1d4ed8", jersey: "Francia/azul/albirroja", flag: "flags/fr.svg" },
  { id: "lbn", country: "Líbano", continent: "Asia", monitors: "Gladys - Marisa", color: "#dc2626", jersey: "Rojo", flag: "flags/lb.svg" },
  { id: "mar", country: "Marruecos", continent: "África", monitors: "Magnolia - Carolina", color: "#047857", jersey: "Verde", flag: "flags/ma.svg" },
  { id: "bra", country: "Brasil", continent: "América", monitors: "Nelly - José", color: "#f4d03f", jersey: "Remera de Brasil", flag: "flags/br.svg" }
];

const DARK_TEXT = "#0f172a"; const LIGHT_TEXT = "#f8fafc";
function getCompetitionId(){ const h=(location.hash||"").replace(/^#/,"").trim(); return h||"principal"; }
function storageKey(){ return "rankingAppV3_6:"+getCompetitionId(); }

let state = { points:{}, history:[], meta:{} };
function ensureDefaults(){ TEAMS.forEach(t=>{ if(typeof state.points[t.id]!=="number") state.points[t.id]=0; }); if(!Array.isArray(state.history)) state.history=[]; if(!state.meta||typeof state.meta!=="object") state.meta={}; }
function loadLocal(){ try{const raw=localStorage.getItem(storageKey()); if(raw) state=JSON.parse(raw);}catch(e){} finally{ ensureDefaults(); } }
function saveLocal(){ try{ localStorage.setItem(storageKey(), JSON.stringify(state)); }catch(e){} }

// Firebase
let db=null, syncEnabled=false;
function initFirebaseIfEnabled(){
  if (!window.FIREBASE_ENABLED) return;
  try {
    if (firebase.apps && firebase.apps.length) { firebase.app(); }
    else { firebase.initializeApp(FIREBASE_CONFIG); }
    db = firebase.database();
    syncEnabled = true;
    const path = `competitions/${getCompetitionId()}`;
    const ref  = db.ref(path);

    db.ref(".info/connected").on("value", s => {
      const ok = !!s.val();
      const el = document.getElementById("rtStatus");
      if (el) el.textContent = ok ? "Conectado a Firebase" : "Desconectado";
    });

    ref.once("value").then(snap => {
      const data = snap.val();
      if (data && data.points) {
        state = Object.assign({ points:{}, history:[], meta:{} }, data);
        ensureDefaults(); saveLocal(); renderAll();
      } else {
        ensureDefaults(); ref.set(state).catch(console.error);
      }
    }).catch(console.error);

    ref.on("value", snap => {
      const data = snap.val();
      if (data && data.points) {
        state = Object.assign({ points:{}, history:[], meta:{} }, data);
        ensureDefaults(); saveLocal(); renderAll();
      }
    });

  } catch (e) {
    console.error("Firebase init error:", e);
    syncEnabled = false;
    const el = document.getElementById("rtStatus");
    if (el) el.textContent = "Local";
  }
}
function pushRemote(){ if(!syncEnabled||!db) return; const path=`competitions/${getCompetitionId()}`; db.ref(path).set(state).catch(console.error); }
function forceSync(){ try { pushRemote(); alert("Sincronizado con Firebase."); } catch(e){ alert("No se pudo sincronizar."); } }

// Helpers
function contrastColor(bg){ const c=(bg||"#fff").replace("#",""); const r=parseInt(c.substr(0,2),16)/255, g=parseInt(c.substr(2,2),16)/255, b=parseInt(c.substr(4,2),16)/255; const l=0.2126*r+0.7152*g+0.0722*b; return l>0.6?DARK_TEXT:LIGHT_TEXT; }
function teamData(id){ const base=TEAMS.find(t=>t.id===id); const o=state.meta[id]||{}; return Object.assign({},base,o); }

// Cards
function renderCards(){
  const grid=document.getElementById("teamsGrid"); if(!grid) return; grid.innerHTML="";
  TEAMS.forEach(t0=>{
    const t=teamData(t0.id); const bg=t.color&&t.color.startsWith("#")?t.color:"#e2e8f0"; const textColor=contrastColor(bg);
    const wrap=document.createElement("div"); wrap.className="team-card border rounded-2xl shadow bg-white overflow-hidden";
    wrap.innerHTML=`
      <div class="p-4" style="background:linear-gradient(135deg, ${bg}, ${bg}99); color:${textColor}">
        <div class="flex items-center gap-3">
          <img src="${t.flag}" alt="${t.country}" class="card-flag">
          <div class="flex-1">
            <div class="text-xs opacity-90">${t.continent}</div>
            <div class="text-lg font-semibold leading-tight">${t.country}</div>
            <div class="text-xs opacity-90">${t.monitors}</div>
          </div>
          <span class="text-xl font-bold">${state.points[t.id]??0}</span>
        </div>
        <div class="mt-1 text-xs">${t.jersey}</div>
      </div>
      <div class="p-3">
        <div class="flex items-center gap-2">
          <button data-delta="-1" data-team="${t.id}" class="px-3 py-2 rounded-xl bg-rose-600 text-white text-sm hover:bg-rose-700">-1</button>
          <button data-delta="1" data-team="${t.id}" class="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800">+1</button>
          <button data-delta="5" data-team="${t.id}" class="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800">+5</button>
          <button data-delta="10" data-team="${t.id}" class="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800">+10</button>
        </div>
      </div>`;
    grid.appendChild(wrap);
  });
  grid.querySelectorAll("button[data-delta]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id=btn.getAttribute("data-team"); const delta=parseInt(btn.getAttribute("data-delta"),10);
      applyPoints(id, delta, (delta>=0?"+":"")+delta);
    });
  });
}

// Ranking
function computeRanking(){ return [...TEAMS].map(t=>({id:t.id,country:teamData(t.id).country,points:state.points[t.id]||0})).sort((a,b)=>b.points-a.points); }
function renderRanking(){
  const tb=document.getElementById("rankingBody"); if(!tb) return; tb.innerHTML="";
  computeRanking().forEach((row,idx)=>{
    const t=teamData(row.id);
    tb.insertAdjacentHTML("beforeend",`
      <tr class="border-t">
        <td class="py-2 pr-3">${idx+1}</td>
        <td class="py-2 pr-3"><div class="flex items-center gap-2"><img src="${t.flag}" alt="${t.country}" class="flag"><span>${t.country}</span></div></td>
        <td class="py-2 text-right font-semibold">${row.points}</td>
      </tr>`);
  });
}

// Chart.js
let chart=null;
function renderChart(){
  const canvas=document.getElementById("rankChart"); if(!canvas) return;
  const ctx=canvas.getContext("2d"); const data=computeRanking(); const labels=data.map(d=>d.country); const values=data.map(d=>d.points);
  if(chart) chart.destroy();
  chart = new Chart(ctx,{type:'bar', data:{labels, datasets:[{label:'Puntos', data: values}]}, options:{responsive:true, plugins:{legend:{display:false}}}});
}
function exportChartImage(){
  const canvas=document.getElementById("rankChart"); if(!canvas){ alert("No hay gráfico para exportar."); return; }
  if(!chart){ renderChart(); }
  try{ const url=canvas.toDataURL("image/png"); const a=document.createElement("a"); a.href=url; a.download=`ranking-${getCompetitionId()}.png`; a.click(); }
  catch(e){ alert("No se pudo exportar la imagen."); console.error(e); }
}

// Votación
function renderVoteGrid(){
  const grid=document.getElementById("voteGrid"); if(!grid) return; grid.innerHTML="";
  TEAMS.forEach(t0=>{
    const t=teamData(t0.id); const bg=t.color&&t.color.startsWith("#")?t.color:"#e2e8f0"; const textColor=contrastColor(bg);
    const card=document.createElement("button"); card.className="border rounded-2xl shadow bg-white overflow-hidden hover:shadow-lg transition";
    card.innerHTML=`
      <div class="p-4" style="background:linear-gradient(135deg, ${bg}, ${bg}99); color:${textColor}">
        <div class="flex items-center gap-2">
          <img src="${t.flag}" class="card-flag" alt="${t.country}">
          <div class="font-semibold">${t.country}</div>
          <span class="ml-auto text-sm">Puntos: <b>${state.points[t.id]||0}</b></span>
        </div>
      </div>
      <div class="p-3 text-center">
        <span class="inline-block px-3 py-2 rounded-xl bg-slate-900 text-white text-sm">+1 Voto</span>
      </div>`;
    card.addEventListener("click", ()=>{ if(isUnlocked()) applyPoints(t.id,1,"Votación"); else alert("Modo solo lectura. Desbloqueá con PIN."); });
    grid.appendChild(card);
  });
}

// Ops
function applyPoints(teamId, delta, reason){ if(!isUnlocked()) { alert("Modo solo lectura. Desbloqueá con PIN."); return; }
  state.points[teamId]=(state.points[teamId]||0)+delta; if(state.points[teamId]<0) state.points[teamId]=0;
  state.history.push({ts:Date.now(),teamId,delta,reason}); saveLocal(); pushRemote(); renderAll();
}
function applyBulk(delta){ if(!isUnlocked()) { alert("Modo solo lectura. Desbloqueá con PIN."); return; }
  TEAMS.forEach(t=>{ state.points[t.id]=(state.points[t.id]||0)+delta; if(state.points[t.id]<0) state.points[t.id]=0; });
  state.history.push({ts:Date.now(),teamId:"*",delta,reason:"Aplicación masiva"}); saveLocal(); pushRemote(); renderAll();
}
function resetAll(){ if(!isUnlocked()) { alert("Modo solo lectura. Desbloqueá con PIN."); return; }
  if(!confirm("¿Seguro que deseas reiniciar los puntajes de esta competencia?")) return;
  state.points={}; state.history=[]; TEAMS.forEach(t=>state.points[t.id]=0); saveLocal(); pushRemote(); renderAll();
}

// Config modal
function openConfigModal(){ if(!isUnlocked()){ alert("Modo solo lectura. Desbloqueá con PIN."); return; }
  const modal=document.getElementById("configModal"); const list=document.getElementById("configList"); if(!modal||!list) return; list.innerHTML="";
  TEAMS.forEach(t=>{
    const m=state.meta[t.id]||{}; const row=document.createElement("div"); row.className="border rounded-xl p-3";
    row.innerHTML=`
      <div class="flex items-center gap-3">
        <img src="${(m.flag||t.flag)}" class="card-flag" alt="${t.country}">
        <div class="font-semibold flex-1">${t.country}</div>
        <span class="text-sm text-slate-500">ID: ${t.id}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <label class="text-sm">Monitores<input data-field="monitors" data-id="${t.id}" value="${(m.monitors||t.monitors)}" class="mt-1 w-full px-3 py-2 border rounded-xl"></label>
        <label class="text-sm">Vestimenta<input data-field="jersey" data-id="${t.id}" value="${(m.jersey||t.jersey)}" class="mt-1 w-full px-3 py-2 border rounded-xl"></label>
        <label class="text-sm">Color HEX<input data-field="color" data-id="${t.id}" value="${(m.color||t.color)}" class="mt-1 w-full px-3 py-2 border rounded-xl" placeholder="#000000"></label>
        <label class="text-sm">Bandera (URL)<input data-field="flag" data-id="${t.id}" value="${(m.flag||t.flag)}" class="mt-1 w-full px-3 py-2 border rounded-xl" placeholder="https://...svg"></label>
      </div>`;
    list.appendChild(row);
  });
  modal.classList.remove("hidden"); modal.classList.add("flex");
}
function closeConfigModal(){ const m=document.getElementById("configModal"); if(!m) return; m.classList.add("hidden"); m.classList.remove("flex"); }
function saveConfigChanges(){ const inputs=document.querySelectorAll("#configList input[data-field]"); inputs.forEach(inp=>{ const id=inp.getAttribute("data-id"); const field=inp.getAttribute("data-field"); state.meta[id]=state.meta[id]||{}; state.meta[id][field]=inp.value; }); saveLocal(); pushRemote(); renderAll(); closeConfigModal(); }
function wireTopbar(){ document.getElementById("openConfig")?.addEventListener("click", openConfigModal); document.getElementById("closeConfig")?.addEventListener("click", closeConfigModal); document.getElementById("configCancel")?.addEventListener("click", closeConfigModal); document.getElementById("configSave")?.addEventListener("click", saveConfigChanges); }

// PIN
const REQUIRED_PIN="1999"; function pinKey(){ return "pinUnlockedV3_6:"+getCompetitionId(); }
function isUnlocked(){ try{ return localStorage.getItem(pinKey())==="1"; }catch(e){ return false; } }
function setUnlocked(v){ try{ localStorage.setItem(pinKey(), v?"1":"0"); }catch(e){} }
function openPinModal(){ const m=document.getElementById("pinModal"); if(!m) return; const input=document.getElementById("pinInput"); document.getElementById("pinMsg").classList.add("hidden"); input.value=""; m.classList.remove("hidden"); m.classList.add("flex"); setTimeout(()=>input?.focus(),10); }
function closePinModal(){ const m=document.getElementById("pinModal"); if(!m) return; m.classList.add("hidden"); m.classList.remove("flex"); }
function confirmPin(){ const v=(document.getElementById("pinInput").value||"").trim(); if(v===REQUIRED_PIN){ setUnlocked(true); applyLockState(); closePinModal(); } else { document.getElementById("pinMsg").classList.remove("hidden"); } }
function applyLockState(){ const locked=!isUnlocked(); document.querySelectorAll('button[data-delta]').forEach(b=>{ b.disabled=locked; b.classList.toggle('opacity-50',locked); b.classList.toggle('cursor-not-allowed',locked); }); document.querySelectorAll('.edit-required').forEach(b=>{ b.disabled=locked; b.classList.toggle('opacity-50',locked); b.classList.toggle('cursor-not-allowed',locked); }); const st=document.getElementById("rtStatus"); if(st) st.textContent = (locked?"Solo lectura":(syncEnabled?"Tiempo real":"Local")); const mob=document.getElementById("mobileUnlock"); if(mob) mob.classList.toggle("hidden", !locked); }
function wirePin(){ document.getElementById("editBtn")?.addEventListener("click", openPinModal); document.getElementById("mobileUnlock")?.addEventListener("click", openPinModal); document.getElementById("pinClose")?.addEventListener("click", closePinModal); document.getElementById("pinCancel")?.addEventListener("click", closePinModal); document.getElementById("pinConfirm")?.addEventListener("click", confirmPin); }
document.addEventListener("input", e=>{ if(e.target && e.target.id==="pinInput"){ e.target.value = e.target.value.replace(/\\D/g,'').slice(0,4); } });

// Bootstrap
function renderAll(){ document.getElementById("compId") && (document.getElementById("compId").textContent=getCompetitionId()); renderCards(); renderRanking(); renderChart(); renderVoteGrid(); applyLockState(); }
function init(){ loadLocal(); renderAll(); initFirebaseIfEnabled(); wireTopbar(); }
function wireGlobalButtons(){ const resetBtn=document.getElementById("resetBtn"); if(resetBtn) resetBtn.addEventListener("click", resetAll); const exportImgBtn=document.getElementById("exportImgBtn"); if(exportImgBtn) exportImgBtn.addEventListener("click", exportChartImage); const forceSyncBtn=document.getElementById("forceSyncBtn"); if(forceSyncBtn) forceSyncBtn.addEventListener("click", forceSync); document.querySelectorAll("[data-bulk]").forEach(b=>b.addEventListener("click",()=>{ const v=parseInt(b.getAttribute("data-bulk"),10)||0; if(v!==0) applyBulk(v); })); }
window.addEventListener("hashchange", ()=>{ loadLocal(); renderAll(); });
document.addEventListener("DOMContentLoaded", ()=>{ init(); wirePin(); wireGlobalButtons(); });
