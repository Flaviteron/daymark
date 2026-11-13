/* Daymark app logic. All interface text comes from js/i18n.js via T(). */
(function(){
'use strict';
var VERSION='1.3.0', KEY='daymark-v1', WD=[1,2,3,4,5,6,0];
var HUES=['#3b73f0','#e0612a','#12a07a','#b548ad','#c29a12','#1795b5'];
var OLD_DEFAULT_SECTIONS=['Vaccines','Indicators','Practice']; /* versions before 1.2 started with these */
var ICON={
  check:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>',
  today:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M8.5 13l2.5 2.5 4.5-5"/></svg>',
  sheet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/></svg>',
  later:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
  progress:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
  more:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/></svg>'
};
var TABS=['sheet','today','later','progress','more'];
var TABKEY={sheet:'tabSheet',today:'tabToday',later:'tabLater',progress:'tabProgress',more:'tabMore'};

/* ---------- text ---------- */
var I18N=window.DAYMARK_I18N, LANG=I18N.pick(), STR=I18N.strings[LANG], EN=I18N.strings.en;
function T(k,v){
  var s=STR[k]!=null?STR[k]:EN[k];
  if(s==null)return k;
  if(typeof s==='function')return s(v||{});
  return v?s.replace(/\{(\w+)\}/g,function(m,n){return v[n]!=null?v[n]:m}):s;
}
var DAY=[];(function(){for(var d=0;d<7;d++)DAY.push(new Date(2024,0,7+d).toLocaleDateString(LANG,{weekday:'short'}))})();
document.documentElement.lang=LANG;
Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'),function(el){el.textContent=T(el.getAttribute('data-i18n'))});
Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-ph]'),function(el){el.setAttribute('placeholder',T(el.getAttribute('data-i18n-ph')))});
Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'),function(el){el.setAttribute('aria-label',T(el.getAttribute('data-i18n-aria')))});

/* ---------- dates ---------- */
function key(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function parse(k){var p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function add(k,n){var d=parse(k);d.setDate(d.getDate()+n);return key(d)}
function todayKey(){return key(new Date())}
function monday(k){var d=parse(k);var off=(d.getDay()+6)%7;return add(k,-off)}
function nice(k,opt){return parse(k).toLocaleDateString(LANG,opt||{weekday:'short',day:'numeric',month:'short'})}
var DATE_RE=/^\d{4}-\d{2}-\d{2}$/;

/* ---------- state ---------- */
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3)}
function fresh(){return {v:3,updatedAt:0,welcome:true,log:{},sections:[],items:[]}}
function normalize(s){
  if(!s||typeof s!=='object'||!Array.isArray(s.items))return null;
  var out={v:3,updatedAt:+s.updatedAt||0,welcome:!!s.welcome,log:{},sections:[],items:[]};
  (Array.isArray(s.sections)?s.sections:[]).forEach(function(x){
    if(typeof x!=='string')return;x=x.trim().slice(0,40);if(x&&out.sections.indexOf(x)<0)out.sections.push(x)});
  var ids={};
  s.items.forEach(function(i){
    if(!i||i.id==null||typeof i.title!=='string'||ids[String(i.id)])return;ids[String(i.id)]=true;
    var g=typeof i.group==='string'?i.group.trim().slice(0,40):'';
    if(g&&out.sections.indexOf(g)<0)out.sections.push(g);
    out.items.push({id:String(i.id),title:i.title.slice(0,120),kind:i.kind==='daily'?'daily':'once',
      days:Array.isArray(i.days)?i.days.filter(function(n,x,a){return n>=0&&n<=6&&n===Math.floor(n)&&a.indexOf(n)===x}):[],
      due:typeof i.due==='string'&&DATE_RE.test(i.due)?i.due:null,group:g,
      created:typeof i.created==='string'&&DATE_RE.test(i.created)?i.created:todayKey(),
      doneAt:typeof i.doneAt==='string'&&DATE_RE.test(i.doneAt)?i.doneAt:null});
  });
  if(s.log&&typeof s.log==='object')Object.keys(s.log).forEach(function(k){
    if(!DATE_RE.test(k)||!Array.isArray(s.log[k]))return;
    var a=s.log[k].map(String).filter(function(id,x,arr){return ids[id]&&arr.indexOf(id)===x});
    if(a.length)out.log[k]=a});
  return out;
}
function load(){
  try{
    var raw=JSON.parse(localStorage.getItem(KEY)),s=normalize(raw);
    if(!s)return fresh();
    /* sections became optional in 1.2: drop the old starter sections if nothing was ever put in them */
    if((+raw.v||1)<3)s.sections=s.sections.filter(function(g){
      return OLD_DEFAULT_SECTIONS.indexOf(g)<0||s.items.some(function(i){return i.group===g})});
    return s;
  }catch(e){return fresh()}
}
var state=load();
var ui={month:todayKey().slice(0,7),tab:'sheet',day:todayKey(),weekStart:monday(todayKey()),filter:'',just:null,focus:null,installEvt:null};

function saveLocal(){
  try{localStorage.setItem(KEY,JSON.stringify(state));return true}
  catch(e){toast(T('saveFailed'));return false}
}
var askedPersist=false;
function commit(){
  state.updatedAt=Date.now();
  Object.keys(state.log).forEach(function(k){if(!state.log[k].length)delete state.log[k]});
  saveLocal();
  if(!askedPersist&&navigator.storage&&navigator.storage.persist){askedPersist=true;navigator.storage.persist().catch(function(){})}
  render();
}
/* another tab or window of the app changed the data */
window.addEventListener('storage',function(e){
  if(e.key!==KEY||$('overlay').classList.contains('open'))return;
  state=load();render();
});

/* ---------- logic ---------- */
function groups(){return state.sections}
function hue(g){var i=groups().indexOf(g);return HUES[(i<0?0:i)%HUES.length]}
function onDay(it,k){return !it.days.length||it.days.indexOf(parse(k).getDay())>=0}
function scheduled(it,k){return it.kind==='daily'&&k>=it.created&&onDay(it,k)}
function ticked(it,k){return !!(state.log[k]&&state.log[k].indexOf(it.id)>=0)}
function isDone(it,k){return it.kind==='daily'?ticked(it,k):!!it.doneAt}
function pass(it){return !ui.filter||it.group===ui.filter}
function habitsOn(k){return state.items.filter(function(i){return scheduled(i,k)&&pass(i)})}
function tasksOn(k){var t=todayKey();return state.items.filter(function(i){
  if(i.kind!=='once'||!pass(i))return false;
  if(i.doneAt)return i.doneAt===k||(i.due===k&&i.doneAt<=k);
  return i.due===k||(k===t&&i.due&&i.due<t);
})}
function dayCount(k){var all=habitsOn(k).concat(tasksOn(k));return {total:all.length,done:all.filter(function(i){return isDone(i,k)}).length}}
function streak(it){var t=todayKey(),k=t,n=0;for(var i=0;i<3660&&k>=it.created;i++){if(scheduled(it,k)){if(ticked(it,k))n++;else if(k!==t)break}k=add(k,-1)}return n}
function best(it){var t=todayKey(),k=it.created,cut=add(t,-3660),b=0,n=0;if(k<cut)k=cut;while(k<=t){if(scheduled(it,k)){if(ticked(it,k)){n++;if(n>b)b=n}else if(k!==t)n=0}k=add(k,1)}return b}
function rate30(it){var t=todayKey(),d=0,s=0;for(var i=0;i<30;i++){var k=add(t,-i);if(scheduled(it,k)){s++;if(ticked(it,k))d++}}return s?Math.round(d/s*100):null}
function flip(it,k){var a=state.log[k]||(state.log[k]=[]),i=a.indexOf(it.id);if(i>=0)a.splice(i,1);else a.push(it.id)}
function toggle(it,k){
  var t=todayKey();
  if(it.kind==='daily'){if(k>t)return;flip(it,k)}
  else it.doneAt=it.doneAt?null:(k>t?t:k);
  ui.just=it.id;commit();
}
function toggleCell(it,k){
  if(k>todayKey())return;if(k<it.created)it.created=k;
  flip(it,k);ui.focus='c-'+it.id+'-'+k;commit();
}
function repeatText(it){if(it.kind!=='daily')return '';if(!it.days.length||it.days.length===7)return T('everyDay');return WD.filter(function(d){return it.days.indexOf(d)>=0}).map(function(d){return DAY[d]}).join(' ')}
function addSection(name){name=name.trim().slice(0,40);if(!name||groups().indexOf(name)>=0)return false;state.sections.push(name);return true}
function renameSection(old,name){
  name=name.trim().slice(0,40);if(!name||name===old||groups().indexOf(name)>=0){render();return}
  var i=state.sections.indexOf(old);if(i>=0)state.sections[i]=name;
  state.items.forEach(function(it){if(it.group===old)it.group=name});if(ui.filter===old)ui.filter=name;commit();
}
function moveSection(g,dir){
  var a=state.sections,i=a.indexOf(g),j=i+dir;if(i<0||j<0||j>=a.length)return;
  a[i]=a[j];a[j]=g;commit();
}
function deleteSection(g){
  state.sections=state.sections.filter(function(x){return x!==g});
  state.items.forEach(function(it){if(it.group===g)it.group=''});
  if(ui.filter===g)ui.filter='';commit();
}
function moveRow(it,dir){
  var idx=[];state.items.forEach(function(x,i){if(x.kind==='daily'&&x.group===it.group)idx.push(i)});
  var p=idx.indexOf(state.items.indexOf(it)),q=p+dir;if(p<0||q<0||q>=idx.length)return;
  var a=idx[p],b=idx[q];state.items[a]=state.items[b];state.items[b]=it;commit();
}
function deleteItem(id){
  state.items=state.items.filter(function(i){return i.id!==id});
  Object.keys(state.log).forEach(function(k){state.log[k]=state.log[k].filter(function(x){return x!==id})});
}

/* ---------- dom helper ---------- */
var $=function(id){return document.getElementById(id)};
function h(tag,attrs){
  var el=document.createElement(tag),i,k;
  if(attrs)for(k in attrs){var v=attrs[k];if(v==null||v===false)continue;
    if(k==='class')el.className=v;else if(k==='html')el.innerHTML=v;else if(k==='text')el.textContent=v;
    else if(k.slice(0,2)==='on')el.addEventListener(k.slice(2),v);else el.setAttribute(k,v===true?'':v)}
  for(i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;
    if(Array.isArray(c))c.forEach(function(x){if(x)el.appendChild(x)});else el.appendChild(typeof c==='string'?document.createTextNode(c):c)}
  return el;
}
var toastTimer=null;
function toast(msg,actionLabel,action){
  var el=$('toast');el.replaceChildren(h('span',{text:msg}));
  if(actionLabel)el.appendChild(h('button',{type:'button',text:actionLabel,onclick:action}));
  el.classList.add('show');clearTimeout(toastTimer);
  if(!actionLabel)toastTimer=setTimeout(function(){el.classList.remove('show')},3200);
}

/* ---------- pieces ---------- */
function groupTag(g){return h('span',{class:'g'},h('span',{class:'dot',style:'background:'+hue(g)}),g)}
function row(it,k,opts){
  opts=opts||{};var t=todayKey(),done=isDone(it,k),locked=it.kind==='daily'&&k>t;
  var meta=h('div',{class:'meta'});
  if(it.group)meta.appendChild(groupTag(it.group));
  if(it.kind==='daily'){
    if(it.days.length&&it.days.length<7)meta.appendChild(h('span',{text:repeatText(it)}));
    var s=streak(it);if(s>1)meta.appendChild(h('span',{class:'fire',text:T('streakDays',{n:s})}));
    if(locked)meta.appendChild(h('span',{text:T('notYet')}));
  }else{
    if(!it.doneAt&&it.due&&it.due<t)meta.appendChild(h('span',{class:'late',text:T('overdueSince',{date:nice(it.due,{day:'numeric',month:'short'})})}));
    else if(opts.showDue&&it.due)meta.appendChild(h('span',{text:it.due===t?T('today'):it.due===add(t,1)?T('tomorrow'):nice(it.due)}));
    if(opts.showDue&&it.doneAt)meta.appendChild(h('span',{text:T('doneOn',{date:nice(it.doneAt,{day:'numeric',month:'short'})})}));
  }
  return h('div',{class:'row'+(done?' done':'')+(locked?' locked':'')+(ui.just===it.id?' just':'')},
    h('button',{class:'hit',type:'button',id:'hit-'+it.id,'aria-pressed':done?'true':'false',disabled:locked,onclick:function(){ui.focus='hit-'+it.id;toggle(it,k)}},
      h('span',{class:'box',html:ICON.check}),
      h('span',{class:'t'},h('span',{class:'title'},h('span',{text:it.title})),meta.childNodes.length?meta:null)),
    h('button',{class:'more',type:'button','aria-label':T('editItem',{title:it.title}),text:'⋯',onclick:function(){openForm(it)}}));
}
function section(title,count,rows,emptyText){
  return h('section',{class:'sec'},
    h('div',{class:'sec-h'},h('h2',{text:title}),count!=null?h('span',{text:count}):null),
    h('div',{class:'list'},rows.length?rows:h('div',{class:'empty',text:emptyText})));
}
function chipBar(){
  var g=groups().filter(function(name){return state.items.some(function(i){return i.group===name})});
  if(ui.filter&&g.indexOf(ui.filter)<0)ui.filter='';
  if(!g.length)return null;
  var bar=h('div',{class:'chips',role:'group','aria-label':T('filterBy')},
    h('button',{class:'chip',type:'button','aria-pressed':ui.filter===''?'true':'false',text:T('all'),onclick:function(){ui.filter='';render()}}));
  g.forEach(function(name){bar.appendChild(h('button',{class:'chip',type:'button','aria-pressed':ui.filter===name?'true':'false',onclick:function(){ui.filter=ui.filter===name?'':name;render()}},
    h('span',{class:'dot',style:'background:'+hue(name)}),name))});
  return bar;
}
function quick(id,placeholder,due){
  var inp=h('input',{type:'text',id:id,maxlength:'120',placeholder:placeholder,autocomplete:'off','aria-label':placeholder});
  return h('form',{class:'quick fabgap',onsubmit:function(e){e.preventDefault();var v=inp.value.trim();if(!v)return;
    state.items.push({id:uid(),title:v,kind:'once',days:[],due:due,group:ui.filter||'',created:todayKey(),doneAt:null});ui.focus=id;commit()}},
    inp,h('button',{class:'btn',type:'submit',text:T('add')}));
}
function ring(done,total){
  var c=2*Math.PI*26,p=total?done/total:0;
  return h('div',{class:'ring',role:'img','aria-label':T('doneOfAria',{done:done,total:total}),html:
    '<svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+(c*(1-p)).toFixed(1)+'"/></svg><span>'+done+'/'+total+'</span>'});
}
function weekCard(){
  var t=todayKey(),ws=monday(t),bars=h('div',{class:'bars'}),sumD=0,sumT=0;
  for(var i=0;i<7;i++){var k=add(ws,i),c=dayCount(k),fut=k>t;if(!fut){sumD+=c.done;sumT+=c.total}
    bars.appendChild(h('div',{class:'bar'+(k===t?' now':''),title:T('dayOf',{date:nice(k),done:c.done,total:c.total})},
      h('div',{class:'col'},h('div',{class:'fill',style:'height:'+(c.total&&!fut?Math.round(c.done/c.total*100):0)+'%'})),
      h('small',{text:DAY[parse(k).getDay()].slice(0,2)})))}
  var top=0;state.items.forEach(function(x){if(x.kind==='daily')top=Math.max(top,streak(x))});
  var open=state.items.filter(function(i){return i.kind==='once'&&!i.doneAt}).length;
  return h('div',{class:'card'},h('h2',{text:T('thisWeek')}),bars,
    h('div',{class:'stats'},
      h('div',{class:'stat'},h('b',{text:sumT?Math.round(sumD/sumT*100)+'%':'0%'}),h('small',{text:T('doneSoFar')})),
      h('div',{class:'stat'},h('b',{text:String(top)}),h('small',{text:T('longestLive')})),
      h('div',{class:'stat'},h('b',{text:String(open)}),h('small',{text:T('openTodos')}))));
}
function habitCard(it){
  var t=todayKey(),start=add(monday(t),-28),grid=h('div',{class:'grid35','aria-hidden':'true'});
  for(var i=0;i<35;i++){var k=add(start,i),cls='cell';
    if(k>t)cls+=' fut';else if(ticked(it,k))cls+=' on';else if(!scheduled(it,k))cls+=' off';
    if(k===t)cls+=' now';grid.appendChild(h('div',{class:cls,title:nice(k)}))}
  var r=rate30(it);
  return h('div',{class:'card'},h('div',{class:'hab'},
    h('div',{class:'info'},h('div',{class:'title',text:it.title}),
      h('div',{class:'meta'},it.group?groupTag(it.group):null,h('span',{text:repeatText(it)})),
      h('div',{class:'stats',style:'margin-top:6px'},
        h('div',{class:'stat'},h('b',{text:String(streak(it))}),h('small',{text:T('streak')})),
        h('div',{class:'stat'},h('b',{text:String(best(it))}),h('small',{text:T('best')})),
        h('div',{class:'stat'},h('b',{text:r==null?'0%':r+'%'}),h('small',{text:T('last30')})))),
    grid));
}

/* ---------- views ---------- */
function viewToday(){
  var t=todayKey(),k=ui.day,c=dayCount(k),rel=k===t?T('today'):k===add(t,1)?T('tomorrow'):k===add(t,-1)?T('yesterday'):nice(k,{weekday:'long'});
  var days=h('div',{class:'days'});
  for(var i=0;i<7;i++){(function(d){var dc=dayCount(d),cls='day'+(d===t?' today':'')+(d<=t&&dc.total&&dc.done===dc.total?' full':d<=t&&dc.done?' part':'');
    days.appendChild(h('button',{class:cls,type:'button',id:'day-'+d,'aria-pressed':d===k?'true':'false','aria-label':nice(d,{weekday:'long',day:'numeric',month:'long'}),onclick:function(){ui.day=d;ui.focus='day-'+d;render()}},
      h('small',{text:DAY[parse(d).getDay()]}),h('b',{text:String(parse(d).getDate())}),h('i')))})(add(ui.weekStart,i))}
  function shift(n,id){ui.weekStart=add(ui.weekStart,7*n);ui.day=add(ui.day,7*n);ui.focus=id;render()}
  var hab=habitsOn(k),tasks=tasksOn(k);
  tasks.sort(function(a,b){return (a.doneAt?1:0)-(b.doneAt?1:0)});
  return h('div',{class:'sheet-wrap'},
    h('header',{class:'head'},h('div',{class:'txt'},h('div',{class:'eyebrow',text:nice(k,{day:'numeric',month:'long',year:'numeric'})}),h('h1',{text:rel})),ring(c.done,c.total)),
    h('div',{class:'week'},h('button',{class:'arrow',type:'button',id:'wkPrev','aria-label':T('prevWeek'),text:'‹',onclick:function(){shift(-1,'wkPrev')}}),days,
      h('button',{class:'arrow',type:'button',id:'wkNext','aria-label':T('nextWeek'),text:'›',onclick:function(){shift(1,'wkNext')}})),
    k!==t?h('button',{class:'link',type:'button',style:'align-self:flex-start',text:T('backToToday'),onclick:function(){ui.day=t;ui.weekStart=monday(t);render()}}):null,
    chipBar(),
    section(T('habits'),hab.length?T('doneOf',{done:hab.filter(function(i){return isDone(i,k)}).length,total:hab.length}):null,hab.map(function(i){return row(i,k)}),T('noHabitsDay')),
    section(T('todo'),tasks.length?T('doneOf',{done:tasks.filter(function(i){return i.doneAt}).length,total:tasks.length}):null,tasks.map(function(i){return row(i,k)}),T('noTodosDay')),
    quick('qToday',T('addTodoFor',{day:k===t?T('todayLower'):nice(k,{weekday:'short',day:'numeric'})}),k));
}
function viewLater(){
  var t=todayKey(),once=state.items.filter(function(i){return i.kind==='once'&&pass(i)});
  var open=once.filter(function(i){return !i.doneAt});
  var late=open.filter(function(i){return i.due&&i.due<t}),up=open.filter(function(i){return i.due&&i.due>t}),some=open.filter(function(i){return !i.due});
  var done=once.filter(function(i){return i.doneAt}).sort(function(a,b){return a.doneAt<b.doneAt?1:-1});
  function byDue(a,b){return a.due<b.due?-1:a.due>b.due?1:0}
  late.sort(byDue);up.sort(byDue);
  function rows(a){return a.map(function(i){return row(i,i.doneAt||t,{showDue:true})})}
  return h('div',{class:'sheet-wrap'},
    h('header',{class:'head'},h('div',{class:'txt'},h('div',{class:'eyebrow',text:T('openCount',{n:open.length})}),h('h1',{text:T('tabLater')}))),
    chipBar(),
    quick('qLater',T('addLater'),null),
    late.length?section(T('overdue'),String(late.length),rows(late),''):null,
    section(T('scheduled'),up.length?String(up.length):null,rows(up),T('scheduledEmpty')),
    section(T('noDate'),some.length?String(some.length):null,rows(some),T('noDateEmpty')),
    done.length?section(T('done'),String(done.length),rows(done),''):null);
}
function viewProgress(){
  var habits=state.items.filter(function(i){return i.kind==='daily'&&pass(i)});
  return h('div',{class:'sheet-wrap'},
    h('header',{class:'head'},h('div',{class:'txt'},h('div',{class:'eyebrow',text:T('lastFiveWeeks')}),h('h1',{text:T('tabProgress')}))),
    chipBar(),weekCard(),
    habits.length?habits.map(habitCard):h('div',{class:'card'},h('div',{class:'empty',style:'padding:0',text:T('noHabits')})));
}
var PLAIN_ROWS=10; /* empty lines on a sheet with no sections */
var MIN_ROWS=5; /* ruled lines shown per section, like the paper sheet; there is always at least one empty line */
var renderTimer=null;
function commitSoon(){ /* save now, redraw a moment later so the tap that ended the typing still lands */
  state.updatedAt=Date.now();saveLocal();clearTimeout(renderTimer);renderTimer=setTimeout(render,180);
}
function viewSheet(){
  var t=todayKey(),ym=ui.month,y=+ym.slice(0,4),m=+ym.slice(5,7),n=new Date(y,m,0).getDate(),keys=[],i;
  for(i=1;i<=n;i++)keys.push(ym+'-'+String(i).padStart(2,'0'));
  function shift(d,id){var x=new Date(y,m-1+d,1);ui.month=key(x).slice(0,7);ui.focus=id;render()}
  var title=new Date(y,m-1,1).toLocaleDateString(LANG,{month:'long',year:'numeric'});
  var plain=!groups().length; /* no sections: a plain ruled sheet with no side column */
  var head=h('tr',null,plain?null:h('th',{class:'vsec'}),h('th',{class:'name',scope:'col',text:T('date')+':'}));
  keys.forEach(function(k){head.appendChild(h('th',{class:'d'+(k===t?' now':''),scope:'col','aria-current':k===t?'date':null},h('small',{text:DAY[parse(k).getDay()].slice(0,2)}),String(parse(k).getDate())))});
  head.appendChild(h('th',{class:'sum',scope:'col',text:T('total')}));
  var table=h('table',{class:'sheet'+(plain?' nosec':'')},h('thead',null,head));
  var habits=state.items.filter(function(x){return x.kind==='daily'}),names=groups().slice();
  if(plain||habits.some(function(x){return !x.group}))names.push('');
  names.forEach(function(g,gi){
    var rows=habits.filter(function(x){return x.group===g}),body=h('tbody'),label=g||T('noSection');
    var blanks=g?Math.max(1,MIN_ROWS-rows.length):plain?Math.max(1,PLAIN_ROWS-rows.length):1;
    var secCell=plain?null:h('th',{class:'vsec',scope:'rowgroup',rowspan:String(rows.length+blanks)},
      g?h('button',{class:'seclabel',type:'button',id:'sec-'+gi,title:T('sectionOptions',{name:g}),'aria-label':T('sectionOptions',{name:g}),onclick:function(){openSection(g)}},h('span',{text:g}))
       :h('div',{class:'seclabel'},h('span',{text:label})));
    function put(tr){if(secCell){tr.insertBefore(secCell,tr.firstChild);secCell=null}body.appendChild(tr)}
    rows.forEach(function(it){
      var inp=h('input',{class:'rowinp',type:'text',id:'rn-'+it.id,value:it.title,maxlength:'120','aria-label':T('rowName'),autocomplete:'off',
        onchange:function(){var v=inp.value.trim();if(!v||v===it.title){inp.value=it.title;return}it.title=v;commitSoon()},
        onkeydown:function(e){if(e.key==='Enter')inp.blur();else if(e.key==='Escape'){inp.value=it.title;inp.blur()}}});
      var tr=h('tr',null,h('th',{class:'name',scope:'row'},h('div',{class:'namecell'},inp,
        h('button',{class:'rowmore',type:'button',id:'ro-'+it.id,title:T('rowOptions',{title:it.title}),'aria-label':T('rowOptions',{title:it.title}),text:'⋯',onclick:function(){openForm(it)}})))),cnt=0;
      keys.forEach(function(k){
        var fut=k>t,sch=onDay(it,k),on=ticked(it,k);if(on)cnt++;
        tr.appendChild(h('td',{class:k===t?'nowcol':null},h('button',{class:'c'+(on?' on':'')+(!sch?' off':''),type:'button',id:'c-'+it.id+'-'+k,disabled:fut||(!sch&&!on),
          'aria-pressed':on?'true':'false','aria-label':T('cellLabel',{title:it.title,date:nice(k)}),html:ICON.check,onclick:function(){toggleCell(it,k)}})));
      });
      tr.appendChild(h('td',{class:'sum',text:String(cnt)}));put(tr);
    });
    for(var b=0;b<blanks;b++)(function(b){
      var inp=h('input',{class:'rowinp',type:'text',id:'blank-'+gi+'-'+b,maxlength:'120',placeholder:b===0?T('writeHere'):null,'aria-label':T('newRowIn',{section:label}),autocomplete:'off',
        onchange:function(){create(false)},onkeydown:function(e){if(e.key==='Enter'){e.preventDefault();create(true)}}});
      function create(stay){var v=inp.value.trim();if(!v)return;inp.value='';
        state.items.push({id:uid(),title:v,kind:'daily',days:[],due:null,group:g,created:t,doneAt:null});state.welcome=false;
        if(stay){ui.focus='blank-'+gi+'-0';commit()}else commitSoon()}
      var tr=h('tr',null,h('th',{class:'name',scope:'row'},h('div',{class:'namecell'},inp)));
      keys.forEach(function(k){tr.appendChild(h('td',{class:k===t?'nowcol':null}))});
      tr.appendChild(h('td',{class:'sum'}));put(tr);
    })(b);
    table.appendChild(body);
  });
  var ns=h('input',{type:'text',id:'newSection',maxlength:'40',placeholder:T('newSectionName'),'aria-label':T('newSectionName'),autocomplete:'off'});
  var thisYm=t.slice(0,7);
  return h('div',{class:'sheet-wrap sheet-wide'},
    h('header',{class:'head'},h('div',{class:'txt'},h('h1',{text:T('sheetEyebrow')})),
      h('div',{class:'monthbar'},
        h('button',{class:'arrow',type:'button',id:'mPrev','aria-label':T('prevMonth'),text:'‹',onclick:function(){shift(-1,'mPrev')}}),
        ym!==thisYm?h('button',{class:'mlabel',type:'button',id:'mNow',title:T('thisMonth'),'aria-label':title+'. '+T('thisMonth'),text:title,onclick:function(){ui.month=thisYm;ui.focus='mPrev';render()}})
                   :h('div',{class:'mlabel',text:title}),
        h('button',{class:'arrow',type:'button',id:'mNext','aria-label':T('nextMonth'),text:'›',onclick:function(){shift(1,'mNext')}}))),
    state.welcome?h('div',{class:'note'},h('p',{text:T('welcome')}),
      h('button',{class:'link',type:'button',text:T('gotIt'),onclick:function(){state.welcome=false;commit()}})):null,
    h('div',{class:'scroll',tabindex:'-1'},table),
    h('form',{class:'quick fabgap',style:'max-width:420px',onsubmit:function(e){e.preventDefault();if(addSection(ns.value)){ui.focus='newSection';commit()}}},ns,h('button',{class:'btn ghost',type:'submit',text:T('addSection')})),
    h('div',{class:'btnrow noprint'},h('button',{class:'btn ghost',type:'button',id:'printBtn',text:T('printBtn'),onclick:function(){window.print()}})),
    h('p',{class:'help',text:T('sheetHelp')+' '+T(plain?'sheetHelpPlain':'sheetHelpSections')}));
}

/* ---------- more: install, backup, share ---------- */
function isStandalone(){return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}
function appUrl(){return location.origin+location.pathname.replace(/index\.html$/,'')}
function exportData(){
  var payload={app:'daymark',format:2,exportedAt:new Date().toISOString(),data:state};
  var name='daymark-backup-'+todayKey()+'.json';
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  function finish(){try{localStorage.setItem('daymark-lastExport',todayKey())}catch(e){}toast(T('exported'));render()}
  function download(){
    var url=URL.createObjectURL(blob),a=h('a',{href:url,download:name,style:'display:none'});
    document.body.appendChild(a);a.click();
    setTimeout(function(){a.remove();URL.revokeObjectURL(url)},1500);finish();
  }
  /* iPhone and iPad: a home-screen app cannot reliably save a download, so hand the file to the share sheet (Save to Files). */
  var ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&navigator.canShare&&typeof File==='function'){
    var file=new File([blob],name,{type:'application/json'});
    if(navigator.canShare({files:[file]})){
      navigator.share({files:[file]}).then(finish,function(e){if(!e||e.name!=='AbortError')download()});return;
    }
  }
  download();
}
function importData(file){
  var r=new FileReader();
  r.onerror=function(){toast(T('importBad'))};
  r.onload=function(){
    var raw,next;
    try{raw=JSON.parse(String(r.result))}catch(e){toast(T('importBad'));return}
    next=normalize(raw&&raw.data&&typeof raw.data==='object'?raw.data:raw);
    if(!next){toast(T('importBad'));return}
    var when=raw&&raw.exportedAt&&!isNaN(Date.parse(raw.exportedAt))?new Date(raw.exportedAt).toLocaleDateString(LANG,{day:'numeric',month:'long',year:'numeric'}):T('importUnknownDate');
    askConfirm(T('importTitle'),T('importBody',{date:when,items:next.items.length,sections:next.sections.length}),T('importOk'),function(){
      next.welcome=false;state=next;ui.filter='';commit();toast(T('imported'));
    });
  };
  r.readAsText(file);
}
$('importFile').addEventListener('change',function(){var f=this.files&&this.files[0];this.value='';if(f)importData(f)});
function shareApp(){
  var url=appUrl();
  if(navigator.share){navigator.share({title:'Daymark',text:T('shareText'),url:url}).catch(function(){});return}
  copyLink();
}
function copyLink(){
  var url=appUrl();
  function ok(){toast(T('copied'))}
  function fallback(){var ta=h('textarea',{style:'position:fixed;opacity:0'});ta.value=url;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){}ta.remove()}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(ok,fallback);else fallback();
}
function viewMore(){
  var last=null;try{last=localStorage.getItem('daymark-lastExport')}catch(e){}
  var install=h('div',{class:'card'},h('h2',{text:T('installTitle')}));
  if(isStandalone())install.appendChild(h('p',{text:T('installed')}));
  else{
    if(ui.installEvt)install.appendChild(h('div',{class:'btnrow'},h('button',{class:'btn',type:'button',text:T('installBtn'),onclick:function(){
      var e=ui.installEvt;ui.installEvt=null;e.prompt();if(e.userChoice)e.userChoice.then(render,render)}})));
    install.appendChild(h('p',{text:T('installHint')}));
  }
  var langs=Object.keys(I18N.strings),langCard=null;
  if(langs.length>1){
    var sel=h('select',{id:'langSel','aria-label':T('language'),onchange:function(){try{localStorage.setItem('daymark-lang',sel.value)}catch(e){}location.reload()}});
    langs.forEach(function(c){sel.appendChild(h('option',{value:c,text:I18N.strings[c].langName||c,selected:c===LANG}))});
    langCard=h('div',{class:'card'},h('h2',{text:T('language')}),h('div',{class:'field'},sel));
  }
  return h('div',{class:'sheet-wrap'},
    h('header',{class:'head'},h('div',{class:'txt'},h('div',{class:'eyebrow',text:T('moreEyebrow')}),h('h1',{text:T('tabMore')}))),
    h('div',{class:'card'},h('h2',{text:T('backupTitle')}),h('p',{text:T('backupBody')}),
      h('div',{class:'btnrow'},
        h('button',{class:'btn',type:'button',id:'exportBtn',text:T('exportBtn'),onclick:exportData}),
        h('button',{class:'btn ghost',type:'button',id:'importBtn',text:T('importBtn'),onclick:function(){$('importFile').click()}})),
      h('p',{text:last&&DATE_RE.test(last)?T('lastExport',{date:nice(last,{day:'numeric',month:'long',year:'numeric'})}):T('neverExported')})),
    install,
    h('div',{class:'card'},h('h2',{text:T('shareTitle')}),h('p',{text:T('shareBody')}),h('p',{style:'overflow-wrap:anywhere;color:var(--ink);font-weight:500',text:appUrl()}),
      h('div',{class:'btnrow'},
        navigator.share?h('button',{class:'btn',type:'button',text:T('shareBtn'),onclick:shareApp}):null,
        h('button',{class:'btn'+(navigator.share?' ghost':''),type:'button',text:T('copyBtn'),onclick:copyLink}))),
    langCard,
    h('div',{class:'card'},h('h2',{text:T('eraseTitle')}),h('p',{text:T('eraseBody')}),
      h('div',{class:'btnrow'},h('button',{class:'btn danger',type:'button',text:T('eraseBtn'),onclick:function(){
        askConfirm(T('eraseConfirmTitle'),T('eraseConfirmBody'),T('eraseOk'),function(){state=fresh();ui.filter='';commit();toast(T('erased'))})}}))),
    h('div',{class:'foot',text:T('version',{v:VERSION})+' · '+T('savedLocal')}));
}

/* ---------- render ---------- */
function render(){
  clearTimeout(renderTimer);
  var main=$('main'),v=ui.tab==='sheet'?viewSheet():ui.tab==='later'?viewLater():ui.tab==='progress'?viewProgress():ui.tab==='more'?viewMore():viewToday();
  var keepY=main.scrollTop;
  main.replaceChildren(v);main.scrollTop=keepY;
  $('app').classList.toggle('wide',ui.tab==='sheet');
  $('fab').hidden=ui.tab==='more';
  var tabs=$('tabs');tabs.replaceChildren();
  TABS.forEach(function(id){
    tabs.appendChild(h('a',{class:'tab',href:'#'+id,'aria-current':ui.tab===id?'page':null},h('span',{html:ICON[id]}),T(TABKEY[id])))});
  $('aside').replaceChildren(h('div',{class:'stack'},weekCard(),
    h('div',{class:'card'},h('h2',{text:T('howTitle')}),h('p',{text:T('howBody')}))));
  var sc=main.querySelector('.scroll');
  if(sc){
    var nw=sc.querySelector('th.now');
    if(ui.sheetM!==ui.month||ui.sheetX==null)ui.sheetX=nw?Math.max(0,nw.offsetLeft-sc.clientWidth/2):0;
    sc.scrollLeft=ui.sheetX;ui.sheetM=ui.month;
    sc.addEventListener('scroll',function(){ui.sheetX=sc.scrollLeft},{passive:true});
  }
  if(ui.focus){var f=$(ui.focus);if(f&&!f.disabled)f.focus({preventScroll:true});ui.focus=null}
  ui.just=null;
}

/* ---------- dialogs ---------- */
var lastFocus=null;
function trap(e,box){
  if(e.key!=='Tab')return;
  var f=Array.prototype.filter.call(box.querySelectorAll('button,input,select,a[href]'),function(el){return !el.disabled&&el.offsetParent!==null});
  if(!f.length)return;var first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
}
var confirmCb=null,confirmFocus=null;
function askConfirm(title,body,okLabel,cb){
  confirmFocus=document.activeElement;confirmCb=cb;
  $('cTitle').textContent=title;$('cBody').textContent=body;$('cOk').textContent=okLabel;
  $('confirm').classList.add('open');$('cCancel').focus();
}
function closeConfirm(run){
  if(!$('confirm').classList.contains('open'))return;
  $('confirm').classList.remove('open');var cb=confirmCb;confirmCb=null;
  if(confirmFocus&&document.contains(confirmFocus))confirmFocus.focus();
  if(run&&cb)cb();
}
$('cCancel').addEventListener('click',function(){closeConfirm(false)});
$('cOk').addEventListener('click',function(){closeConfirm(true)});
$('confirm').addEventListener('click',function(e){if(e.target===$('confirm'))closeConfirm(false)});
$('confirm').addEventListener('keydown',function(e){trap(e,$('confirm'))});

var F={id:null,kind:'once',when:'today',days:[],confirmDel:false};
function segSet(el,v){Array.prototype.forEach.call(el.children,function(b){b.setAttribute('aria-pressed',b.getAttribute('data-v')===v?'true':'false')})}
function syncForm(){
  segSet($('fKind'),F.kind);segSet($('fWhen'),F.when);
  $('fWhenWrap').hidden=F.kind!=='once';$('fDaysWrap').hidden=F.kind!=='days';$('fDate').hidden=F.when!=='date';
  Array.prototype.forEach.call($('fDays').children,function(b){b.setAttribute('aria-pressed',F.days.indexOf(+b.getAttribute('data-d'))>=0?'true':'false')});
  $('fNewGroup').hidden=$('fGroup').value!=='__new';
  var cur=F.id?state.items.filter(function(i){return i.id===F.id})[0]:null,sib=[];
  if(cur&&cur.kind==='daily')sib=state.items.filter(function(x){return x.kind==='daily'&&x.group===cur.group});
  $('fPosWrap').hidden=!(cur&&cur.kind==='daily'&&sib.length>1);
  $('fUp').disabled=sib.indexOf(cur)<=0;$('fDown').disabled=sib.indexOf(cur)<0||sib.indexOf(cur)>=sib.length-1;
  $('fDelete').hidden=!F.id;$('fDelete').textContent=F.confirmDel?T('tapAgainDelete'):T('del');
  $('fDelete').classList.toggle('solid',F.confirmDel);
}
function openForm(it){
  var t=todayKey();F.id=it?it.id:null;F.confirmDel=false;lastFocus=document.activeElement;
  F.kind=it?(it.kind==='daily'?(it.days.length&&it.days.length<7?'days':'daily'):'once'):(ui.tab==='sheet'||ui.tab==='progress'?'daily':'once');
  F.days=it&&it.days.length?it.days.slice():[1,2,3,4,5];
  var due=it?it.due:(ui.tab==='today'?ui.day:ui.tab==='later'?null:t);
  F.when=!due?'none':due===t?'today':due===add(t,1)?'tomorrow':'date';
  $('fDate').value=due||t;
  $('dlgTitle').textContent=it?T('editItemTitle'):T('newItem');$('fTitle').value=it?it.title:'';
  var sel=$('fGroup');sel.replaceChildren(h('option',{value:'',text:T('noSection')}));
  groups().forEach(function(g){sel.appendChild(h('option',{value:g,text:g}))});
  sel.appendChild(h('option',{value:'__new',text:T('newSection')}));
  sel.value=it?it.group:(ui.filter||'');$('fNewGroup').value='';
  syncForm();$('overlay').classList.add('open');setTimeout(function(){$('fTitle').focus()},30);
}
function closeForm(){
  if(!$('overlay').classList.contains('open'))return;
  $('overlay').classList.remove('open');
  if(lastFocus&&document.contains(lastFocus))lastFocus.focus();
  else{var el=F.id&&$('ro-'+F.id);if(el)el.focus()}
}

/* section options: rename, move, delete */
var S={name:null};
function syncSection(){var i=state.sections.indexOf(S.name);$('sUp').disabled=i<=0;$('sDown').disabled=i<0||i>=state.sections.length-1}
function openSection(g){S.name=g;$('sName').value=g;syncSection();$('secDlg').classList.add('open');setTimeout(function(){$('sName').focus();$('sName').select()},30)}
function applySectionName(){var v=$('sName').value.trim().slice(0,40);if(v&&v!==S.name&&groups().indexOf(v)<0){renameSection(S.name,v);S.name=v}else $('sName').value=S.name}
function closeSection(){
  if(!$('secDlg').classList.contains('open'))return;
  $('secDlg').classList.remove('open');var el=$('sec-'+state.sections.indexOf(S.name));if(el)el.focus();
}
function nudgeSection(dir){applySectionName();moveSection(S.name,dir);syncSection();var b=dir<0?$('sUp'):$('sDown');if(b.disabled)$('sDone').focus();else b.focus()}
$('sUp').addEventListener('click',function(){nudgeSection(-1)});
$('sDown').addEventListener('click',function(){nudgeSection(1)});
$('sForm').addEventListener('submit',function(e){e.preventDefault();applySectionName();closeSection()});
$('sDelete').addEventListener('click',function(){
  var g=S.name,used=state.items.filter(function(x){return x.group===g}).length;
  askConfirm(T('delSectionTitle'),used?T('delSectionUsed',{name:g,n:used}):T('delSectionEmpty',{name:g}),T('del'),function(){$('secDlg').classList.remove('open');deleteSection(g)});
});
$('secDlg').addEventListener('click',function(e){if(e.target===$('secDlg'))closeSection()});
$('secDlg').addEventListener('keydown',function(e){trap(e,$('secDlg'))});
WD.forEach(function(d){$('fDays').appendChild(h('button',{type:'button','data-d':String(d),text:DAY[d].slice(0,2),'aria-label':new Date(2024,0,7+d).toLocaleDateString(LANG,{weekday:'long'}),
  onclick:function(){var i=F.days.indexOf(d);if(i>=0)F.days.splice(i,1);else F.days.push(d);syncForm()}}))});
$('fKind').addEventListener('click',function(e){var b=e.target.closest('button');if(b){F.kind=b.getAttribute('data-v');syncForm()}});
$('fWhen').addEventListener('click',function(e){var b=e.target.closest('button');if(b){F.when=b.getAttribute('data-v');syncForm()}});
$('fGroup').addEventListener('change',function(){syncForm();if($('fGroup').value==='__new')$('fNewGroup').focus()});
function nudge(dir){var it=state.items.filter(function(i){return i.id===F.id})[0];if(!it)return;
  moveRow(it,dir);syncForm();var b=dir<0?$('fUp'):$('fDown');if(b.disabled)$('fCancel').focus();else b.focus()}
$('fUp').addEventListener('click',function(){nudge(-1)});
$('fDown').addEventListener('click',function(){nudge(1)});
$('fCancel').addEventListener('click',closeForm);
$('overlay').addEventListener('click',function(e){if(e.target===$('overlay'))closeForm()});
$('overlay').addEventListener('keydown',function(e){trap(e,$('overlay'))});
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  if($('confirm').classList.contains('open'))closeConfirm(false);else{closeSection();closeForm()}
});
$('fDelete').addEventListener('click',function(){
  if(!F.confirmDel){F.confirmDel=true;syncForm();return}
  deleteItem(F.id);lastFocus=null;closeForm();commit();
});
$('form').addEventListener('submit',function(e){
  e.preventDefault();var title=$('fTitle').value.trim();if(!title){$('fTitle').focus();return}
  var t=todayKey(),g=$('fGroup').value;if(g==='__new')g=$('fNewGroup').value.trim();
  g=(g||'').slice(0,40);
  var it=F.id?state.items.filter(function(i){return i.id===F.id})[0]:null;
  if(!it){it={id:uid(),created:t,doneAt:null};state.items.push(it)}
  it.title=title;it.group=g;if(g&&state.sections.indexOf(g)<0)state.sections.push(g);
  if(F.kind==='once'){it.kind='once';it.days=[];it.due=F.when==='today'?t:F.when==='tomorrow'?add(t,1):F.when==='date'?($('fDate').value||t):null}
  else{it.kind='daily';it.due=null;it.doneAt=null;it.days=F.kind==='days'&&F.days.length&&F.days.length<7?F.days.slice().sort():[]}
  state.welcome=false;closeForm();commit();
});
$('newBtn').addEventListener('click',function(){openForm(null)});
$('fab').addEventListener('click',function(){openForm(null)});

/* ---------- routing, day rollover ---------- */
function route(){var hsh=(location.hash||'').replace('#','');ui.tab=TABS.indexOf(hsh)>=0?hsh:'sheet';$('main').scrollTop=0;render()}
window.addEventListener('hashchange',route);
var lastDay=todayKey();
function rollover(){
  var t=todayKey();if(t===lastDay)return;
  if(ui.day===lastDay){ui.day=t;ui.weekStart=monday(t)}
  if(ui.month===lastDay.slice(0,7))ui.month=t.slice(0,7);
  lastDay=t;render();
}
document.addEventListener('visibilitychange',function(){if(!document.hidden)rollover()});
setInterval(rollover,60000);

/* ---------- install prompt, offline cache ---------- */
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();ui.installEvt=e;if(ui.tab==='more')render()});
window.addEventListener('appinstalled',function(){ui.installEvt=null;if(ui.tab==='more')render()});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      function offer(w){if(!w||!navigator.serviceWorker.controller)return;
        toast(T('updateReady'),T('reload'),function(){w.postMessage('skipWaiting')})}
      if(reg.waiting)offer(reg.waiting);
      reg.addEventListener('updatefound',function(){var w=reg.installing;if(!w)return;
        w.addEventListener('statechange',function(){if(w.state==='installed')offer(w)})});
      document.addEventListener('visibilitychange',function(){if(!document.hidden)reg.update().catch(function(){})});
    }).catch(function(){});
    var reloading=false,had=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',function(){if(!had){had=true;return}if(reloading)return;reloading=true;location.reload()});
  });
}

route();
})();
