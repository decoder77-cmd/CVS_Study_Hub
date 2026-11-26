(() => {
'use strict';
const DATA = window.CVS_DATA;
const KEY = 'cvs-study-hub-a2-v1';
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const main = $('#main');
const subjectOrder = DATA.subjects;
const finalItems = [
'All theoretical lectures have been studied.',
'Active recall has been completed for every subject.',
'MCQs have been attempted and mistakes reviewed.',
'Physiology mechanisms, graphs and equations have been revised.',
'Pharmacology drug classes, indications and adverse effects have been revised.',
'Anatomy relations, vessels and embryology have been recalled.',
'Biochemistry pathways have been reproduced from memory.',
'Pathology, histology and microbiology key features have been reviewed.',
'All A2 practical sessions have been checked and reviewed.',
'ECG and cardiology practical material has been revisited.',
'The weak-points log has been reviewed and unresolved items addressed.'
];
const subjectIcons = {'Physiology':'◉','Pharmacology':'⚕','Pathology':'◈','Anatomy & Embryology':'⌖','Biochemistry':'⌬','Cardiology':'♥','Histology':'▦','Microbiology':'◌'};
const today = new Date();
const dateString = d => d ? new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '';
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fresh(){
  const lectures={}, practicals={}, finalChecks={};
  DATA.lectures.forEach(l=>lectures[l.id]={studied:false,recall:false,mcq:false});
  DATA.practicals.forEach(p=>practicals[p.id]={prepare:false,attend:false,review:false});
  finalItems.forEach((_,i)=>finalChecks[i]=false);
  return {version:1,lectures,practicals,revisionTasks:[],weakPoints:[],finalChecks,settings:{theme:'dark'}};
}
function load(){
  try{const raw=localStorage.getItem(KEY); if(!raw)return fresh(); const parsed=JSON.parse(raw); const base=fresh();
    return {...base,...parsed,lectures:{...base.lectures,...parsed.lectures},practicals:{...base.practicals,...parsed.practicals},finalChecks:{...base.finalChecks,...parsed.finalChecks},settings:{...base.settings,...parsed.settings},revisionTasks:Array.isArray(parsed.revisionTasks)?parsed.revisionTasks:[],weakPoints:Array.isArray(parsed.weakPoints)?parsed.weakPoints:[]};
  }catch(e){console.warn('Could not load saved progress',e);return fresh();}
}
let storageAvailable=true;
let state=load(), currentTab='overview', lectureSearch='', subjectFilter='all', lectureFilter='all', toastTimer;
function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(state)); $('#saveStatus').textContent='● محفوظ';}
  catch(e){$('#saveStatus').textContent='! تعذر الحفظ'; showToast('مساحة التخزين ممتلئة؛ صدّر نسخة احتياطية.');}
}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2400);}
function applyTheme(){document.body.classList.toggle('light',state.settings.theme==='light');}
function statCard(label,value,foot){return `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-foot">${foot||''}</div></div>`;}
function bar(pct){return `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`;}
function lectStats(list=DATA.lectures){let stages=0,done=0;list.forEach(l=>{const x=state.lectures[l.id]||{};stages+=Number(!!x.studied)+Number(!!x.recall)+Number(!!x.mcq);if(x.studied&&x.recall&&x.mcq)done++;});return {stages,total:list.length*3,done,lectures:list.length,pct:list.length?Math.round(stages/(list.length*3)*100):0,donePct:list.length?Math.round(done/list.length*100):0};}
function pracStats(){let stages=0,done=0;DATA.practicals.forEach(p=>{const x=state.practicals[p.id]||{};stages+=Number(!!x.prepare)+Number(!!x.attend)+Number(!!x.review);if(x.prepare&&x.attend&&x.review)done++;});return {stages,total:DATA.practicals.length*3,done,pct:Math.round(stages/(DATA.practicals.length*3)*100)};}
function overview(){
  const s=lectStats(), p=pracStats();
  const subjectHTML=subjectOrder.map(name=>{const items=DATA.lectures.filter(l=>l.subject===name), st=lectStats(items);return `<div class="subject-progress"><div class="subject-name">${esc(name)}</div>${bar(st.donePct)}<div class="subject-percent">${st.done}/${st.lectures}</div></div>`;}).join('');
  const nextPractical=DATA.practicals.find(x=>{const d=new Date('2026 '+x.dayDate.replace(',', '')+' 23:00');return !isNaN(d)&&d>=new Date()&&!((state.practicals[x.id]||{}).prepare&&(state.practicals[x.id]||{}).attend&&(state.practicals[x.id]||{}).review);});
  return `<div class="stats-grid grid">
    ${statCard('المحاضرات المكتملة بالكامل',`${s.done} / 83`,`${s.donePct}% مكتمل بكل المراحل`)}
    ${statCard('إنجاز مراحل المحاضرات',`${s.stages} / ${s.total}`,`${s.pct}% من Studied · Recall · MCQs`)}
    ${statCard('السكاشن المكتملة',`${p.done} / 23`,`${p.pct}% من مراحل العملي`)}
    ${statCard('نقاط ضعف مفتوحة',state.weakPoints.filter(x=>!x.resolved).length,'تقدر تضيف وتراجع نقاطك')}
  </div>
  <div class="grid overview-grid">
    <section class="panel"><div class="panel-head"><h2>تقدم المواد</h2><span class="panel-sub">اكتمال المحاضرة = إنهاء المراحل الثلاث</span></div><div class="subject-progress-list">${subjectHTML}</div></section>
    <section class="panel"><div class="panel-head"><h2>مواعيد مهمة</h2><span class="panel-sub">حسب الجدول الأصلي</span></div><div class="date-list">
      <div class="date-item"><div class="date-chip">12<small>DEC</small></div><div><div class="date-title">CVS Continuous Assessment</div><div class="date-caption">Saturday · 12 December 2026</div></div></div>
      <div class="date-item"><div class="date-chip">26–31<small>DEC</small></div><div><div class="date-title">CVS Practical Exams</div><div class="date-caption">Real & Computer Lab · exam week</div></div></div>
    </div><div class="note">الجدول يحدد أسبوع امتحان العملي فقط، ولا يحدد يوم امتحان A2 بالتحديد.</div></section>
  </div>
  <section class="panel"><div class="panel-head"><h2>طريقة متابعة المحاضرة</h2><span class="panel-sub">3 مراحل لكل محاضرة</span></div><div class="stage-legend">
    <div class="stage-box"><b>① Studied</b><span>ذاكرت المحاضرة وفهمت محتواها.</span></div>
    <div class="stage-box"><b>② Active Recall</b><span>استرجعت المعلومات من غير فتح المصدر.</span></div>
    <div class="stage-box"><b>③ MCQs</b><span>حلّيت أسئلة وراجعت أخطاءك.</span></div>
  </div></section>
  <section class="panel"><div class="panel-head"><h2>استكمال سريع</h2><span class="panel-sub">ابدأ من هنا</span></div><div class="backup-actions"><button class="primary-btn" data-go="lectures">افتح المحاضرات غير المكتملة</button><button class="secondary-btn" data-go="practicals">متابعة سكاشن A2</button><button class="secondary-btn" data-go="backup">نسخة احتياطية للتقدم</button></div></section>`;
}
function lectureCard(l){const x=state.lectures[l.id]||{};const n=Number(!!x.studied)+Number(!!x.recall)+Number(!!x.mcq);return `<article class="lecture-card"><div class="lecture-top"><div class="lecture-no">${String(l.number).padStart(2,'0')}</div><div class="lecture-title">${esc(l.title)}</div><div class="lecture-date">${esc(l.date)}</div></div><div class="checks">
  ${[['studied','Studied'],['recall','Recall'],['mcq','MCQs']].map(([k,label])=>`<label class="check-label"><input type="checkbox" data-lecture="${l.id}" data-stage="${k}" ${x[k]?'checked':''}>${label}</label>`).join('')}
</div><div class="lecture-state"><span style="width:${n/3*100}%"></span></div></article>`;}
function lectureGroups(){
  const term=lectureSearch.trim().toLowerCase();
  let html='';
  for(const subject of subjectOrder){if(subjectFilter!=='all'&&subjectFilter!==subject)continue;
    let items=DATA.lectures.filter(l=>l.subject===subject && (!term||`${l.number} ${l.title} ${l.subject} ${l.date}`.toLowerCase().includes(term)));
    items=items.filter(l=>{const x=state.lectures[l.id]||{};const done=!!(x.studied&&x.recall&&x.mcq);if(lectureFilter==='incomplete')return !done;if(lectureFilter==='complete')return done;if(lectureFilter==='not-studied')return !x.studied;return true;});
    if(!items.length)continue;
    const st=lectStats(DATA.lectures.filter(l=>l.subject===subject));
    html+=`<section class="subject-section"><div class="subject-section-head"><h3>${subjectIcons[subject]||'•'} &nbsp; ${esc(subject)}</h3><span>${st.done}/${st.lectures} مكتملة بالكامل</span></div><div class="lecture-list">${items.map(lectureCard).join('')}</div></section>`;
  }
  return html||'<div class="empty">مفيش محاضرات مطابقة للبحث أو الفلتر الحالي.</div>';
}
function lecturesView(){return `<div class="panel"><div class="panel-head"><h2>المحاضرات النظرية</h2><span class="panel-sub">83 lecture · مرتبة حسب المادة</span></div><div class="section-toolbar"><input id="lectureSearch" class="search" type="search" placeholder="ابحث برقم المحاضرة أو عنوانها أو المادة..." value="${esc(lectureSearch)}"><select id="subjectFilter" class="control"><option value="all">كل المواد</option>${subjectOrder.map(s=>`<option value="${esc(s)}" ${subjectFilter===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div><div class="section-toolbar">${[['all','الكل'],['incomplete','غير مكتمل'],['complete','مكتمل بالكامل'],['not-studied','لم أبدأ']].map(([v,t])=>`<button class="filter-chip ${lectureFilter===v?'active':''}" data-lecture-filter="${v}">${t}</button>`).join('')}</div></div><div id="lectureGroups">${lectureGroups()}</div>`;}
function practicalCard(p){const x=state.practicals[p.id]||{};const n=Number(!!x.prepare)+Number(!!x.attend)+Number(!!x.review);return `<article class="practical-card"><div class="practical-head"><div class="practical-num">A2 · ${String(p.id).padStart(2,'0')}</div><div><div class="practical-title">${esc(p.title)}</div><div class="practical-meta">${esc(p.dayDate)} · ${esc(p.time)}</div></div></div><div class="checks">
${[['prepare','Prepared'],['attend','Attended'],['review','Reviewed']].map(([k,label])=>`<label class="check-label"><input type="checkbox" data-practical="${p.id}" data-stage="${k}" ${x[k]?'checked':''}>${label}</label>`).join('')}
</div><div class="lecture-state"><span style="width:${n/3*100}%"></span></div></article>`;}
function practicalView(){const p=pracStats();return `<div class="panel"><div class="panel-head"><h2>السكاشن العملية · Section A2</h2><span class="panel-sub">23 جلسة من الجدول</span></div><div class="progress-track"><div class="progress-fill" style="width:${p.pct}%"></div></div><div class="progress-meta"><span>${p.done} / 23 جلسة مكتملة</span><span>${p.pct}%</span></div><div class="note">Prepared = حضرت للتحضير · Attended = حضرت السكشن · Reviewed = راجعت محتواه. مواعيد الجلسات من صفحات CVS في الجدول.</div></div><div class="practical-list">${DATA.practicals.map(practicalCard).join('')}</div><section class="panel" style="margin-top:15px"><div class="panel-head"><h2>أسبوع امتحان العملي</h2></div><div class="date-item"><div class="date-chip">26–31<small>DEC</small></div><div><div class="date-title">CVS Practical Exams (Real and Computer Lab)</div><div class="date-caption">الجدول لا يحدد اليوم الخاص بسكشن A2.</div></div></div></section>`;}
function revisionView(){const tasks=[...state.revisionTasks].sort((a,b)=>(a.date||'').localeCompare(b.date||''));return `<section class="panel"><div class="panel-head"><h2>إضافة مراجعة</h2><span class="panel-sub">كوّن قائمة المراجعات القادمة</span></div><form id="revisionForm" class="task-form"><div class="field"><label>الموضوع / المحاضرة</label><input name="title" required placeholder="مثال: Cardiac cycle" maxlength="100"></div><div class="field"><label>موعد المراجعة</label><input name="date" type="date" required></div><div class="field"><label>نوع المراجعة</label><select name="kind"><option>First review</option><option>Second review</option><option>Final review</option><option>Custom</option></select></div><button class="primary-btn" type="submit">＋ إضافة</button></form></section><section class="panel"><div class="panel-head"><h2>قائمة المراجعات</h2><span class="panel-sub">${tasks.filter(t=>!t.done).length} متبقية · ${tasks.filter(t=>t.done).length} مكتملة</span></div><div class="task-list">${tasks.length?tasks.map(t=>`<article class="task-card"><div class="task-row"><input type="checkbox" data-revision-done="${esc(t.id)}" ${t.done?'checked':''}><div class="task-content"><div class="task-title" style="${t.done?'text-decoration:line-through;opacity:.6':''}">${esc(t.title)}</div><div class="task-meta">${esc(t.kind)} · ${dateString(t.date)}</div></div><button class="tiny-btn" data-delete-revision="${esc(t.id)}">حذف</button></div></article>`).join(''):'<div class="empty">لسه مفيش مراجعات مضافة. ابدأ بموعد R1 للمحاضرات اللي ذاكرتها.</div>'}</div></section><div class="note">اقتراح تنظيمي: أول مراجعة بعد يوم تقريبًا، وثانية بعد أسبوع تقريبًا، ومراجعة أخيرة قبل الامتحان. المواعيد قابلة للتعديل حسب خطتك.</div>`;}
function mistakesView(){return `<section class="panel"><div class="panel-head"><h2>تسجيل نقطة ضعف أو غلطة</h2><span class="panel-sub">سجل السبب وطريقة التصحيح</span></div><form id="mistakeForm" class="form-grid"><div class="field"><label>عنوان المشكلة</label><input name="title" required maxlength="100" placeholder="مثال: Confusing preload and afterload"></div><div class="field"><label>المادة</label><select name="subject">${subjectOrder.map(s=>`<option>${esc(s)}</option>`).join('')}</select></div><div class="field wide"><label>إيه اللي غلط أو مش واضح؟</label><textarea name="problem" placeholder="اكتب الفكرة أو السؤال اللي بتتلخبط فيه"></textarea></div><div class="field"><label>التصحيح / الإجراء المطلوب</label><input name="fix" placeholder="إيه اللي هتعمله عشان تصلحها؟"></div><div class="field"><label>موعد المراجعة القادم</label><input name="date" type="date"></div><div class="wide"><button class="primary-btn" type="submit">＋ حفظ نقطة الضعف</button></div></form></section><section class="panel"><div class="panel-head"><h2>سجل نقاط الضعف</h2><span class="panel-sub">${state.weakPoints.filter(x=>!x.resolved).length} مفتوحة</span></div><div class="mistake-list">${state.weakPoints.length?state.weakPoints.map(x=>`<article class="mistake-card"><div class="task-row"><input type="checkbox" data-mistake-resolved="${esc(x.id)}" ${x.resolved?'checked':''}><div class="task-content"><div class="task-title">${esc(x.title)}</div><div class="task-meta">${esc(x.subject)} ${x.date?'· مراجعة: '+dateString(x.date):''} ${x.resolved?'· تم التصحيح':''}</div>${x.problem?`<div class="task-note"><b>المشكلة:</b> ${esc(x.problem)}</div>`:''}${x.fix?`<div class="task-note"><b>التصحيح:</b> ${esc(x.fix)}</div>`:''}</div><button class="tiny-btn" data-delete-mistake="${esc(x.id)}">حذف</button></div></article>`).join(''):'<div class="empty">مفيش نقاط ضعف مسجلة حتى الآن. أضف أي مفهوم أو سؤال يتكرر فيه الخطأ.</div>'}</div></section>`;}
function finalView(){const done=finalItems.filter((_,i)=>state.finalChecks[i]).length,pct=Math.round(done/finalItems.length*100);return `<section class="panel"><div class="panel-head"><h2>CVS Final Readiness</h2><span class="panel-sub">قائمة مراجعة قبل الامتحان</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="progress-meta"><span>${done} / ${finalItems.length} تم إنجازه</span><span>${pct}%</span></div><div class="final-list" style="margin-top:14px">${finalItems.map((x,i)=>`<label class="final-item"><input type="checkbox" data-final="${i}" ${state.finalChecks[i]?'checked':''}><span>${esc(x)}</span></label>`).join('')}</div></section><section class="panel"><div class="panel-head"><h2>مواعيد الامتحانات</h2></div><div class="date-list"><div class="date-item"><div class="date-chip">12<small>DEC</small></div><div><div class="date-title">Continuous Assessment – Cardiovascular</div><div class="date-caption">Saturday, 12/12/2026</div></div></div><div class="date-item"><div class="date-chip">26–31<small>DEC</small></div><div><div class="date-title">CVS Practical Exams (Real & Computer Lab)</div><div class="date-caption">Exact A2 exam day is not stated in the timetable.</div></div></div></div></section>`;}
function backupView(){const storage=(()=>{try{return (new Blob([JSON.stringify(state)]).size/1024).toFixed(1)+' KB';}catch(e){return '—';}})();return `<section class="panel"><div class="panel-head"><h2>حفظ ونقل تقدمك</h2><span class="panel-sub">البيانات محفوظة تلقائيًا في المتصفح</span></div><div class="backup-grid grid"><div class="backup-card"><h3>⬇ تصدير نسخة احتياطية</h3><p>احفظ ملف JSON يحتوي على تقدمك والمحاضرات والسكاشن والمراجعات ونقاط الضعف.</p><button id="exportBtn" class="primary-btn">تصدير التقدم</button></div><div class="backup-card"><h3>⬆ استعادة نسخة احتياطية</h3><p>استرجع تقدمك من ملف سبق تصديره من التطبيق.</p><button id="importBtn" class="secondary-btn">اختيار ملف النسخة الاحتياطية</button></div><div class="backup-card"><h3>◐ المظهر</h3><p>اختار المظهر المناسب للاستخدام اليومي.</p><button id="themeBackupBtn" class="secondary-btn">${state.settings.theme==='dark'?'تفعيل المظهر الفاتح':'تفعيل المظهر الداكن'}</button></div><div class="backup-card"><h3>↺ إعادة ضبط التقدم</h3><p>مسح العلامات والمراجعات ونقاط الضعف من هذا الجهاز. صدّر نسخة أولًا لو محتاجها.</p><button id="resetBtn" class="danger-btn">إعادة ضبط كل البيانات</button></div></div><div class="note">حجم بيانات التقدم الحالية تقريبًا ${storage}. الحفظ محلي على نفس المتصفح والجهاز؛ التصدير مهم قبل تغيير الهاتف أو مسح بيانات Chrome.</div></section><section class="panel"><div class="panel-head"><h2>التثبيت على أندرويد</h2></div><ol style="color:var(--muted);font-size:12px;line-height:2.0;padding-inline-start:22px"><li>افتح نسخة التطبيق من Chrome على أندرويد.</li><li>من قائمة ⋮ اختار <b>Install app</b> أو <b>Add to Home screen</b> عندما يكون التطبيق منشورًا على رابط HTTPS.</li><li>بعد أول فتح، نسخة PWA تقدر تشتغل دون إنترنت وتحفظ تقدمك على الجهاز.</li></ol><div class="note">الملف المستقل يفتح مباشرة في المتصفح. تثبيت PWA كأيقونة مستقلة والعمل Offline يحتاج رفع مجلد التطبيق إلى استضافة HTTPS أول مرة.</div></section>`;}
function render(){applyTheme();$('#saveStatus').textContent=storageAvailable?'● محفوظ':'! الحفظ غير متاح';$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab));const views={overview,lectures:lecturesView,practicals:practicalView,revision:revisionView,mistakes:mistakesView,final:finalView,backup:backupView};main.innerHTML=views[currentTab]();}
function go(tab){currentTab=tab;render();window.scrollTo({top:0,behavior:'smooth'});}
function updateCheck(kind,id,stage,checked){if(kind==='lecture')state.lectures[id][stage]=checked;else if(kind==='practical')state.practicals[id][stage]=checked;persist();render();}
document.addEventListener('click',e=>{
 const tab=e.target.closest('[data-tab]');if(tab){go(tab.dataset.tab);return;}
 const goBtn=e.target.closest('[data-go]');if(goBtn){go(goBtn.dataset.go);if(currentTab==='lectures'){lectureFilter='incomplete';render();}return;}
 const filter=e.target.closest('[data-lecture-filter]');if(filter){lectureFilter=filter.dataset.lectureFilter;render();return;}
 if(e.target.id==='themeBtn'||e.target.id==='themeBackupBtn'){state.settings.theme=state.settings.theme==='dark'?'light':'dark';persist();render();return;}
 if(e.target.id==='exportBtn'){exportBackup();return;}
 if(e.target.id==='importBtn'){$('#importFile').click();return;}
 if(e.target.id==='resetBtn'){if(confirm('متأكد إنك عايز تمسح كل تقدمك؟ يُفضّل تصدير نسخة احتياطية أولًا.')){state=fresh();persist();render();showToast('تمت إعادة ضبط التقدم.');}return;}
 const delRev=e.target.closest('[data-delete-revision]');if(delRev){state.revisionTasks=state.revisionTasks.filter(x=>x.id!==delRev.dataset.deleteRevision);persist();render();showToast('تم حذف المراجعة.');return;}
 const delMist=e.target.closest('[data-delete-mistake]');if(delMist){state.weakPoints=state.weakPoints.filter(x=>x.id!==delMist.dataset.deleteMistake);persist();render();showToast('تم حذف النقطة.');return;}
});
document.addEventListener('change',e=>{
 const el=e.target;
 if(el.matches('[data-lecture]')){updateCheck('lecture',el.dataset.lecture,el.dataset.stage,el.checked);return;}
 if(el.matches('[data-practical]')){updateCheck('practical',el.dataset.practical,el.dataset.stage,el.checked);return;}
 if(el.matches('[data-revision-done]')){const t=state.revisionTasks.find(x=>x.id===el.dataset.revisionDone);if(t)t.done=el.checked;persist();render();return;}
 if(el.matches('[data-mistake-resolved]')){const t=state.weakPoints.find(x=>x.id===el.dataset.mistakeResolved);if(t)t.resolved=el.checked;persist();render();return;}
 if(el.matches('[data-final]')){state.finalChecks[el.dataset.final]=el.checked;persist();render();return;}
 if(el.id==='subjectFilter'){subjectFilter=el.value;$('#lectureGroups').innerHTML=lectureGroups();return;}
});
document.addEventListener('input',e=>{if(e.target.id==='lectureSearch'){lectureSearch=e.target.value;const box=$('#lectureGroups');if(box)box.innerHTML=lectureGroups();}});
document.addEventListener('submit',e=>{
 e.preventDefault();const f=e.target;
 if(f.id==='revisionForm'){const fd=new FormData(f);state.revisionTasks.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title:fd.get('title').trim(),date:fd.get('date'),kind:fd.get('kind'),done:false});persist();render();showToast('تمت إضافة المراجعة.');}
 if(f.id==='mistakeForm'){const fd=new FormData(f);state.weakPoints.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title:fd.get('title').trim(),subject:fd.get('subject'),problem:fd.get('problem').trim(),fix:fd.get('fix').trim(),date:fd.get('date'),resolved:false});persist();render();showToast('تم حفظ نقطة الضعف.');}
});
function exportBackup(){const pack={app:'CVS Study Hub – Section A2',version:1,exportedAt:new Date().toISOString(),data:state};const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='CVS_A2_Backup_'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url);showToast('تم تصدير نسخة احتياطية.');}
$('#importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());const incoming=parsed.data||parsed;if(!incoming.lectures||!incoming.practicals)throw new Error('invalid');if(!confirm('استعادة النسخة ستستبدل التقدم الموجود حاليًا. هل تريد المتابعة؟'))return;const base=fresh();state={...base,...incoming,lectures:{...base.lectures,...incoming.lectures},practicals:{...base.practicals,...incoming.practicals},finalChecks:{...base.finalChecks,...incoming.finalChecks},settings:{...base.settings,...incoming.settings}};persist();render();showToast('تم استرجاع تقدمك بنجاح.');}catch(err){showToast('ملف النسخة الاحتياطية غير صالح.');}finally{e.target.value='';}});
$('#themeBtn').addEventListener('click',()=>{});
let installPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;const btn=document.createElement('button');btn.className='primary-btn install-floating';btn.textContent='تثبيت التطبيق';btn.style='position:fixed;left:15px;bottom:85px;z-index:12';btn.onclick=async()=>{installPrompt.prompt();await installPrompt.userChoice;btn.remove();installPrompt=null;};document.body.appendChild(btn);});
if('serviceWorker' in navigator && location.protocol.startsWith('http')){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));}
render();
})();