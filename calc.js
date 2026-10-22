(function(){
const meds=window.MEDS;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Smart rounding: never shows 0 for a non-zero dose, strips trailing zeros.
function fmt(v){if(!isFinite(v))return String(v);if(v===0)return '0';const a=Math.abs(v);const d=a>=100?0:a>=10?1:a>=0.1?2:3;let o=Number(v.toFixed(d));if(o===0)o=Number(v.toPrecision(2));return String(o)}
function fmtRange(a,b,u){const x=fmt(a),y=fmt(b);return a===b||x===y?`${x} ${u}`:`${x}–${y} ${u}`}
function ageMonths(){const y=$('ageY').value,m=$('ageM').value;if(y===''&&m==='')return null;const v=(parseInt(y||'0',10)*12)+parseInt(m||'0',10);return isNaN(v)||v<0?null:v}
function ageLabel(m){if(m===0)return 'с рождения';const y=Math.floor(m/12),r=m%12;return (y?y+' г. ':'')+(r?r+' мес.':'')}
function status(med,am){const a=med.minAge;
  if(am===null)return {k:'noage',text:'Укажите возраст ребёнка для проверки ограничений'};
  if(a.m===null)return {k:'unknown',text:'Возрастное ограничение не указано — сверьтесь с инструкцией'};
  const src=a.src==='book'?`книга, с. ${a.p}`:'из шпаргалки, в книге не подтверждено';
  if(am<a.m)return {k:'no',text:`Не разрешено в этом возрасте: ${a.reason} (${src}). Минимальный возраст — ${ageLabel(a.m)}`};
  if(med.caution&&am<med.caution.belowM)return {k:'caution',text:`Осторожно: ${med.caution.text}`};
  return {k:'ok',text:`Разрешено с ${ageLabel(a.m)} (${src})`};
}
function computeDose(med,w,am){const c=med.calc;const years=am===null?null:Math.floor(am/12);
  switch(c.type){
  case 'mgkg':{if(!w)return {need:'вес'};let lo=w*c.min,hi=w*c.max,capped='';if(c.cap&&hi>c.cap){hi=c.cap;lo=Math.min(lo,c.cap);capped=` (ограничено максимумом ${fmt(c.cap)} мг)`}return {text:fmtRange(lo,hi,'мг')+capped}}
  case 'mlkg':{if(!w)return {need:'вес'};return {text:fmtRange(w*c.min,w*c.max,'мл')}}
  case 'gkg':{if(!w)return {need:'вес'};return {text:fmtRange(w*c.min,w*c.max,'г')}}
  case 'mlyear':{if(am===null)return {need:'возраст'};if(years<1)return {text:'расчёт «на год жизни» для детей до 1 года не применяется — см. примечание'};
    let lo=c.min*years,hi=c.max*years,cap='';if(c.capMl&&hi>c.capMl){hi=c.capMl;lo=Math.min(lo,c.capMl);cap=` (не более ${fmt(c.capMl)} мл)`}
    let t=fmtRange(lo,hi,'мл')+cap;if(c.conc)t+=` = ${fmtRange(lo*c.conc,hi*c.conc,'мг')} (по возрасту, ${years} г.)`;else t+=` (по возрасту, ${years} г.)`;return {text:t}}
  case 'age':{if(am===null)return {need:'возраст'};const r=c.table.find(x=>am>=x[0]&&am<x[1]);return {text:r?r[2]:'нет данных'}}
  case 'agemg':{if(am===null)return {need:'возраст'};const r=c.table.find(x=>am>=x[0]&&am<x[1]);if(!r)return {text:'нет данных'};if(r[3]){if(!w)return {need:'вес'};return {text:`${fmt(w*r[3])} мг (${r[2]})`}}return {text:r[2]}}
  case 'text':return {text:c.text};
  default:return {text:'расчёт отключён — см. примечание'};
  }
}
function populate(list){const s=$('medicine');s.innerHTML='';list.forEach(m=>{const o=document.createElement('option');o.value=meds.indexOf(m);o.textContent=m.name;s.appendChild(o)});if(list.length)s.selectedIndex=0}
function filterMeds(){const q=$('search').value.toLowerCase().trim();const f=q?meds.filter(m=>m.name.toLowerCase().includes(q)):meds;populate(f);$('hint').textContent=f.length?`Найдено: ${f.length}`:'Ничего не найдено'}
function calculate(){const idx=$('medicine').value;if(idx===''||!meds[idx])return;const m=meds[idx];
  const wv=$('weight').value;const w=wv===''?null:parseFloat(wv);
  if(w!==null&&(!w||w<1||w>80)){alert('Введите вес от 1 до 80 кг');return}
  const am=ageMonths();const st=status(m,am);const d=computeDose(m,w,am);
  $('medName').textContent=m.name;
  const box=$('status');box.className='st st-'+st.k;box.textContent=(st.k==='ok'?'✅ ':st.k==='no'?'⛔ ':'⚠️ ')+st.text;
  $('dose').textContent=st.k==='no'?'—':(d.need?`Укажите ${d.need} для расчёта`:d.text);
  const src=m.calc.src==='book'?`Доза по книге Вёрткина, с. ${m.calc.p}`:'Доза из шпаргалки — в книге не подтверждена';
  $('details').innerHTML=`Форма: ${esc(m.form)}<br><span class="${m.calc.src==='book'?'b-book':'b-old'}">${esc(src)}</span>${m.note?'<br>'+esc(m.note):''}`;
  $('result').style.display='block';
}
function ageList(){const am=ageMonths();const out=$('ageList');
  if(am===null){out.innerHTML='<p class="info">Укажите возраст (лет и месяцев).</p>';out.style.display='block';return}
  const groups={ok:[],caution:[],no:[],unknown:[]};meds.forEach(m=>{const s=status(m,am);(groups[s.k]||groups.unknown).push([m,s])});
  const sec=(k,t)=>groups[k].length?`<h3 class="h-${k}">${t} (${groups[k].length})</h3>`+groups[k].map(([m,s])=>`<div class="row st-${k}"><b>${esc(m.name)}</b><div>${esc(s.text)}</div></div>`).join(''):'';
  out.innerHTML=`<h2>Возраст: ${esc(ageLabel(am))}</h2>`+sec('ok','✅ Можно (по возрасту)')+sec('caution','⚠️ С осторожностью')+sec('no','⛔ Нельзя / не рекомендовано')+sec('unknown','❔ Ограничение не указано — сверьтесь с инструкцией');
  out.style.display='block';
}
window.filterMeds=filterMeds;window.calculate=calculate;window.ageList=ageList;window.fmt=fmt;window.calcStatus=status;window.computeDose=computeDose;
populate(meds);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
