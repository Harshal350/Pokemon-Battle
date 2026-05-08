/* ═══════════════════════════════════════════════════════
   KEYBOARD INPUT
═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   KEYBOARD INPUT
   Grid layout (2×2):   [0][1]
                         [2][3]
   P1: WASD to navigate, SPACE to confirm
   P2: Arrows to navigate, ENTER to confirm
═══════════════════════════════════════════════════════ */

// Move cursor on a 2×2 grid given a direction
function moveCursor(cur, dir){
  // col = cur % 2,  row = Math.floor(cur / 2)
  const col = cur % 2;
  const row = Math.floor(cur / 2);
  if(dir === 'up')    return (row === 0 ? 2 : 0) + col;   // wrap: row 0→1, row 1→0
  if(dir === 'down')  return (row === 0 ? 2 : 0) + col;
  if(dir === 'left')  return row * 2 + (col === 0 ? 1 : 0);
  if(dir === 'right') return row * 2 + (col === 0 ? 1 : 0);
  return cur;
}

document.addEventListener('keydown',e=>{
  // Pause toggle — works from game screen anytime
  if(e.key==='Escape'){
    const gs=document.getElementById('game-screen');
    if(gs.classList.contains('active')||S.paused){
      e.preventDefault();
      S.paused?resumeGame():pauseGame();
      return;
    }
  }
  // ── PICK SCREEN keyboard navigation ──
  const pickScr=document.getElementById('pick-screen');
  if(pickScr&&pickScr.classList.contains('active')){
    const k2=e.key.toLowerCase(),kR2=e.key,kC2=e.code;
    const n=MONS.length,cols=3;
    // P1: A/D = left/right, W/S = up/down, SPACE = confirm
    if(p1p===null){
      let m=false;
      if(k2==='a'){pickCur1=(pickCur1-1+n)%n;m=true;}
      if(k2==='d'){pickCur1=(pickCur1+1)%n;m=true;}
      if(k2==='w'){pickCur1=(pickCur1-cols+n)%n;m=true;}
      if(k2==='s'){pickCur1=(pickCur1+cols)%n;m=true;}
      if(m){updatePickCursor();sfxSelect();e.preventDefault();}
    }
    if(kC2==='Space'){e.preventDefault();if(p1p===null)pickMon('p1',pickCur1);}
    // P2: Arrow keys = navigate, ENTER = confirm
    if(p2p===null){
      let m=false;
      if(kR2==='ArrowLeft') {pickCur2=(pickCur2-1+n)%n;m=true;}
      if(kR2==='ArrowRight'){pickCur2=(pickCur2+1)%n;m=true;}
      if(kR2==='ArrowUp')   {pickCur2=(pickCur2-cols+n)%n;m=true;}
      if(kR2==='ArrowDown') {pickCur2=(pickCur2+cols)%n;m=true;}
      if(m){updatePickCursor();sfxSelect();e.preventDefault();}
    }
    if(kR2==='Enter'){
      e.preventDefault();
      if(p2p===null){pickMon('p2',pickCur2);}
      else if(p1p!==null&&p2p!==null){startBattle();}
    }
    return;
  }

  if(!S.active||S.paused)return;
  const k=e.key.toLowerCase(), kR=e.key, kC=e.code;

  // ── Player 1: WASD navigate, SPACE confirm ──
  if(!S.p1.ans){
    let moved=false;
    if(k==='w'){S.p1.cur=moveCursor(S.p1.cur,'up');   moved=true;}
    if(k==='s'){S.p1.cur=moveCursor(S.p1.cur,'down'); moved=true;}
    if(k==='a'){S.p1.cur=moveCursor(S.p1.cur,'left'); moved=true;}
    if(k==='d'){S.p1.cur=moveCursor(S.p1.cur,'right');moved=true;}
    if(moved){updateOptHL();sfxSelect();e.preventDefault();}
  }
  if(kC==='Space'){submit('p1');e.preventDefault();}

  // ── Player 2: Arrows navigate, ENTER confirm ──
  if(!S.p2.ans){
    let moved=false;
    if(kR==='ArrowUp')   {S.p2.cur=moveCursor(S.p2.cur,'up');   moved=true;}
    if(kR==='ArrowDown') {S.p2.cur=moveCursor(S.p2.cur,'down'); moved=true;}
    if(kR==='ArrowLeft') {S.p2.cur=moveCursor(S.p2.cur,'left'); moved=true;}
    if(kR==='ArrowRight'){S.p2.cur=moveCursor(S.p2.cur,'right');moved=true;}
    if(moved){updateOptHL();sfxSelect();e.preventDefault();}
  }
  if(kR==='Enter'){submit('p2');e.preventDefault();}
});

function submit(pl){
  if(!S.active||S.paused||S[pl].ans)return;
  S[pl].lockAt=performance.now();
  S[pl].ans=true;S[pl].ch=S[pl].cur;
  if(!S.first)S.first=pl;
  showBdg(pl,'⚡ LOCKED!','first');
  document.getElementById(pl==='p1'?'ai1':'ai2').classList.add('show');
  markSel(pl,S[pl].cur);
  for(let i=0;i<4;i++){const el=document.getElementById(`qo${pl}${i}`);if(el&&i!==S[pl].cur)el.classList.add('locked');}
  sfxCorrect();
  const oth=pl==='p1'?'p2':'p1';
  if(S[oth].ans){
    clearInterval(S.timer);
    const cd=document.getElementById('arena-countdown');
    if(cd){cd.className='';cd.style.opacity='0';}
    resolve(S.first);
  }
}

function markSel(pl,idx){
  for(let i=0;i<4;i++){const el=document.getElementById(`qo${pl}${i}`);if(!el)continue;el.className='q-opt';if(i===idx)el.classList.add(pl==='p1'?'sel1':'sel2');}
}

