(function(){
const T=window.TOPICS,D=window.DRUGS;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s).toLowerCase().replace(/ё/g,'е');
function li(arr){return '<ul>'+arr.map(x=>{const g=x.startsWith('◇');return `<li class="${g?'gen':''}">${g?'◇ <i>не из книги:</i> '+esc(x.slice(1).trim()):esc(x)}</li>`}).join('')+'</ul>'}
const IDX=[];
T.forEach(t=>IDX.push({type:'topic',id:t.id,title:t.title,kw:norm(t.keywords||''),text:norm([t.title,t.keywords,t.clinic.join(' '),t.definition.join(' '),t.classification.join(' ')].join(' '))}));
D.forEach((d,i)=>IDX.push({type:'drug',id:i,title:d.n,text:norm([d.n,d.ind,d.f].join(' '))}));
function search(q){q=norm(q).trim();if(!q)return [];const words=q.split(/\s+/).filter(Boolean);const res=[];
  IDX.forEach(e=>{let score=0;for(const w of words){const stem=w.length>5?w.slice(0,w.length-2):w;
    if(norm(e.title).includes(w))score+=10;else if(e.text.includes(stem))score+=3;else{score=-1;break}}
    if(score>0&&words.length>1&&e.kw&&e.kw.includes(words.join(' ')))score+=e.kw.startsWith(words.join(' '))?12:8;
    if(score>0)res.push(Object.assign({score},e))});
  return res.sort((a,b)=>b.score-a.score||(a.type==='topic'?-1:1))}
window.APP_SEARCH=search;
const chName=id=>{const t=T.find(x=>x.id===id),c=t&&window.CHAPTERS.find(c=>c.id===t.group);return c?c.title:''};
window.APP_CHAP=c=>{chap=c;tab='topics';render()};
let tab='topics',chap='all';
function render(){
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  const q=$('#q').value,v=$('#view');
  if(q.trim()){const r=search(q);v.innerHTML=`<div class="k">Найдено: ${r.length}</div>`+(r.length?r.map(e=>`<div class="card item" data-type="${e.type}" data-id="${e.id}"><h3>${e.type==='topic'?'📘 ':'💊 '}${esc(e.title)}</h3><div class="m">${e.type==='topic'?'Тема · '+esc(chName(e.id)):'Препарат'}</div></div>`).join(''):'<div class="card">Ничего не найдено. Попробуйте симптом: «боль в груди», «судороги», «сыпь».</div>');return}
  const tc=t=>`<div class="card item" data-type="topic" data-id="${t.id}"><h3>${t.icon} ${esc(t.title)}</h3><div class="m">Книга, с. ${esc(t.pages)}</div></div>`;
  const inCh=(t,c)=>t.group===c||(t.also||[]).includes(c);
  if(tab==='topics'){const CH=window.CHAPTERS.filter(c=>T.some(t=>inCh(t,c.id)));
    let h=`<div class="chips"><button data-ch="all" class="${chap==='all'?'on':''}">Все разделы</button>`+CH.map(c=>`<button data-ch="${c.id}" class="${chap===c.id?'on':''}">${c.icon} ${esc(c.title)}</button>`).join('')+`</div>`;
    h+=CH.filter(c=>chap==='all'||chap===c.id).map(c=>{const L=T.filter(t=>inCh(t,c.id));return `<h2 class="grp" id="ch-${c.id}">${c.icon} ${esc(c.title)} <span class="m">— ${L.length} тем · с. ${esc(c.pages)}</span></h2>`+(c.note?`<div class="k">${esc(c.note)}</div>`:'')+L.map(tc).join('')}).join('');
    v.innerHTML=h}
  else if(tab==='drugs')v.innerHTML=`<div class="k">Препаратов: ${D.length}. «в книге не указано» — значения в книге нет.</div>`+D.map((d,i)=>`<div class="card item" data-type="drug" data-id="${i}"><h3>💊 ${esc(d.n)}</h3><div class="m">${esc(d.f)} · с. ${esc(d.p)}</div></div>`).join('');
  else if(tab==='disc')v.innerHTML=`<div class="card"><h3>Расхождения: шпаргалка калькулятора ↔ книга</h3><table><tr><th>Препарат</th><th>Шпаргалка</th><th>Книга</th></tr>${window.DISCREPANCIES.map(x=>`<tr><td><b>${esc(x.d)}</b><div class="src">с. ${esc(x.p)}</div></td><td>${esc(x.old)}</td><td>${esc(x.book)}<div class="k">${esc(x.sev)}</div></td></tr>`).join('')}</table></div><div class="card"><h3>Нет в книге</h3>${li(window.NOT_IN_BOOK)}</div>`;
  else if(tab==='calc')v.innerHTML=`<div class="card"><h3>🧮 Калькулятор доз</h3><p>Возраст + вес → разрешён ли препарат в этом возрасте и доза; список «что можно в этом возрасте».</p><a href="calculator.html">Открыть калькулятор →</a></div>`;
}
function showTopic(id){const t=T.find(x=>x.id===id),p=t.prevention,c=t.card;
  const sec=(title,arr,open)=>`<details ${open?'open':''}><summary>${title}</summary>${li(arr)}</details>`;
  $('#view').innerHTML=`<button class="back">← Назад</button><div class="card"><div class="m">Раздел: <a href="#" data-ch="${t.group}">${esc(chName(t.id))}</a></div><h2>${t.icon} ${esc(t.title)}</h2><div class="src">Источник: Вёрткин, Свешников, 3-е изд., 2026, с. ${esc(t.pages)}. Собственный пересказ, не цитата.</div>
  ${sec('Определение',t.definition,1)}${sec('Классификация',t.classification)}${sec('Этиология',t.etiology)}${sec('Патогенез',t.pathogenesis)}${sec('Механизмы',t.mechanisms)}
  ${sec('Клиническая картина',t.clinic,1)}${sec('Диагностика',t.diagnosis)}${sec('Лечение (догоспитальный этап / СМП)',t.treatment)}
  ${sec('🚑 Пошаговый алгоритм помощи',t.algorithm,1)}
  <details open class="warn"><summary>⛔ Критические предупреждения</summary>${li(t.warnings)}</details>
  <details><summary>🛡 Профилактика (подробно)</summary><p class="k">${esc(p.book)}</p><b>Первичная</b>${li(p.primary)}<b>Вторичная</b>${li(p.secondary)}<b>Факторы риска</b>${li(p.risk)}<b>Что делать пациенту</b>${li(p.patient)}<b>Что делать окружающим</b>${li(p.bystanders)}<b>На что обратить внимание</b>${li(p.watch)}</details>
  <details><summary>📋 Пример карты вызова</summary><div class="cc"><div class="lbl">Учебный пример, вымышленные данные</div>
   <b>Время вызова:</b> ${esc(c.time)}<br><b>Адрес:</b> ${esc(c.address)}<br><b>Кто звонил:</b> ${esc(c.caller)}<br><b>Повод:</b> ${esc(c.reason)}<br>
   <b>Витальные:</b> АД ${esc(c.vitals.AD)}, ЧСС ${esc(c.vitals.HR)}, ЧДД ${esc(c.vitals.RR)}, SpO2 ${esc(c.vitals.SpO2)}, глюкоза ${esc(c.vitals.glucose)}, t ${esc(c.vitals.temp)}, ГКС ${esc(c.vitals.GCS)}<br>
   <b>Что сделано:</b> ${esc(c.done)}<br><b>Бригада:</b> ${esc(c.team)}<br><b>Время прибытия:</b> ${esc(c.arrival)}<br><b>Исход:</b> ${esc(c.outcome)}</div></details>
  <details><summary>💊 Препараты по теме</summary>${D.map((d,i)=>d.t.split(' ').includes(t.id)?`<div><a href="#" data-drug="${i}">${esc(d.n)}</a></div>`:'').join('')}</details>
  <p class="k">◇ — общепринятые сведения, не из книги.</p></div>`;window.scrollTo&&window.scrollTo(0,0)}
function showDrug(i){const d=D[i];
  $('#view').innerHTML=`<button class="back">← Назад</button><div class="card"><h2>💊 ${esc(d.n)}</h2><div class="src">Книга, с. ${esc(d.p)}</div>
  <table><tr><th>Форма</th><td>${esc(d.f)}</td></tr><tr><th>Показания</th><td>${esc(d.ind)}</td></tr><tr><th>Противопоказания</th><td>${esc(d.contra)}</td></tr>${d.age?`<tr><th>Возрастное ограничение</th><td>${esc(d.age)}</td></tr>`:""}<tr><th>Дозы — взрослые</th><td>${esc(d.ad)}</td></tr><tr><th>Дозы — дети</th><td>${esc(d.ch)}</td></tr><tr><th>Пути введения</th><td>${esc(d.r)}</td></tr><tr><th>Побочные эффекты</th><td>${esc(d.se)}</td></tr></table>
  <p class="k">Перепроверяйте дозы по актуальной инструкции и протоколам.</p></div>`;window.scrollTo&&window.scrollTo(0,0)}
document.addEventListener('click',e=>{const it=e.target.closest('.item'),b=e.target.closest('.tabs button'),dl=e.target.closest('[data-drug]');
  if(dl){e.preventDefault();showDrug(+dl.dataset.drug);return}
  if(e.target.closest('.back')){render();return}
  const ch=e.target.closest('[data-ch]');if(ch){e.preventDefault();chap=ch.dataset.ch;tab='topics';$('#q').value='';render();return}
  if(b){tab=b.dataset.t;$('#q').value='';render();return}
  if(it){it.dataset.type==='topic'?showTopic(it.dataset.id):showDrug(+it.dataset.id)}});
$('#q').addEventListener('input',render);render();
window.APP={showTopic,showDrug,render};
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
