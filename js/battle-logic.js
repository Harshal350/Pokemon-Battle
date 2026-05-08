/* ═══════════════════════════════════════════════════════
   RESOLVE ROUND
═══════════════════════════════════════════════════════ */
function resolveSuddenDeath(first){
  S.active=false;clearInterval(S.timer);
  const q=S.questions[S.cq],ans=q.ans;
  const p1c=S.p1.ans&&S.p1.ch===ans,p2c=S.p2.ans&&S.p2.ch===ans;
  const t1=S.p1.lockAt,t2=S.p2.lockAt;
  setTimeout(()=>{
    ['p1','p2'].forEach(pl=>{
      for(let i=0;i<4;i++){const el=document.getElementById(`qo${pl}${i}`);if(!el)continue;el.className='q-opt';if(i===ans)el.classList.add('correct');else if(S[pl].ans&&i===S[pl].ch)el.classList.add('wrong');}
    });
  },300);
  const opts=['A','B','C','D'];
  const correctOptText=q.opts?q.opts[ans]:'';
  const correctText=`${opts[ans]}: ${correctOptText}`;
  setTimeout(()=>{
    if(!p1c&&!p2c){
      sfxTie();
      // Sudden death tied — declare draw immediately, no more rounds
      S.suddenDeath=false;
      S.suddenDeathDone=true;
      showRoundResult('rr-tie','⚔ IT\'S A DRAW! ⚔','Sudden death tied — perfectly matched!','DRAW',correctText,()=>{endGame();});
      return;
    }
    let win=null;
    if(p1c&&!p2c) win='p1';
    else if(!p1c&&p2c) win='p2';
    else if(p1c&&p2c){
      if(t1!=null&&t2!=null){win=t1<=t2?'p1':'p2';}
      else if(t1!=null) win='p1';
      else if(t2!=null) win='p2';
      else win=first||'p1';
    }
    if(win){
      S.suddenDeath=false;
      S.forceWin=win;
      const sub=p1c&&p2c?'Faster lock wins!':'Correct answer wins!';
      const typ=win==='p1'?'rr-p1':'rr-p2';
      showRoundResult(typ,`PLAYER ${win==='p1'?'1':'2'} WINS SUDDEN DEATH!`,sub,'MATCH DECIDED',correctText,()=>{endGame();});
    }
  },650);
}

function resolve(first){
  if(S.suddenDeath){resolveSuddenDeath(first);return;}
  S.active=false;clearInterval(S.timer);
  const q=S.questions[S.cq],ans=q.ans;
  const p1c=S.p1.ans&&S.p1.ch===ans,p2c=S.p2.ans&&S.p2.ch===ans;
  setTimeout(()=>{
    ['p1','p2'].forEach(pl=>{
      for(let i=0;i<4;i++){const el=document.getElementById(`qo${pl}${i}`);if(!el)continue;el.className='q-opt';if(i===ans)el.classList.add('correct');else if(S[pl].ans&&i===S[pl].ch)el.classList.add('wrong');}
    });
  },300);
  let atk=null;
  if(p1c&&p2c)atk=first;
  else if(p1c)atk='p1';
  else if(p2c)atk='p2';

  // Build correct answer text to show in round result
  const opts=['A','B','C','D'];
  const correctOptText=S.questions[S.cq].opts?S.questions[S.cq].opts[ans]:'';
  const correctText=`${opts[ans]}: ${correctOptText}`;

  setTimeout(()=>{
    if(!atk){
      S.p1.streak=0;S.p2.streak=0;
      sfxTie();
      showRoundResult('rr-tie','⚔ TIE ROUND! ⚔','Neither trainer scored a hit','No damage dealt',correctText,()=>nextRound());
    } else {
      const def=atk==='p1'?'p2':'p1';
      const wasFirst=(p1c&&p2c)?' — FIRST TO LOCK!':'';
      doAttack(atk,def,()=>{
        const pNum=atk==='p1'?'1':'2';
        const monName=S[atk].mon.name;
        const dmg=S.level.damagePerHit;
        showRoundResult(
          `rr-${atk}`,
          `PLAYER ${pNum}<br>WINS THE ROUND!`,
          `${monName}'s attack connected!${wasFirst}`,
          `-${dmg} HP`,
          correctText,
          ()=>{if(S[def].hp<=0)setTimeout(endGame,400);else setTimeout(nextRound,400);}
        );
      });
    }
  },650);
}

/* ═══════════════════════════════════════════════════════
   ROUND RESULT ANNOUNCEMENT — EPIC EDITION
═══════════════════════════════════════════════════════ */
let rrCelebCanvas=null,rrCelebCtx=null,rrCelebParticles=[],rrCelebRunning=false,rrCountTimer=null;

function showRoundResult(type,headline,sub,dmgText,correctText,cb){
  const el=document.getElementById('round-result');
  const card=document.getElementById('rr-card');
  const balls={'rr-p1':'⚡','rr-p2':'💥','rr-tie':'🤝'};
  const cries={'rr-p1':'⚡ CRITICAL HIT! ⚡','rr-p2':'💥 DIRECT HIT! 💥','rr-tie':'⚔ SHIELDS CLASH! ⚔'};

  document.getElementById('rr-ball').textContent=balls[type]||'⚡';
  document.getElementById('rr-headline').innerHTML=headline;
  document.getElementById('rr-sub').textContent=sub;
  document.getElementById('rr-dmg').textContent=dmgText;
  document.getElementById('rr-correct-ans').textContent=correctText||'—';
  document.getElementById('rr-battlecry').textContent=cries[type]||'';
  card.className='rr-card '+type;

  // Tie split flash
  const split=document.getElementById('rr-tie-split');
  split.classList.remove('active');
  if(type==='rr-tie'){void split.offsetWidth;split.classList.add('active');}

  el.classList.add('show');

  // Countdown dots
  const dots=[document.getElementById('rrd0'),document.getElementById('rrd1'),document.getElementById('rrd2')];
  dots.forEach(d=>{if(d)d.classList.add('active');});
  const duration=2800;
  const interval=duration/3;
  clearTimeout(rrCountTimer);
  let dc=2;
  rrCountTimer=setInterval(()=>{if(dc>=0&&dots[dc]){dots[dc].classList.remove('active');dc--;}else clearInterval(rrCountTimer);},interval);

  // Launch celebrate canvas
  initRRCanvas(type);

  // Emoji rain
  spawnEmojiRain(type);

  setTimeout(()=>{
    el.classList.remove('show');
    stopRRCanvas();
    clearEmojiRain();
    setTimeout(cb,260);
  },duration);
}

function initRRCanvas(type){
  rrCelebCanvas=document.getElementById('rr-celebrate-canvas');
  if(!rrCelebCanvas)return;
  rrCelebCanvas.width=window.innerWidth;
  rrCelebCanvas.height=window.innerHeight;
  rrCelebCtx=rrCelebCanvas.getContext('2d');
  rrCelebParticles=[];
  const cx=window.innerWidth/2,cy=window.innerHeight/2;
  const col=type==='rr-p1'?'#00d4ff':type==='rr-p2'?'#ff4466':'#ffd700';
  const col2=type==='rr-tie'?'#00d4ff':'#ffd700';
  // Big burst from center
  for(let i=0;i<120;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=Math.random()*12+4;
    const r=Math.random()*5+2;
    rrCelebParticles.push({
      x:cx,y:cy,
      vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-3,
      r,col:Math.random()>.5?col:col2,
      life:Math.random()*50+30,maxLife:80,
      type:Math.random()>.4?'circle':'star',
      spin:Math.random()*Math.PI*2,spinV:(Math.random()-.5)*.3,
      gravity:0.25
    });
  }
  // Extra side bursts
  [[cx-200,cy],[cx+200,cy],[cx,cy-120]].forEach(([bx,by])=>{
    for(let i=0;i<30;i++){
      const angle=Math.random()*Math.PI*2;
      const speed=Math.random()*6+2;
      rrCelebParticles.push({
        x:bx,y:by,
        vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1,
        r:Math.random()*3+1,
        col:Math.random()>.5?col:'#ffffff',
        life:Math.random()*35+15,maxLife:50,
        type:'circle',spin:0,spinV:0,gravity:0.2
      });
    }
  });
  if(!rrCelebRunning){rrCelebRunning=true;rrCelebLoop();}
}

function rrCelebLoop(){
  if(!rrCelebCtx||!rrCelebCanvas){rrCelebRunning=false;return;}
  if(!rrCelebRunning)return;
  rrCelebCtx.clearRect(0,0,rrCelebCanvas.width,rrCelebCanvas.height);
  rrCelebParticles=rrCelebParticles.filter(p=>p.life>0);
  rrCelebParticles.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.vx*=.97;p.life--;p.spin+=p.spinV;
    const a=(p.life/p.maxLife);
    rrCelebCtx.save();rrCelebCtx.globalAlpha=a;rrCelebCtx.translate(p.x,p.y);rrCelebCtx.rotate(p.spin);
    rrCelebCtx.shadowBlur=10;rrCelebCtx.shadowColor=p.col;
    if(p.type==='star'){
      rrCelebCtx.beginPath();
      for(let i=0;i<5;i++){
        const a1=(i*4*Math.PI/5)-Math.PI/2;
        const a2=((i*4+2)*Math.PI/5)-Math.PI/2;
        i===0?rrCelebCtx.moveTo(p.r*Math.cos(a1),p.r*Math.sin(a1)):rrCelebCtx.lineTo(p.r*Math.cos(a1),p.r*Math.sin(a1));
        rrCelebCtx.lineTo(p.r*.45*Math.cos(a2),p.r*.45*Math.sin(a2));
      }
      rrCelebCtx.closePath();rrCelebCtx.fillStyle=p.col;rrCelebCtx.fill();
    } else {
      rrCelebCtx.beginPath();rrCelebCtx.arc(0,0,p.r,0,Math.PI*2);
      rrCelebCtx.fillStyle=p.col;rrCelebCtx.fill();
    }
    rrCelebCtx.restore();
  });
  if(rrCelebParticles.length>0)requestAnimationFrame(rrCelebLoop);
  else rrCelebRunning=false;
}

function stopRRCanvas(){
  rrCelebRunning=false;
  if(rrCelebCtx&&rrCelebCanvas)rrCelebCtx.clearRect(0,0,rrCelebCanvas.width,rrCelebCanvas.height);
}

function spawnEmojiRain(type){
  const container=document.getElementById('rr-emoji-rain');
  if(!container)return;
  container.innerHTML='';
  const sets={
    'rr-p1':['⚡','🏆','✨','💫','🌟','⭐','🔥','💥'],
    'rr-p2':['💥','🏆','🔥','✨','💫','⚡','🌟','🎯'],
    'rr-tie':['⚔','🤝','💫','✨','🌀','⭐','🔮','💎']
  };
  const emojis=sets[type]||sets['rr-p1'];
  for(let i=0;i<22;i++){
    const e=document.createElement('div');
    e.className='rr-emoji';
    e.textContent=emojis[Math.floor(Math.random()*emojis.length)];
    const dur=1.2+Math.random()*1.4;
    const delay=Math.random()*1.8;
    e.style.cssText=`left:${Math.random()*96+2}%;font-size:${20+Math.random()*20}px;animation-duration:${dur}s;animation-delay:${delay}s;`;
    container.appendChild(e);
  }
}

function clearEmojiRain(){
  const c=document.getElementById('rr-emoji-rain');
  if(c)c.innerHTML='';
}
function showTie(){}
function hideTie(){}
function doAttack(atk,def,cb){
  const ae=document.getElementById(atk==='p1'?'m1':'m2');
  const de=document.getElementById(def==='p1'?'m1':'m2');
  // Charge-up aura flash BEFORE attack
  triggerAura(atk);
  ae.className=`mon-svg ${atk==='p1'?'atk1':'atk2'}`;
  setTimeout(()=>ae.className='mon-svg idle',680);
  setTimeout(()=>fireProj(atk),190);
  setTimeout(()=>{
    triggerLightning();
    triggerShockwave(def);
    setTimeout(()=>triggerShake(),80);
    sfxHit(S[atk].mon.color);
    const fl=document.getElementById(def==='p1'?'f1':'f2');
    fl.classList.add('fl');setTimeout(()=>fl.classList.remove('fl'),600);
    de.className='mon-svg hurt';
    setTimeout(()=>de.className=S[def].hp<=S[def].mhp*.15?'mon-svg':'mon-svg idle',600);
    const dmg=S.level.damagePerHit;
    S[def].hp=Math.max(0,S[def].hp-dmg);
    updateHp();spawnDmg(def,dmg);
    if(atk==='p1')S.p1.score++;else S.p2.score++;
    S[atk].streak++;S[def==='p1'?'p1':'p2'].streak=0;
    updateScore();
    if(S[atk].streak>=2)spawnCombo(atk,S[atk].streak);
    showBdg(atk,'⚡ CRITICAL!','hit');showBdg(def,'💥 OUCH!','hit');
    if(S[def].hp<=0)setTimeout(()=>de.className='mon-svg faint',300);
    setTimeout(cb,750);
  },530);
}

function spawnDmg(pl,dmg){
  const side=document.getElementById(pl==='p1'?'s1':'s2');
  const d=document.createElement('div');
  d.className=`dmg-n dmg-${pl}`;d.textContent=`-${dmg}`;
  d.style.left=(30+Math.random()*38)+'%';d.style.top=(20+Math.random()*40)+'%';
  side.appendChild(d);setTimeout(()=>d.remove(),1300);
}

/* ═══════════════════════════════════════════════════════
   ROUND TRANSITION
═══════════════════════════════════════════════════════ */
function showRTrans(txt,sub,cb){
  const o=document.getElementById('rtrans');
  document.getElementById('rtxt').textContent=txt;
  document.getElementById('rtxtsub').textContent=sub||'';
  o.classList.add('show');
  setTimeout(()=>{o.classList.remove('show');setTimeout(cb,280);},1400);
}

function nextRound(){
  S.cq++;
  if(S.cq>=S.questions.length||S.p1.hp<=0||S.p2.hp<=0){endGame();return;}
  showRTrans(`ROUND ${S.cq+1}`,`${S.questions.length - S.cq} ROUNDS REMAINING`,loadQ);
}

/* ═══════════════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════════════ */
function updateOptHL(){
  ['p1','p2'].forEach(pl=>{
    if(S[pl].ans)return;
    for(let i=0;i<4;i++){const el=document.getElementById(`qo${pl}${i}`);if(!el)continue;el.classList.remove('hv1','hv2');if(S[pl].cur===i)el.classList.add(pl==='p1'?'hv1':'hv2');}
  });
}

let _bgmFast=false;

function updateHp(){
  let anyDanger=false;
  ['p1','p2'].forEach(p=>{
    const pct=Math.max(0,S[p].hp/S[p].mhp*100);
    const f=document.getElementById(p==='p1'?'h1f':'h2f');
    f.style.width=pct+'%';
    f.className='hp-fill '+(pct>50?'hp-high':pct>25?'hp-mid':'hp-low');
    document.getElementById(p==='p1'?'h1n':'h2n').innerHTML=
      `${S[p].hp}<span style="color:#3a3a5c;">/</span>${S[p].mhp}`;
    // Update ticks
    const ticks=document.getElementById(p==='p1'?'h1t':'h2t').children;
    const activeTicks=Math.round(pct/5);
    for(let i=0;i<ticks.length;i++){
      ticks[i].style.background=i<activeTicks
        ?(pct>50?'rgba(74,222,128,.35)':pct>25?'rgba(251,191,36,.35)':'rgba(239,68,68,.35)')
        :'rgba(255,255,255,.04)';
    }
    // Low HP danger mode on the p-side panel
    const side=document.getElementById(p==='p1'?'s1':'s2');
    if(pct<=25&&S[p].hp>0){
      side.classList.add('danger');
      anyDanger=true;
    } else {
      side.classList.remove('danger');
    }
  });

  // Speed up BGM when anyone is in danger
  if(anyDanger&&!_bgmFast){
    _bgmFast=true;
    stopBGM();
    if(!bgmMuted) scheduleBGM(195); // faster BPM
  } else if(!anyDanger&&_bgmFast){
    _bgmFast=false;
    stopBGM();
    if(!bgmMuted) scheduleBGM(160); // normal BPM
  }
}

function updateScore(){document.getElementById('slbl').textContent=`P1: ${S.p1.score} | P2: ${S.p2.score}`;}
function showBdg(pl,txt,type){const el=document.getElementById(pl==='p1'?'b1':'b2');el.textContent=txt;el.className=`st-bdg ${type} show`;}
function hideBdgs(){['p1','p2'].forEach(p=>{document.getElementById(p==='p1'?'b1':'b2').className='st-bdg';});}

/* ═══════════════════════════════════════════════════════
   END GAME — CLEAN WINNER SCREEN
═══════════════════════════════════════════════════════ */
let resBgCanvas=null,resBgCtx=null,resBgRunning=false,resBgParticles=[];

function endGame(){
  clearInterval(S.timer);S.active=false;
  document.getElementById('s1').classList.remove('danger');
  document.getElementById('s2').classList.remove('danger');
  if(!S.forceWin&&!S.suddenDeath&&!S.suddenDeathDone&&S.p1.hp>0&&S.p2.hp>0&&S.p1.score===S.p2.score&&S.p1.hp===S.p2.hp){
    beginSuddenDeath();
    return;
  }
  stopBGM();
  _bgmFast=false;
  stopAnimLoop();
  stopArenaBg();
  let win=null,wMon=null,playerLbl='',titleTxt='',subtitleTxt='',tagTxt='BATTLE OVER';
  if(S.forceWin){
    win=S.forceWin;
    S.forceWin=null;
    wMon=S[win].mon;
    playerLbl='PLAYER '+(win==='p1'?'1':'2');
    titleTxt='WINS!';
    subtitleTxt=(wMon?.name||'')+(wMon?' - '+wMon.type:'');
    tagTxt='SUDDEN DEATH';
  }
  else if(S.p1.hp<=0&&S.p2.hp<=0){titleTxt="IT'S A DRAW";subtitleTxt='PERFECTLY MATCHED';tagTxt='STALEMATE';}
  else if(S.p1.hp<=0){win='p2';wMon=S.p2.mon;playerLbl='PLAYER 2';titleTxt='WINS!';subtitleTxt=(wMon?.name||'')+(wMon?' - '+wMon.type:'');tagTxt='CHAMPION CROWNED';}
  else if(S.p2.hp<=0){win='p1';wMon=S.p1.mon;playerLbl='PLAYER 1';titleTxt='WINS!';subtitleTxt=(wMon?.name||'')+(wMon?' - '+wMon.type:'');tagTxt='CHAMPION CROWNED';}
  else{
    if(S.p1.score>S.p2.score){win='p1';wMon=S.p1.mon;}
    else if(S.p2.score>S.p1.score){win='p2';wMon=S.p2.mon;}
    else if(S.p1.hp>S.p2.hp){win='p1';wMon=S.p1.mon;}
    else if(S.p2.hp>S.p1.hp){win='p2';wMon=S.p2.mon;}
    if(win){playerLbl='PLAYER '+(win==='p1'?'1':'2');titleTxt='WINS!';subtitleTxt=(wMon?.name||'')+(wMon?' - '+wMon.type:'');tagTxt='CHAMPION CROWNED';}
    else if(S.suddenDeathDone){titleTxt="IT'S A DRAW";subtitleTxt=S.p1.mon.name+' & '+S.p2.mon.name+' — EQUALLY MATCHED';tagTxt='SUDDEN DEATH DRAW';}
    else{titleTxt="IT'S A DRAW";subtitleTxt='PERFECTLY MATCHED';tagTxt='STALEMATE';}
  }
  if(win)document.getElementById(win==='p1'?'m1':'m2').className='mon-svg win';
  else if(!win&&(S.suddenDeathDone||(S.p1.hp<=0&&S.p2.hp<=0))){
    document.getElementById('m1').className='mon-svg win';
    document.getElementById('m2').className='mon-svg win';
  }
  setTimeout(()=>{
    sfxWin(wMon?.type||'ELECTRIC');
    const overlay=document.getElementById('res-overlay');
    const typeClass=win?'win-'+win:'win-tie';
    const accentCol=win==='p1'?'#00d4ff':win==='p2'?'#ff4466':'#ffd700';
    overlay.style.setProperty('--res-accent',accentCol);
    ['res-card','res-mon-wrap','res-stats','res-title','res-player-lbl'].forEach(id=>{
      const el=document.getElementById(id);if(el){el.classList.remove('win-p1','win-p2','win-tie');el.classList.add(typeClass);}
    });
    document.getElementById('res-tag').textContent=tagTxt;
    document.getElementById('res-player-lbl').textContent=playerLbl;
    document.getElementById('res-title').textContent=titleTxt;
    document.getElementById('res-subtitle').textContent=subtitleTxt;
    document.getElementById('res-mon').innerHTML=wMon
      ?'<div style="width:180px;height:180px;filter:drop-shadow(0 0 30px '+wMon.color+')">'+monImg(wMon,120)+'</div>'
      :'<div style="display:flex;align-items:flex-end;justify-content:center;gap:18px;width:260px;">'
        +'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">'
          +'<div style="width:110px;height:110px;filter:drop-shadow(0 0 18px '+S.p1.mon.color+')">'+monImg(S.p1.mon,80)+'</div>'
          +'<div style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:var(--p1);letter-spacing:1px;">'+S.p1.mon.name+'</div>'
        +'</div>'
        +'<div style="font-size:28px;line-height:1;padding-bottom:18px;color:var(--gold);text-shadow:0 0 20px #ffd70099;">⚔</div>'
        +'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">'
          +'<div style="width:110px;height:110px;filter:drop-shadow(0 0 18px '+S.p2.mon.color+')">'+monImg(S.p2.mon,80)+'</div>'
          +'<div style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:var(--p2);letter-spacing:1px;">'+S.p2.mon.name+'</div>'
        +'</div>'
      +'</div>';
    const st=document.getElementById('res-stats');
    st.innerHTML=
      '<div class="res-stat res-stat-side-p1"><span class="res-val res-val-p1">'+S.p1.score+'</span><div class="res-lbl">P1 HITS</div></div>'+
      '<div class="res-stat res-stat-side-p1"><span class="res-val res-val-p1">'+S.p1.hp+'</span><div class="res-lbl">P1 HP</div></div>'+
      '<div class="res-stat" style="flex:0;padding:0 10px;align-self:center;"><div style="width:1px;height:36px;background:rgba(255,255,255,.06);"></div></div>'+
      '<div class="res-stat res-stat-side-p2"><span class="res-val res-val-p2">'+S.p2.score+'</span><div class="res-lbl">P2 HITS</div></div>'+
      '<div class="res-stat res-stat-side-p2"><span class="res-val res-val-p2">'+S.p2.hp+'</span><div class="res-lbl">P2 HP</div></div>';
    overlay.classList.add('show');
    startResBgCanvas(accentCol);
    if(win)spawnConf(wMon?wMon.color:'#ffd700');
  },900);
}

function startResBgCanvas(col){
  resBgCanvas=document.getElementById('res-bg-canvas');
  if(!resBgCanvas)return;
  resBgCanvas.width=window.innerWidth;resBgCanvas.height=window.innerHeight;
  resBgCtx=resBgCanvas.getContext('2d');resBgParticles=[];
  const W=resBgCanvas.width,H=resBgCanvas.height;
  for(let i=0;i<80;i++){
    resBgParticles.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+.3,
      vx:(Math.random()-.5)*.25,vy:-(Math.random()*.4+.1),
      col:Math.random()>.5?col:'#ffffff',a:Math.random()*.5+.1,
      p:Math.random()*Math.PI*2,ps:Math.random()*.012+.004});
  }
  if(!resBgRunning){resBgRunning=true;resBgLoop();}
}

function resBgLoop(){
  if(!resBgCtx||!resBgCanvas||!resBgRunning)return;
  const W=resBgCanvas.width,H=resBgCanvas.height;
  resBgCtx.clearRect(0,0,W,H);
  resBgParticles.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;p.p+=p.ps;
    if(p.y<-4){p.y=H+4;p.x=Math.random()*W;}
    const alpha=p.a*(0.4+0.6*Math.sin(p.p));
    resBgCtx.save();resBgCtx.globalAlpha=alpha;
    resBgCtx.beginPath();resBgCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
    resBgCtx.fillStyle=p.col;resBgCtx.shadowBlur=p.r>1?6:2;resBgCtx.shadowColor=p.col;
    resBgCtx.fill();resBgCtx.restore();
  });
  requestAnimationFrame(resBgLoop);
}

function spawnConf(col){
  const w=document.getElementById('conf-wrap');w.innerHTML='';
  const cols=[col,'#ffd700','#ffffff','#00d4ff','#4ade80','#f472b6','#a78bfa'];
  for(let i=0;i<90;i++){
    const c=document.createElement('div');c.className='conf';
    const clr=cols[Math.floor(Math.random()*cols.length)];
    const sz=4+Math.random()*7;const ribbon=Math.random()>.65;
    c.style.cssText='left:'+Math.random()*100+'%;background:'+clr+';width:'+(ribbon?2:sz)+'px;height:'+(ribbon?14+Math.random()*20:sz)+'px;border-radius:'+(ribbon?'1px':'50%')+';animation-duration:'+(1.8+Math.random()*2.2)+'s;animation-delay:'+Math.random()*1.1+'s;opacity:.9;';
    w.appendChild(c);
  }
}


/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */
function playAgain(){
  requirePin(()=>{
    resBgRunning=false;
    stopAnimLoop();
    stopArenaBg();
    document.getElementById('res-overlay').classList.remove('show');
    document.getElementById('m1').className='mon-svg idle';
    document.getElementById('m2').className='mon-svg idle';
    startBattle();
  });
}
function goHome(){
  requirePin(()=>{
    resBgRunning=false;
    stopAnimLoop();
    stopArenaBg();
    document.getElementById('res-overlay').classList.remove('show');
    showScreen('intro-screen');
  });
}

/* INIT */
buildIntroMons();
// Ensure intro screen is visible on load with transitions
document.getElementById('intro-screen').classList.add('active');
