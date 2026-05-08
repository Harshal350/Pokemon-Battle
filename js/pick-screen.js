/* ═══════════════════════════════════════════════════════
   PICK SCREEN
═══════════════════════════════════════════════════════ */
function buildPick(){
  p1p=null;p2p=null;
  pickCur1=0;pickCur2=0;
  document.getElementById('pp1').textContent='— Select Fighter —';
  document.getElementById('pp2').textContent='— Select Fighter —';
  document.getElementById('bat-btn').disabled=true;
  ['p1','p2'].forEach(pl=>{
    const grid=document.getElementById(pl==='p1'?'pg1':'pg2');
    grid.innerHTML='';
    MONS.forEach((mon,i)=>{
      const d=document.createElement('div');d.className='pk-mon';d.id=`pk${pl}${i}`;
      d.innerHTML=`${monImg(mon,80)}<div class="pk-mon-name">${mon.name}</div>`;
      d.onclick=()=>pickMon(pl,i);
      grid.appendChild(d);
    });
  });
  updatePickCursor();
}

function updatePickCursor(){
  const n=MONS.length;
  for(let i=0;i<n;i++){
    const e1=document.getElementById('pkp1'+i);
    const e2=document.getElementById('pkp2'+i);
    if(e1){e1.classList.toggle('pk-cursor1', i===pickCur1 && p1p===null);}
    if(e2){e2.classList.toggle('pk-cursor2', i===pickCur2 && p2p===null);}
  }
}

function pickMon(pl,idx){
  const other=pl==='p1'?p2p:p1p;
  if(other!==null&&other===idx){sfxSelect();return;}
  document.querySelectorAll(`#${pl==='p1'?'pg1':'pg2'} .pk-mon`).forEach(e=>e.classList.remove('sp1','sp2','pk-cursor1','pk-cursor2'));
  document.getElementById(`pk${pl}${idx}`).classList.add(pl==='p1'?'sp1':'sp2');
  document.getElementById(pl==='p1'?'pp1':'pp2').textContent=`${MONS[idx].name} [${MONS[idx].type}]`;
  if(pl==='p1'){p1p=idx;pickCur1=idx;}else{p2p=idx;pickCur2=idx;}
  if(p1p!==null&&p2p!==null)document.getElementById('bat-btn').disabled=false;
  sfxSelect();
  updatePickCursor();
}

