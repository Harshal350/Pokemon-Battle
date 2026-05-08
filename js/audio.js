/* ═══════════════════════════════════════════════════════
   BATTLE MUSIC — Upbeat chiptune battle BGM
═══════════════════════════════════════════════════════ */
let audioCtx=null,musicInterval=null,musicNodes=[];
let bgmMuted=false;

function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  try{audioCtx.resume();}catch(e){}
}

function playNote(freq,start,dur,type='square',gain=0.08,detune=0){
  if(!audioCtx||bgmMuted)return;
  try{
    const o=audioCtx.createOscillator();
    const g=audioCtx.createGain();
    const f=audioCtx.createBiquadFilter();
    f.type='lowpass';f.frequency.value=2400;
    o.connect(f);f.connect(g);g.connect(audioCtx.destination);
    o.type=type;o.frequency.value=freq;o.detune.value=detune;
    g.gain.setValueAtTime(0,start);
    g.gain.linearRampToValueAtTime(gain,start+0.02);
    g.gain.setValueAtTime(gain,start+dur-0.04);
    g.gain.linearRampToValueAtTime(0,start+dur);
    o.start(start);o.stop(start+dur+0.05);
    musicNodes.push(o);
  }catch(e){}
}

// Battle BGM — uptempo chip tune loop
const BGM_MELODY=[
  [440,0.15],[392,0.1],[349,0.1],[392,0.15],[523,0.1],[440,0.15],[392,0.2],
  [349,0.1],[330,0.1],[294,0.1],[330,0.1],[392,0.15],[440,0.1],[392,0.15],[349,0.2],
  [523,0.1],[494,0.1],[440,0.1],[494,0.15],[587,0.1],[523,0.15],[494,0.2],
  [440,0.1],[392,0.1],[440,0.1],[494,0.15],[523,0.1],[587,0.15],[523,0.2],
];
const BGM_BASS=[
  [110,0.3],[110,0.3],[87.3,0.3],[98,0.3],
  [87.3,0.3],[98,0.3],[110,0.3],[130.8,0.3],
];
const BGM_CHORD=[[261.6,0.6],[293.7,0.6],[349.2,0.6],[392,0.6],[261.6,0.6],[349.2,0.6],[440,0.6],[392,0.6]];

function startBGM(){
  if(!audioCtx||bgmMuted)return;
  try{audioCtx.resume();}catch(e){}
  clearTimeout(musicInterval);
  musicNodes.forEach(n=>{try{n.stop();}catch(e){}});
  musicNodes=[];
  scheduleBGM();
}

function scheduleBGM(bpmOverride){
  if(bgmMuted)return;
  const now=audioCtx.currentTime;
  const bpm=bpmOverride||160,beat=60/bpm;
  let t=now+0.05;
  BGM_MELODY.forEach(([f,d])=>{playNote(f,t,d*beat*2,'square',0.07);t+=d*beat*2;});
  const loopLen=t-now;
  let bt=now+0.05;
  for(let i=0;i<BGM_MELODY.length;){
    BGM_BASS.forEach(([f,d])=>{playNote(f,bt,d*beat,'sawtooth',0.04,-20);bt+=d*beat;i++;});
  }
  let ct=now+0.05;
  BGM_CHORD.forEach(([f,d])=>{
    playNote(f,ct,d*beat*1.5,'triangle',0.03);
    playNote(f*1.25,ct,d*beat*1.5,'triangle',0.02);
    ct+=d*beat*1.5;
  });
  for(let i=0;i<16;i++){
    const pt=now+0.05+i*(beat*2);
    if(!bgmMuted){
      try{
        const nb=audioCtx.createOscillator(),ng=audioCtx.createGain();
        nb.connect(ng);ng.connect(audioCtx.destination);
        nb.type='sawtooth';nb.frequency.value=80+Math.random()*20;
        ng.gain.setValueAtTime(0.06,pt);ng.gain.linearRampToValueAtTime(0,pt+0.05);
        nb.start(pt);nb.stop(pt+0.06);
      }catch(e){}
    }
  }
  if(!bgmMuted)musicInterval=setTimeout(()=>scheduleBGM(bpmOverride),loopLen*1000-200);
}

function stopBGM(){
  clearTimeout(musicInterval);
  musicNodes.forEach(n=>{try{n.stop();}catch(e){}});
  musicNodes=[];
}

function toggleMusic(){
  initAudio();
  bgmMuted=!bgmMuted;
  const btn=document.getElementById('music-btn');
  if(bgmMuted){
    stopBGM();
    btn.textContent='♪ MUTED';btn.classList.add('muted');
  }else{
    btn.textContent='♪ BGM';btn.classList.remove('muted');
    startBGM();
  }
}

/* ═══════════════════════════════════════════════════════
   SOUND EFFECTS
═══════════════════════════════════════════════════════ */
function sfxHit(col){
  if(!audioCtx)return;
  const t=audioCtx.currentTime;
  // Impact thud
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.connect(g);g.connect(audioCtx.destination);
  o.type='square';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(60,t+0.15);
  g.gain.setValueAtTime(.18,t);g.gain.linearRampToValueAtTime(0,t+0.18);
  o.start(t);o.stop(t+0.2);
  // High ping
  const o2=audioCtx.createOscillator(),g2=audioCtx.createGain();
  o2.connect(g2);g2.connect(audioCtx.destination);
  o2.type='sine';o2.frequency.setValueAtTime(880,t+0.05);
  g2.gain.setValueAtTime(.12,t+0.05);g2.gain.linearRampToValueAtTime(0,t+0.25);
  o2.start(t+0.05);o2.stop(t+0.28);
}

function sfxCorrect(){
  if(!audioCtx)return;
  const t=audioCtx.currentTime;
  [523,659,784].forEach((f,i)=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(.1,t+i*.07);g.gain.linearRampToValueAtTime(0,t+i*.07+.15);
    o.start(t+i*.07);o.stop(t+i*.07+.18);
  });
}

function sfxSelect(){
  if(!audioCtx)return;
  const t=audioCtx.currentTime;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.connect(g);g.connect(audioCtx.destination);
  o.type='square';o.frequency.value=440;
  g.gain.setValueAtTime(.06,t);g.gain.linearRampToValueAtTime(0,t+.06);
  o.start(t);o.stop(t+.08);
}

function sfxTie(){
  if(!audioCtx)return;
  const t=audioCtx.currentTime;
  [330,294,262].forEach((f,i)=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.type='sawtooth';o.frequency.value=f;
    g.gain.setValueAtTime(.08,t+i*.12);g.gain.linearRampToValueAtTime(0,t+i*.12+.2);
    o.start(t+i*.12);o.stop(t+i*.12+.22);
  });
}

function sfxWin(monType){
  if(!audioCtx)return;
  const t=audioCtx.currentTime;
  // Type-specific fanfares
  const fanfares={
    'ELECTRIC':[[587,0],[784,0.1],[880,0.2],[1175,0.35],[880,0.5],[1175,0.65]],
    'FIRE':    [[523,0],[659,0.1],[784,0.2],[659,0.3],[784,0.45],[1047,0.6]],
    'WATER':   [[440,0],[554,0.12],[659,0.25],[554,0.38],[740,0.52],[880,0.68]],
    'GRASS':   [[494,0],[622,0.1],[740,0.22],[622,0.34],[831,0.48],[988,0.62]],
    'GHOST':   [[370,0],[466,0.12],[554,0.28],[370,0.44],[466,0.56],[740,0.72]],
    'ROCK':    [[294,0],[370,0.1],[440,0.2],[370,0.3],[440,0.44],[587,0.58]],
    'PSYCHIC': [[523,0],[698,0.1],[880,0.22],[1047,0.35],[880,0.5],[1175,0.65]],
    'STEEL':   [[349,0],[440,0.1],[523,0.22],[440,0.34],[587,0.48],[698,0.62]],
    'NORMAL':  [[440,0],[523,0.1],[587,0.22],[523,0.34],[659,0.48],[784,0.62]],
    'DRAGON':  [[294,0],[370,0.1],[466,0.2],[587,0.3],[740,0.44],[880,0.6]],
    'FIGHTING':[[349,0],[440,0.08],[523,0.18],[440,0.28],[587,0.4],[698,0.55]],
    'DARK':    [[262,0],[330,0.12],[392,0.26],[330,0.4],[415,0.54],[523,0.7]],
  };
  const notes=fanfares[monType]||fanfares['ELECTRIC'];
  const waveType=monType==='GHOST'?'sawtooth':monType==='ROCK'?'sawtooth':'square';
  notes.forEach(([f,d])=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.type=waveType;o.frequency.value=f;
    g.gain.setValueAtTime(.09,t+d);g.gain.linearRampToValueAtTime(0,t+d+.22);
    o.start(t+d);o.stop(t+d+.25);
  });
  // Victory chord at end
  [notes[notes.length-1][0],notes[notes.length-1][0]*1.25,notes[notes.length-1][0]*1.5].forEach((f,i)=>{
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.type='triangle';o.frequency.value=f;
    const td=t+notes[notes.length-1][1]+.28;
    g.gain.setValueAtTime(.06,td);g.gain.linearRampToValueAtTime(0,td+.5);
    o.start(td);o.stop(td+.55);
  });
}

/* Combo counter pop above attacker mon */
function spawnCombo(pl,streak){
  const side=document.getElementById(pl==='p1'?'s1':'s2');
  const stage=side.querySelector('.mon-stage');
  if(!stage)return;
  const el=document.createElement('div');
  el.className='combo-pop';
  const labels={2:'x2 COMBO!',3:'x3 STREAK!',4:'x4 ON FIRE!',5:'x5 UNSTOPPABLE!'};
  const colors={2:'#ffd700',3:'#ff8c00',4:'#ff4466',5:'#ff00ff'};
  const sz={2:'13px',3:'15px',4:'17px',5:'19px'};
  const streak5=Math.min(streak,5);
  el.textContent=labels[streak5]||`x${streak} COMBO!`;
  el.style.cssText=`top:5%;font-size:${sz[streak5]||'19px'};color:${colors[streak5]||'#ff00ff'};`;
  stage.style.position='relative';
  stage.appendChild(el);
  setTimeout(()=>el.remove(),950);
  // Sound effect for combo
  if(audioCtx){
    const t=audioCtx.currentTime;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    o.type='square';o.frequency.setValueAtTime(600+streak*120,t);
    o.frequency.linearRampToValueAtTime(1200+streak*80,t+.12);
    g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(0,t+.18);
    o.start(t);o.stop(t+.2);
  }
}

/* ═══════════════════════════════════════════════════════
   PAUSE MENU
═══════════════════════════════════════════════════════ */
function pauseGame(){
  if(!S.level)return;
  S.paused=true;
  clearInterval(S.timer);
  const po=document.getElementById('pause-overlay');
  document.getElementById('pause-round').textContent=S.cq+1;
  document.getElementById('pause-total').textContent=S.questions.length;
  document.getElementById('pause-scores').innerHTML=`
    <div class="pause-score-item">
      <div class="pause-score-val pause-p1-val">${S.p1.hp}</div>
      <div class="pause-score-lbl">P1 HP</div>
    </div>
    <div class="pause-score-item">
      <div class="pause-score-val pause-p1-val">${S.p1.score}</div>
      <div class="pause-score-lbl">P1 HITS</div>
    </div>
    <div style="width:1px;background:rgba(255,255,255,.06);margin:0 4px;"></div>
    <div class="pause-score-item">
      <div class="pause-score-val pause-p2-val">${S.p2.score}</div>
      <div class="pause-score-lbl">P2 HITS</div>
    </div>
    <div class="pause-score-item">
      <div class="pause-score-val pause-p2-val">${S.p2.hp}</div>
      <div class="pause-score-lbl">P2 HP</div>
    </div>
  `;
  po.classList.add('show');
  stopBGM();
}

function resumeGame(){
  S.paused=false;
  document.getElementById('pause-overlay').classList.remove('show');
  if(S.active){
    clearInterval(S.timer);
    startTimer(true);
  }
  if(!bgmMuted)startBGM();
}

function quitToMenu(){
  document.getElementById('pause-overlay').classList.remove('show');
  S.paused=false;S.active=false;
  clearInterval(S.timer);
  resBgRunning=false;
  stopAnimLoop();
  stopArenaBg();
  stopBGM();
  showScreen('intro-screen');
}

