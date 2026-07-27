/* ============================================================
   Betül Tercih Robotu — ortak çekirdek (common.js)
   Hem index.html hem listeler.html tarafından kullanılır.
   ============================================================ */

/* ---------- İhtimal bantları ---------- */
const BANDS = [
  {id:5, ad:"Çok Yüksek", c:"var(--b1)", s:"var(--b1s)"},
  {id:4, ad:"Yüksek",     c:"var(--b2)", s:"var(--b2s)"},
  {id:3, ad:"Sınırda",    c:"var(--b3)", s:"var(--b3s)"},
  {id:2, ad:"Düşük",      c:"var(--b4)", s:"var(--b4s)"},
  {id:1, ad:"Çok Düşük",  c:"var(--b5)", s:"var(--b5s)"},
  {id:0, ad:"Veri Yok",   c:"var(--b0)", s:"var(--b0s)"},
];
const bandById = id => BANDS.find(b=>b.id===id);

const APPROACHES = {
  son:{ad:"Son Dönem",  ipucu:"En güncel dönemin (2024-4) taban puanını referans alır. Bugünkü rekabete en yakın tahmin."},
  ort:{ad:"Ortalama",   ipucu:"Birimin tüm dönemlerdeki taban puanlarının ortalamasını referans alır. Dengeli bir tahmin."},
  gar:{ad:"Garantici",  ipucu:"Gözlenen en yüksek taban puanı referans alınır. En temkinli/güvenli senaryo — buraya göre yeşilse yerleşme ihtimali güçlüdür."},
  iyi:{ad:"İyimser",    ipucu:"Gözlenen en düşük taban puanı referans alınır. En iyimser senaryo — puanınız düşükse bile şansını gösterir."},
};

function refCutoff(u, approach){
  const s=u.istatistik; if(!s) return null;
  return {son:s.sonEnKucuk, ort:s.ortEnKucuk, gar:s.enYuksekEsik, iyi:s.enDusukEsik}[approach];
}
function bandFor(u, score, approach){
  const ref = refCutoff(u, approach);
  if(ref==null || score==null || isNaN(score)) return {band:bandById(0), ref, margin:null};
  const m = score - ref;
  let id;
  if(m>=3) id=5; else if(m>=1) id=4; else if(m>=-1) id=3; else if(m>=-4) id=2; else id=1;
  return {band:bandById(id), ref, margin:m};
}
const veriYok    = u => !u.istatistik;
const sinirliVeri = u => !!(u.istatistik && u.istatistik.donemSayisi===1);

/* ---------- Biçimlendirme ---------- */
const fmt = n => n==null?"—":Number(n).toLocaleString("tr-TR");
function kfmt(n){
  if(n==null) return "—";
  if(n>=1e6) return (n/1e6).toFixed(1).replace(".",",")+" Mn";
  if(n>=1e4) return Math.round(n/1e3)+" B";
  if(n>=1e3) return (n/1e3).toFixed(1).replace(".",",")+" B";
  return Number(n).toLocaleString("tr-TR");
}
const dec = (n,d=2) => n==null?"—":Number(n).toFixed(d).replace(".",",");
function titleTr(s){
  return String(s).toLocaleLowerCase("tr").replace(/(^|[ \-\/\(])([a-zçğıöşü])/g,(m,p,c)=>p+c.toLocaleUpperCase("tr"));
}
function ilceAd(u){ return u.tip==='ilce' ? titleTr(u.ilce) : "Merkez / İl Müdürlüğü"; }
function unitById(id){ return (window.UNITS||[]).find(u=>u.id===id); }
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

/* ---------- Google Haritalar sorgusu (doğru adresleme) ---------- */
function mapsQuery(u){
  let name;
  if(u.tip==='ilce'){
    name = `${titleTr(u.ilce)} İlçe Tarım ve Orman Müdürlüğü`;
  }else{
    const raw = String(u.ilRaw||"");
    name = /İL TARIM VE ORMAN MÜDÜRLÜĞÜ/.test(raw) ? titleTr(u.ilceLabel) : titleTr(raw);
  }
  return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(name+" "+titleTr(u.il)+" Türkiye");
}

/* ---------- Geçmiş taban puan grafiği (SVG) ---------- */
function historyChartSVG(u, opt={}){
  const g = (u.gecmis||[]).filter(x=>x.enKucuk!=null);
  if(g.length===0) return "";
  const W = opt.w||560, H = opt.h||210;
  const padL=20, padR=20, padT=34, padB=34;
  const iw = W-padL-padR, ih = H-padT-padB;
  const vals = g.map(x=>x.enKucuk);
  const maxV = Math.max(...vals, ...(g.map(x=>x.enBuyuk).filter(v=>v!=null)));
  const minV = Math.min(...vals);
  const lo = Math.floor(minV-2), hi = Math.ceil(maxV+2);
  const span = Math.max(hi-lo,1);
  const x = i => g.length===1 ? padL+iw/2 : padL + iw*i/(g.length-1);
  const y = v => padT + ih*(1-(v-lo)/span);
  let pts = g.map((x_,i)=>`${x(i).toFixed(1)},${y(x_.enKucuk).toFixed(1)}`).join(" ");
  let dots="", labels="", xlabels="";
  g.forEach((x_,i)=>{
    const cx=x(i), cy=y(x_.enKucuk);
    dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="var(--forest2)" stroke="#fff" stroke-width="2"/>`;
    labels += `<text x="${cx.toFixed(1)}" y="${(cy-12).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)" font-family="Space Grotesk,sans-serif">${dec(x_.enKucuk)}</text>`;
    xlabels += `<text x="${cx.toFixed(1)}" y="${(H-12).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--muted)">${x_.donem}</text>`;
  });
  const line = g.length>1 ? `<polyline points="${pts}" fill="none" stroke="var(--forest2)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : "";
  const base = `<line x1="${padL}" y1="${(padT+ih).toFixed(1)}" x2="${(W-padR)}" y2="${(padT+ih).toFixed(1)}" stroke="var(--line)" stroke-width="1"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Geçmiş taban puan grafiği">${base}${line}${dots}${labels}${xlabels}</svg>`;
}

/* ============================================================
   DEPO — sunucu (varsa) + localStorage yedeği ile senkron
   Listeler sunucuda /api/store içinde tutulur; böylece her
   cihazdan aynı listeler görünür. Sunucu yoksa localStorage.
   ============================================================ */
const STORE_KEY = "vhtr_store_v1";
const STORE_API = "/api/store";
let _state=null, _apiOK=false, _saveTimer=null;
function _defaults(){ return {lists:[], score:null}; }
function _fromLocal(){ try{const s=JSON.parse(localStorage.getItem(STORE_KEY)); if(s&&s.lists) return s;}catch(e){} return _defaults(); }
function _toLocal(s){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }catch(e){} }
function _uid(){ return "l"+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function _persist(){
  _toLocal(_state);
  if(_apiOK){
    clearTimeout(_saveTimer);
    _saveTimer=setTimeout(()=>{ fetch(STORE_API,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(_state)}).catch(()=>{}); },250);
  }
}
const Store = {
  async init(){
    try{
      const r=await fetch(STORE_API,{cache:"no-store"});
      if(r.ok){ const j=await r.json(); if(j&&Array.isArray(j.lists)){ _state=j; _apiOK=true; _toLocal(j); return {mode:"server"}; } }
    }catch(e){}
    _state=_fromLocal(); _apiOK=false; return {mode:"local"};
  },
  isServer(){ return _apiOK; },
  lists(){ return _state.lists; },
  getScore(){ return _state.score; },
  setScore(v){ _state.score=v; _persist(); },
  create(name){ const l={id:_uid(), name:(name||"Yeni liste").trim()||"Yeni liste", items:[], createdAt:Date.now()}; _state.lists.push(l); _persist(); return l; },
  rename(id,name){ const l=_state.lists.find(x=>x.id===id); if(l){l.name=(name||l.name).trim()||l.name; _persist();} },
  remove(id){ _state.lists=_state.lists.filter(x=>x.id!==id); _persist(); },
  get(id){ return _state.lists.find(x=>x.id===id); },
  addItem(listId,unitId){ const l=_state.lists.find(x=>x.id===listId); if(l&&!l.items.includes(unitId)){l.items.push(unitId);_persist();} },
  removeItem(listId,unitId){ const l=_state.lists.find(x=>x.id===listId); if(l){l.items=l.items.filter(x=>x!==unitId);_persist();} },
  toggleItem(listId,unitId){ const l=_state.lists.find(x=>x.id===listId); if(!l)return; if(l.items.includes(unitId))l.items=l.items.filter(x=>x!==unitId); else l.items.push(unitId); _persist(); },
  copyItem(toId,unitId){ this.addItem(toId,unitId); },
  moveItem(fromId,toId,unitId){ this.addItem(toId,unitId); this.removeItem(fromId,unitId); },
  reorder(listId,ordered){ const l=_state.lists.find(x=>x.id===listId); if(l){l.items=ordered.filter(id=>l.items.includes(id));_persist();} },
  listsContaining(unitId){ return _state.lists.filter(l=>l.items.includes(unitId)); },
  inAnyList(unitId){ return _state.lists.some(l=>l.items.includes(unitId)); },
  totalSaved(){ const s=new Set(); _state.lists.forEach(l=>l.items.forEach(i=>s.add(i))); return s.size; },
};

/* ============================================================
   PAYLAŞIMLI DETAY MODALI + LİSTE SEÇİCİ
   ============================================================ */
function _ensureOverlays(){
  if(!document.getElementById("ovl")){
    const d=document.createElement("div"); d.className="ovl"; d.id="ovl";
    d.innerHTML='<div class="modal" id="modal" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(d);
    d.addEventListener("click",e=>{ if(e.target===d) closeUnitModal(); });
  }
  if(!document.getElementById("pickerOvl")){
    const d=document.createElement("div"); d.className="ovl picker"; d.id="pickerOvl";
    d.innerHTML='<div class="pickbox" id="pickbox" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(d);
    d.addEventListener("click",e=>{ if(e.target===d) closePicker(); });
  }
  if(!window._escBound){ window._escBound=true; document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ closePicker(); closeUnitModal(); } }); }
}
let _modalUnit=null, _modalScore=null, _modalApproach="son";
function openUnitModal(u, score, approach){
  _ensureOverlays();
  _modalUnit=u; _modalScore=score; _modalApproach=approach||"son";
  const r = score!=null? bandFor(u,score,_modalApproach):{band:bandById(0),ref:null,margin:null};
  const b=r.band, apLbl=APPROACHES[_modalApproach].ad.toLowerCase();
  let bandExp;
  if(b.id===0) bandExp="Bu birim için geçmiş atama puanı verisi yok (bu dönem ilk kez alım yapıyor olabilir). Rekabeti öngörülemez; düşük de olabilir yüksek de.";
  else if(score==null) bandExp="İhtimali görmek için KPSS puanınızı girin.";
  else { const ok=r.margin>=0;
    bandExp=`KPSS puanınız <b>${dec(score)}</b>, bu birimin ${apLbl} taban puanı <b>${dec(r.ref)}</b>. `+
      (ok?`Eşiğin <b>${dec(r.margin)}</b> puan üzerindesiniz — geçmiş verilere göre yerleşme ihtimaliniz güçlü.`
         :`Eşiğin <b>${dec(Math.abs(r.margin))}</b> puan altındasınız — bu birimde rekabet puanınızın üzerinde seyretmiş.`);
  }
  const suf = sinirliVeri(u)? ` <span class="sinirli" style="font-size:12px">/sınırlı veri</span>`:"";
  const rows = u.gecmis.length? u.gecmis.slice().reverse().map(g=>`<tr>
      <td>${g.donem}</td><td>${g.kontenjan??"—"}</td><td class="cut">${g.enKucuk!=null?dec(g.enKucuk):"—"}</td><td>${g.enBuyuk!=null?dec(g.enBuyuk):"—"}</td></tr>`).join("")
    : `<tr><td colspan="4" style="text-align:center;color:var(--muted)">Geçmiş dönem kaydı yok</td></tr>`;
  const chart = u.gecmis.filter(x=>x.enKucuk!=null).length>=2
    ? `<div class="m-sec-t">Geçmiş taban puan seyri</div><div class="chartbox">${historyChartSVG(u)}</div>` : "";
  const inList = Store.inAnyList(u.id);

  const listBtn = u.buYilAcik
    ? `<button class="btn-list${inList?' in':''}" id="mAddList" type="button">
        <svg viewBox="0 0 24 24" fill="${inList?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"/></svg>
        ${inList?'Listelerde':'Listeye ekle'}</button>` : "";
  const cmpBtn = window.ALLOW_COMPARE
    ? `<button class="btn-cmp${(window.inCompare&&window.inCompare(u.id))?' in':''}" id="mCmp" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 7l4 4M4 7h11M16 21l4-4-4-4M20 17H9"/></svg>
        Karşılaştır</button>` : "";

  document.getElementById("modal").innerHTML = `
    <div class="m-head">
      <button class="m-close" onclick="closeUnitModal()" aria-label="Kapat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      <div class="il">${titleTr(u.il)}${u.bolge?" · "+u.bolge:""}</div>
      <h2>${ilceAd(u)}</h2>
      <div class="full">${u.ilRaw}${u.tip==='ilce'? " · "+u.ilceLabel:""}</div>
    </div>
    <div class="m-body">
      <div class="m-band" style="background:${b.s};color:${b.c}">
        <div class="big">${b.id===0?"Veri Yok":b.ad}${suf}</div>
        <div class="exp" style="color:var(--ink2)">${bandExp}</div>
      </div>
      <div class="m-actions">
        ${listBtn}${cmpBtn}
        <a class="btn-map" href="${mapsQuery(u)}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
          Haritada gör</a>
      </div>
      ${u.buYilAcik
        ? `<div class="fact wide open"><div class="k">Bu dönem açılan kontenjan</div><div class="v">${u.buYilKontenjan} kadro</div></div>`
        : `<div class="fact wide closed"><div class="k">Bu dönem</div><div class="v">Kontenjan açılmadı — bu dönem tercih edilemez</div></div>`}
      <div class="m-sec-t">İl / İlçe Bilgileri</div>
      <div class="facts">
        <div class="fact"><div class="k">${u.tip==='ilce'?'İlçe nüfusu':'İl nüfusu'}</div><div class="v">${fmt(u.nufus)}</div></div>
        <div class="fact"><div class="k">İl nüfusu</div><div class="v">${fmt(u.ilNufus)}</div></div>
        <div class="fact"><div class="k">İl merkezine uzaklık</div><div class="v">${u.merkezeKm===0?"Merkez":fmt(u.merkezeKm)+" <small>km</small>"}</div></div>
        <div class="fact"><div class="k">En yakın havalimanı</div><div class="v" style="font-size:15px">${u.havalimani||"—"}${u.havalimaniKm!=null?' <small>· '+u.havalimaniKm+' km</small>':''}</div></div>
      </div>
      <div class="m-sec-t">Geçmiş Atama Puanları</div>
      <table class="hist"><thead><tr><th>Dönem</th><th>Kont.</th><th>En küçük</th><th>En büyük</th></tr></thead><tbody>${rows}</tbody></table>
      ${u.istatistik? `<div class="note">Bu birim <b>${u.istatistik.donemSayisi}</b> dönemde alım yapmış. Taban puanı en düşük <b>${dec(u.istatistik.enDusukEsik)}</b>, en yüksek <b>${dec(u.istatistik.enYuksekEsik)}</b>, ortalama <b>${dec(u.istatistik.ortEnKucuk)}</b>.`+(sinirliVeri(u)?' <span class="sinirli">Yalnızca tek dönem verisi olduğu için tahmin sınırlıdır.</span>':'')+`</div>`:""}
      ${chart}
      ${u.ilKisaBilgi? `<div class="m-sec-t">${titleTr(u.il)} Hakkında</div><div class="kbilgi">${u.ilKisaBilgi}</div>`:""}
    </div>`;
  const la=document.getElementById("mAddList"); if(la) la.addEventListener("click",()=>openPicker(u.id));
  const mc=document.getElementById("mCmp"); if(mc) mc.addEventListener("click",()=>{ if(window.toggleCompare){window.toggleCompare(u.id); openUnitModal(u,score,approach);} });
  document.getElementById("ovl").classList.add("on"); document.body.style.overflow="hidden";
}
function closeUnitModal(){ const o=document.getElementById("ovl"); if(o)o.classList.remove("on"); _modalUnit=null; if(!document.querySelector("#pickerOvl.on")) document.body.style.overflow=""; }

/* ---- liste seçici ---- */
let _pickUnit=null;
function openPicker(unitId){
  _ensureOverlays(); _pickUnit=unitId; renderPicker();
  document.getElementById("pickerOvl").classList.add("on"); document.body.style.overflow="hidden";
}
function closePicker(){
  const o=document.getElementById("pickerOvl"); if(o)o.classList.remove("on");
  if(window.PAGE_REFRESH) window.PAGE_REFRESH();
  if(_modalUnit) openUnitModal(_modalUnit,_modalScore,_modalApproach);   // modal açıksa buton durumunu tazele
  else document.body.style.overflow="";
}
function renderPicker(){
  const u=unitById(_pickUnit); if(!u)return;
  const lists=Store.lists();
  const rows = lists.length? lists.map(l=>{
    const inn=l.items.includes(u.id);
    return `<label class="pl-row${inn?' on':''}"><span class="pl-name">${escapeHtml(l.name)}<small>${l.items.length} birim</small></span>
      <input type="checkbox" data-lid="${l.id}" ${inn?'checked':''}><span class="chkbox"></span></label>`;
  }).join("") : `<div class="pl-empty">Henüz liste yok. Aşağıdan ilk listenizi oluşturun.</div>`;
  document.getElementById("pickbox").innerHTML = `
    <div class="pick-head">
      <div><div class="pk-il">${titleTr(u.il)}</div><div class="pk-ad">${ilceAd(u)}</div></div>
      <button class="m-close dark" onclick="closePicker()" aria-label="Kapat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <div class="pick-body">
      <div class="pl-list">${rows}</div>
      <button class="pl-done" id="pickDone" type="button">Tamam</button>
      <div class="pl-new">
        <input type="text" id="newListName" placeholder="Yeni liste adı…" maxlength="40" autocomplete="off">
        <button id="newListBtn" type="button">Oluştur &amp; ekle</button>
      </div>
      <a class="pl-manage" href="listeler.html">Listeleri yönet →</a>
    </div>`;
  const pb=document.getElementById("pickbox");
  pb.querySelectorAll("input[data-lid]").forEach(cb=>cb.addEventListener("change",()=>{ Store.toggleItem(cb.dataset.lid,u.id); renderPicker(); }));
  document.getElementById("pickDone").addEventListener("click",closePicker);
  document.getElementById("newListBtn").addEventListener("click",()=>{
    const name=document.getElementById("newListName").value.trim(); if(!name)return;
    const l=Store.create(name); Store.addItem(l.id,u.id); renderPicker();
  });
  document.getElementById("newListName").addEventListener("keydown",e=>{ if(e.key==="Enter")document.getElementById("newListBtn").click(); });
}
