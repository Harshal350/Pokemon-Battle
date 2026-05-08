/* ═══════════════════════════════════════════════════════
   FORMAT QUESTION TEXT — detects code/multi-line questions
═══════════════════════════════════════════════════════ */
function formatOptionText(raw){
  if(!raw) return '';
  const CODE_RE2=/\bfunction\b|\bfor\b\s*\(|\bif\s*\(|\bwhile\s*\(|=>|\bclass\b|\bdef\b|\breturn\b|[{};]\s*$|^\s{2,}/m;
  const hasNewline=raw.includes('\n');
  const looksCode=CODE_RE2.test(raw);
  if(hasNewline||looksCode){
    return `<code class="q-opt-code">${escHtml(raw.trim())}</code>`;
  }
  return escHtml(raw);
}
function formatQuestionText(raw){
  if(!raw) return '';
  const lines = raw.split('\n');

  // Code detection — language keywords, indentation, brackets
  const CODE_RE = /^[ \t]{2,}|[{}();][ \t]*$|\bfunction\b|\bfor\b\s*\(|\bif\s*\(|\bwhile\s*\(|=>\s*\{|\bclass\b|\bdef\b|\bprint\b\(|\bpublic\b|\bvoid\b|\breturn\b|^[ \t]*\/\/|^[ \t]*#/;

  if(lines.length <= 1){
    if(CODE_RE.test(raw)){
      return `<code class="q-code">${escHtml(raw.trim())}</code>`;
    }
    // Single line plain — left aligned bold
    return `<strong class="q-plain">${escHtml(raw)}</strong>`;
  }

  // Multi-line: separate question text from code block
  let textLines = [];
  let codeLines = [];
  let inCode = false;
  for(let i = 0; i < lines.length; i++){
    const line = lines[i];
    const looksCode = CODE_RE.test(line) || (line.trim() === '' && inCode && codeLines.length > 0);
    if(!inCode && !looksCode && i < 4 && textLines.length < 4){
      textLines.push(line);
    } else {
      inCode = true;
      codeLines.push(line);
    }
  }

  let html = '';
  if(textLines.length){
    // Each question text line: bold, left-aligned, newline between
    html = textLines.map(l => l.trim()
      ? `<strong class="q-plain">${escHtml(l)}</strong>`
      : ''
    ).filter(Boolean).join('<br>');
    if(codeLines.length) html += '';
  }
  if(codeLines.length){
    while(codeLines.length && codeLines[codeLines.length-1].trim() === '') codeLines.pop();
    while(codeLines.length && codeLines[0].trim() === '') codeLines.shift();
    html += `<code class="q-code">${escHtml(codeLines.join('\n'))}</code>`;
  } else if(!textLines.length){
    // All lines are plain text — render each line bold left
    html = lines.filter(l=>l.trim()).map(l =>
      `<strong class="q-plain">${escHtml(l)}</strong>`
    ).join('<br>');
  }
  return html;
}

function loadQ(){
  if(S.cq>=S.questions.length){endGame();return;}
  const q=S.questions[S.cq];
  S.p1.ans=S.p2.ans=false;S.p1.ch=S.p2.ch=-1;S.p1.cur=S.p2.cur=0;S.first=null;S.active=true;
  S.p1.lockAt=null;S.p2.lockAt=null;
  document.getElementById('rlbl').textContent=S.suddenDeath
    ?'⚡ SUDDEN DEATH ⚡'
    :`ROUND ${S.cq+1}/${S.questions.length}`;
  document.getElementById('ai1').classList.remove('show');
  document.getElementById('ai2').classList.remove('show');
  const qHtml=formatQuestionText(q.q);
  document.getElementById('qt1').innerHTML=qHtml;
  document.getElementById('qt2').innerHTML=qHtml;
  // Positional labels matching the 2×2 grid: [↖ ↗ / ↙ ↘]
  const posLabels=['↖','↗','↙','↘'];
  ['p1','p2'].forEach(pl=>{
    const container=document.getElementById(pl==='p1'?'qo1':'qo2');
    container.innerHTML='';
    q.opts.forEach((opt,i)=>{
      const d=document.createElement('div');d.className='q-opt';d.id=`qo${pl}${i}`;
      const optHtml=formatOptionText(opt);
      d.innerHTML=`<span class="q-opt-k">${posLabels[i]}</span><span class="q-opt-txt">${optHtml}</span>`;
      container.appendChild(d);
    });
  });
  _bgmFast=false;_lastCdSec=-1;
  document.getElementById('s1').classList.remove('danger');
  document.getElementById('s2').classList.remove('danger');
  document.getElementById('arena-countdown').className='';
  document.getElementById('arena-countdown').style.opacity='0';
  const td=S.suddenDeath?Math.min(15,S.level.timerSeconds):S.level.timerSeconds;
  S._tdTimer=td;
  hideBdgs();updateOptHL();startTimer(false);
}

/* ═══════════════════════════════════════════════════════
   TIMER
═══════════════════════════════════════════════════════ */
/* countdown display state */
let _lastCdSec=-1;

function startTimer(resume){
  clearInterval(S.timer);
  const td=S._tdTimer||(S.suddenDeath?Math.min(15,S.level.timerSeconds):S.level.timerSeconds);
  if(!resume) S.tLeft=td;
  _lastCdSec=-1;
  const f=document.getElementById('tfill');
  f.style.width='100%';f.classList.remove('urg');
  const cd=document.getElementById('arena-countdown');
  cd.className='';cd.textContent='';cd.style.opacity='0';

  S.timer=setInterval(()=>{
    S.tLeft=Math.max(0,S.tLeft-.1);
    const pct=S.tLeft/td*100;
    f.style.width=pct+'%';
    if(S.tLeft<td*.3) f.classList.add('urg');

    /* ── big countdown for last 5 seconds ── */
    const secLeft=Math.ceil(S.tLeft);
    if(secLeft<=5 && secLeft!==_lastCdSec && S.tLeft>0){
      _lastCdSec=secLeft;
      cd.className='';           // remove tick to restart animation
      cd.textContent=secLeft;
      // colour tier
      const tier=secLeft<=2?'cd-crit':secLeft<=3?'cd-warn':'cd-safe';
      void cd.offsetWidth;       // reflow so animation restarts
      cd.className='tick '+tier;
      // short tick sfx
      if(audioCtx && !bgmMuted){
        try{
          const o=audioCtx.createOscillator(),g=audioCtx.createGain();
          o.connect(g);g.connect(audioCtx.destination);
          o.type='square';
          o.frequency.value=secLeft<=2?880:secLeft<=3?660:440;
          g.gain.setValueAtTime(.05,audioCtx.currentTime);
          g.gain.linearRampToValueAtTime(0,audioCtx.currentTime+.08);
          o.start(audioCtx.currentTime);o.stop(audioCtx.currentTime+.09);
        }catch(e){}
      }
    }

    if(S.tLeft<=0){
      clearInterval(S.timer);
      cd.className='';cd.style.opacity='0';
      if(!S.p1.ans&&!S.p2.ans) resolve(null);
      else if(S.p1.ans&&!S.p2.ans) resolve('p1');
      else if(!S.p1.ans&&S.p2.ans) resolve('p2');
    }
  },100);
}

