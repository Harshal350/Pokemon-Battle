/* ═══════════════════════════════════════════════════════
   START BATTLE
═══════════════════════════════════════════════════════ */
function runBattleIntroAnimation(done){
  const ov=document.getElementById('battle-intro-overlay');
  const a=document.getElementById('bi-p1');
  const b=document.getElementById('bi-p2');
  const t2=document.getElementById('battle-intro-sub');

  // ── Full reset: strip both classes, force reflow so CSS animations restart cleanly ──
  ov.classList.remove('show','go');
  ov.setAttribute('aria-hidden','true');
  ov.querySelectorAll('.bi-dot').forEach(d=>d.remove());
  void ov.offsetWidth; // force reflow

  if(t2) t2.textContent=`${S.p1.mon.name}  VS  ${S.p2.mon.name}`;
  const m1=monImg(S.p1.mon,140);
  const m2=monImg(S.p2.mon,140);
  a.innerHTML='<div class="pk-card-sheen">'+m1+'</div><div class="pk-card-name">'+escHtml(S.p1.mon.name)+'</div>';
  b.innerHTML='<div class="pk-card-sheen">'+m2+'</div><div class="pk-card-name">'+escHtml(S.p2.mon.name)+'</div>';

  _spawnIntroDots(ov, S.p1.mon.color, S.p2.mon.color);
  ov.classList.add('show');
  ov.setAttribute('aria-hidden','false');

  // Two rAF frames to ensure the 'show' paint lands before 'go' triggers animations
  requestAnimationFrame(()=>{requestAnimationFrame(()=>{
    void ov.offsetWidth; // second reflow so keyframes start from 0%
    ov.classList.add('go');
  });});

  setTimeout(()=>{
    ov.classList.remove('show','go');
    ov.setAttribute('aria-hidden','true');
    ov.querySelectorAll('.bi-dot').forEach(d=>d.remove());
    setTimeout(done,280);
  },2800);
}

function _spawnIntroDots(ov, col1, col2){
  for(let i=0;i<28;i++){
    const d=document.createElement('div');
    d.className='bi-dot';
    const sz=Math.random()*5+2;
    const col=Math.random()>.5?col1:col2;
    const left=Math.random()*100;
    const top=20+Math.random()*60;
    const dur=1.2+Math.random()*1.5;
    const delay=Math.random()*1.8;
    d.style.cssText=`position:absolute;left:${left}%;top:${top}%;width:${sz}px;height:${sz}px;border-radius:50%;background:${col};pointer-events:none;z-index:3;opacity:0;animation:biDotPop ${dur}s ease ${delay}s forwards;box-shadow:0 0 ${sz*2}px ${col};`;
    ov.appendChild(d);
  }
}

function showSuddenDeathIntroSequence(done){
  const sd=document.getElementById('sudden-death-overlay');
  sd.classList.add('show');
  sd.setAttribute('aria-hidden','false');
  setTimeout(()=>{
    sd.classList.remove('show');
    sd.setAttribute('aria-hidden','true');
    setTimeout(done,400);
  },2300);
}

function beginSuddenDeath(){
  clearInterval(S.timer);
  S.active=false;
  S.suddenDeath=true;
  // Use the pre-reserved 13th question (unique, not seen in the 12 battle rounds)
  let q=S._sdQuestion||null;
  if(!q){
    // Fallback: pick any question not already used
    const used=new Set(S.questions.map(x=>x.q));
    const pool=getBuffer(S.level.id).filter(x=>!used.has(x.q));
    const src=pool.length?pool:getBuffer(S.level.id);
    q=JSON.parse(JSON.stringify(src[Math.floor(Math.random()*src.length)]));
  }
  S.questions=[q];
  S.cq=0;
  showSuddenDeathIntroSequence(()=>{
    showRTrans('⚡ SUDDEN DEATH ⚡','ONE QUESTION · SPEED MATTERS',()=>loadQ());
  });
}

function startBattle(){
  initAudio();
  try{if(audioCtx)audioCtx.resume();}catch(e){}
  stopBGM();
  const lv=S.level;
  S.suddenDeath=false;
  S.suddenDeathDone=false;
  S.forceWin=null;
  S._sdQuestion=null;
  S.questions=pickQuestions(lv);
  S.cq=0;
  S.p1={hp:100,mhp:100,score:0,mon:MONS[p1p],cur:0,ans:false,ch:-1,streak:0,lockAt:null};
  S.p2={hp:100,mhp:100,score:0,mon:MONS[p2p],cur:0,ans:false,ch:-1,streak:0,lockAt:null};
  S.first=null;

  const svg1=S.p1.mon.svg||'';
  const svg2=S.p2.mon.svg||'';
  document.getElementById('m1').innerHTML=svg1.indexOf('<svg')>=0?svg1.replace('<svg ','<svg style="width:100%;height:100%;" '):svg1;
  document.getElementById('m2').innerHTML=svg2.indexOf('<svg')>=0?svg2.replace('<svg ','<svg style="width:100%;height:100%;" '):svg2;
  buildHpTicks();updateHp();updateScore();

  // Apply mon glow colors
  document.querySelector('#s1 .mon-glow').style.background=`radial-gradient(circle,${S.p1.mon.color}18,transparent 70%)`;
  document.querySelector('#s2 .mon-glow').style.background=`radial-gradient(circle,${S.p2.mon.color}18,transparent 70%)`;

  showScreen('game-screen');
  initCanvas();
  initArenaBg();
  spawnAmbDots();
  setTimeout(()=>startBGM(),420);
  runBattleIntroAnimation(()=>loadQ());
}

function buildHpTicks(){
  ['h1t','h2t'].forEach(id=>{
    const el=document.getElementById(id);el.innerHTML='';
    for(let i=0;i<20;i++){const d=document.createElement('div');d.className='hp-tick';el.appendChild(d);}
  });
}

