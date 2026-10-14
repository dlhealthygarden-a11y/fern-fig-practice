// Fern & Fig demo — vanilla JS, no deps. Fictional data only.
document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const DATA=JSON.parse($('#ff-data').textContent);
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};

// ---- theme ----
const themeBtn=$('#theme');
function applyTheme(t){document.documentElement.dataset.theme=t;if(themeBtn){themeBtn.setAttribute('aria-pressed',t==='dark');themeBtn.textContent=t==='dark'?'☀':'☾';}}
applyTheme(store('ff-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
themeBtn?.addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';store('ff-theme',t);applyTheme(t);});

// ---- open-now badge ----
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const fmt=m=>{const h=Math.floor(m/60),mm=m%60;return `${(h%12)||12}${mm?':'+String(mm).padStart(2,'0'):''} ${h<12||h===24?'AM':'PM'}`};
const toMin=s=>{const[h,m]=s.split(':').map(Number);return h*60+m};
function status(hours,now=new Date()){
  const d=now.getDay(),m=now.getHours()*60+now.getMinutes(),t=hours[DAYS[d]];
  if(t&&m>=toMin(t[0])&&m<toMin(t[1]))return{open:true,text:`Open now · Closes ${fmt(toMin(t[1]))}`};
  for(let i=0;i<8;i++){const dd=(d+i)%7,tt=hours[DAYS[dd]];if(!tt)continue;const o=toMin(tt[0]);if(i===0&&m>=o)continue;
    return{open:false,text:`Closed · Opens ${i===0?'':i===1?'tomorrow ':DAYS[dd][0].toUpperCase()+DAYS[dd].slice(1)+' '}${fmt(o)}`};}
  return{open:false,text:'Closed'};
}
window.ffStatus=status;

// ---- store picker ----
const picker=$('#store');
function setStore(id){
  const s=DATA.stores.find(x=>x.id===id)||DATA.stores[0];store('ff-store',s.id);if(picker)picker.value=s.id;
  $$('[data-order]').forEach(a=>a.href=s.order);
  $$('[data-tel]').forEach(a=>{a.href='tel:'+s.tel;});
  $$('[data-store-name]').forEach(e=>e.textContent=s.name);
  const st=status(s.hours);$$('[data-badge]').forEach(b=>{b.textContent=st.text;b.classList.toggle('closed',!st.open);});
  $$('.store').forEach(c=>c.dataset.selected=c.dataset.id===s.id);
}
picker?.addEventListener('change',e=>setStore(e.target.value));
$$('[data-pick]').forEach(b=>b.addEventListener('click',()=>setStore(b.dataset.pick)));
setStore(store('ff-store'));
setInterval(()=>setStore(store('ff-store')),60000);

// ---- scroll reveal ----
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduce&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -10% 0px'});$$('.reveal').forEach(el=>io.observe(el));}
else $$('.reveal').forEach(el=>el.classList.add('in'));

// ---- catering form (demo, no backend) ----
const form=$('#cater');
if(form){
  const rules={name:v=>v.trim().length>1||'Please enter your name.',email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)||'Enter an email like name@example.com.',msg:v=>v.trim().length>=10||'Tell us a little about your event (10+ characters).'};
  const check=el=>{const r=rules[el.name](el.value),err=$('#'+el.name+'-err');const bad=r!==true;el.setAttribute('aria-invalid',bad);err.textContent=bad?r:'';return !bad};
  Object.keys(rules).forEach(n=>form.elements[n].addEventListener('blur',e=>check(e.target)));
  form.addEventListener('submit',e=>{e.preventDefault();
    if(form.elements.company.value){return;} // honeypot: silently drop bots
    const fields=Object.keys(rules).map(n=>form.elements[n]);const ok=fields.map(check);const first=fields[ok.indexOf(false)];
    if(first){first.focus();return;}
    const done=$('#cater-done');form.hidden=true;done.hidden=false;done.focus();
  });
}

// ---- menu search + filters ----
const q=$('#q');
if(q){
  const items=$$('.item'),chips=$$('.chip'),live=$('#count'),secs=$$('main section[id]');
  function run(){
    const term=q.value.trim().toLowerCase(),on=chips.filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>c.dataset.diet);let n=0;
    items.forEach(it=>{const d=(it.dataset.diet||'').split(' ');const show=it.textContent.toLowerCase().includes(term)&&on.every(x=>d.includes(x));it.hidden=!show;if(show)n++;});
    secs.forEach(s=>{const any=$$('.item',s).some(i=>!i.hidden);s.hidden=!any;});
    live.textContent=n?`${n} item${n>1?'s':''} shown`:'No items match. Try clearing a filter.';
  }
  q.addEventListener('input',run);
  chips.forEach(c=>c.addEventListener('click',()=>{c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')!=='true');run();}));
  // sticky category nav highlighting
  const links=$$('.cats a'),ul=$('.cats ul');let lock=0;
  const setActive=id=>links.forEach(l=>{if(l.hash==='#'+id){l.setAttribute('aria-current','true');ul.scrollTo({left:l.offsetLeft-ul.clientWidth/2+l.offsetWidth/2});}else l.removeAttribute('aria-current');});
  const onScroll=()=>{if(Date.now()<lock)return;const vis=secs.filter(s=>!s.hidden);if(!vis.length)return;let id=vis[0].id;const line=($('.mtools').offsetHeight||0)+20;
    vis.forEach(s=>{if(s.getBoundingClientRect().top<=line)id=s.id;});if(innerHeight+scrollY>=document.documentElement.scrollHeight-2)id=vis.at(-1).id;setActive(id);};
  let raf=0;addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;onScroll();});},{passive:true});
  links.forEach(l=>l.addEventListener('click',()=>{setActive(l.hash.slice(1));lock=Date.now()+800;}));
  onScroll();
}
