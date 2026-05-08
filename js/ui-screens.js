/* ═══════════════════════════════════════════════════════
   SCREEN MANAGEMENT
═══════════════════════════════════════════════════════ */
function showScreen(id){
  const next=document.getElementById(id);
  const current=document.querySelector('.screen.active');
  if(current&&current!==next){
    current.classList.add('exit');
    setTimeout(()=>{current.classList.remove('active','exit');},220);
  } else if(current){
    current.classList.remove('active');
  }
  setTimeout(()=>{
    next.classList.add('active');
  },current?200:0);
  if(id==='level-screen')setTimeout(buildLvGrid,200);
  if(id==='pick-screen')setTimeout(buildPick,200);
  if(id==='intro-screen'){setTimeout(()=>{buildIntroMons();stopBGM();},200);}
  if(id!=='game-screen')stopBGM();
}

function buildIntroMons(){
  document.getElementById('im1').innerHTML=monImg(MONS[0],120);
  document.getElementById('im2').innerHTML=monImg(MONS[4],120);
}

/* ═══════════════════════════════════════════════════════
   QUESTION POOL — data embedded from questions.xlsx
   Edit questions.xlsx then run: python tools/embed_from_xlsx.py
═══════════════════════════════════════════════════════ */
function getBuffer(lvId){
  const lv=FIXED_LEVELS.find(l=>l.id===lvId);
  if(!lv)return[];
  return lv.buffer;
}

/* Pick 11 unique random questions + reserve 1 for sudden death (all from same shuffled pool, no repeats) */
function pickQuestions(lv){
  const buf=getBuffer(lv.id).map(q=>JSON.parse(JSON.stringify(q)));
  for(let i=buf.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[buf[i],buf[j]]=[buf[j],buf[i]];}
  const picked=buf.slice(0,Math.min(12,buf.length));
  // Reserve the 12th as the sudden-death question — guaranteed unique from the 11 battle questions
  S._sdQuestion=picked.length>=12?picked[11]:null;
  return picked.slice(0,11);
}

/* ═══════════════════════════════════════════════════════
   LEVEL GRID — fixed 6 levels, no containers
═══════════════════════════════════════════════════════ */
function buildLvGrid(){
  const wrap=document.getElementById('lv-containers-wrap');
  if(!wrap)return;
  wrap.innerHTML='';
  const grid=document.createElement('div');
  grid.className='lv-grid';
  grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;max-width:880px;width:100%;';
  FIXED_LEVELS.forEach((lv,idx)=>{
    const c=document.createElement('div');c.className='lv-card';
    c.style.animationDelay=(idx*60)+'ms';
    const ic=(lv.icon||'').trim()||'◆';
    c.innerHTML=`
      <button class="lv-manage" onclick="event.stopPropagation();requirePin(()=>openBufferManager('${lv.id}'))">📋 MANAGE</button>
      <div class="lv-icon-wrap"><span class="lv-icon-ring"></span><span class="lv-icon-deco">${ic}</span></div>
      <div class="lv-name">${lv.name}</div>
    `;
    c.onclick=()=>requirePin(()=>selLv(lv));
    grid.appendChild(c);
  });
  wrap.appendChild(grid);
  buildLvDecos();
}

/* Populate left/right floating Pokémon panels on level select */
function buildLvDecos(){
  const left=document.getElementById('lv-deco-left');
  const right=document.getElementById('lv-deco-right');
  if(!left||!right)return;
  left.innerHTML='';right.innerHTML='';
  // Split 9 mons: 4 left, 5 right (or however many exist)
  const leftMons =[MONS[0],MONS[1],MONS[6],MONS[7]];     // Dragonite, Ivysaur, Pikachu, Typhlosion
  const rightMons=[MONS[2],MONS[3],MONS[4],MONS[5],MONS[8]]; // Onix, MegaCharizard, Bayleef, Blastoise, Jolteon
  const durations=['3.8s','4.5s','5.1s','4.2s','3.5s'];
  const delays   =['0s','-.9s','-2.1s','-1.4s','-.6s'];
  const rots     =[[-3,3],[-2,4],[-4,2],[-1,3],[-3,1]];
  leftMons.forEach((mon,i)=>{
    if(!mon)return;
    const w=document.createElement('div');
    w.className='lv-deco-mon';
    w.style.setProperty('--deco-glow',mon.color||'#fff');
    w.style.setProperty('--deco-dur',durations[i%durations.length]);
    w.style.setProperty('--deco-delay',delays[i%delays.length]);
    w.style.setProperty('--deco-rot0',rots[i][0]+'deg');
    w.style.setProperty('--deco-rot1',rots[i][1]+'deg');
    w.innerHTML=monImg(mon,90);
    left.appendChild(w);
  });
  rightMons.forEach((mon,i)=>{
    if(!mon)return;
    const w=document.createElement('div');
    w.className='lv-deco-mon';
    w.style.setProperty('--deco-glow',mon.color||'#fff');
    w.style.setProperty('--deco-dur',durations[(i+2)%durations.length]);
    w.style.setProperty('--deco-delay',delays[(i+1)%delays.length]);
    w.style.setProperty('--deco-rot0',rots[(i+1)%rots.length][0]+'deg');
    w.style.setProperty('--deco-rot1',rots[(i+1)%rots.length][1]+'deg');
    w.innerHTML=monImg(mon,90);
    right.appendChild(w);
  });
}

function selLv(lv){S.level=lv;showScreen('pick-screen');}

/* ═══════════════════════════════════════════════════════
   BUFFER MANAGER
═══════════════════════════════════════════════════════ */
let _bufLvId=null;

function openBufferManager(lvId){
  _bufLvId=lvId;
  const lv=FIXED_LEVELS.find(l=>l.id===lvId);
  if(!lv)return;
  document.getElementById('buf-lv-icon').textContent=(lv.icon||'').trim()||'◆';
  document.getElementById('buf-lv-name').textContent=lv.name+' — QUESTION POOL';
  renderBufferList();
  showScreen('buffer-screen');
}

function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function renderBufferList(){
  const lv=FIXED_LEVELS.find(l=>l.id===_bufLvId);
  if(!lv)return;
  const allQ=getBuffer(_bufLvId);
  document.getElementById('buf-lv-count').textContent=allQ.length+' QUESTIONS IN POOL';
  const list=document.getElementById('buf-list');
  list.innerHTML='';
  if(!allQ.length){list.innerHTML='<div class="buf-empty">NO QUESTIONS IN POOL</div>';return;}
  const cols=['#4ade80','#fbbf24','#f87171','#a78bfa'];
  const labs=['A','B','C','D'];
  allQ.forEach((q,qi)=>{
    const wrap=document.createElement('div');
    wrap.className='buf-q buf-q-readonly';wrap.id='bufq-'+qi;
    const optsHtml=q.opts.map((o,oi)=>{
      const mark=q.ans===oi?' correct':'';
      return `<div class="buf-ro-opt${mark}"><span style="color:${cols[oi]};font-weight:900;margin-right:6px;">${labs[oi]}.</span>${escHtml(o)}</div>`;
    }).join('');
    wrap.innerHTML=`
      <div class="buf-q-head">
        <span class="buf-q-num">#${qi+1}</span>
        <span class="buf-q-text">${escHtml(q.q)||'<em style="color:#3a3a5c">No text</em>'}</span>
      </div>
      <div style="margin-top:8px;">
        <div style="font-size:9px;color:#6060a0;font-weight:700;letter-spacing:1px;font-family:Orbitron,monospace;margin-bottom:5px;">OPTIONS · CORRECT = ${labs[q.ans]}</div>
        ${optsHtml}
      </div>
    `;
    list.appendChild(wrap);
  });
}

