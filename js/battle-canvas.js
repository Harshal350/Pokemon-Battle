/* ═══════════════════════════════════════════════════════
   CANVAS PROJECTILES
═══════════════════════════════════════════════════════ */
let canvas,ctx,projs=[],animRunning=false;
function initCanvas(){
  canvas=document.getElementById('proj-canvas');
  ctx=canvas.getContext('2d');
  resizeCvs();
  animRunning=true;
  requestAnimationFrame(animLoop);
}
function stopAnimLoop(){
  animRunning=false;
  projs=[];
  if(ctx&&canvas)ctx.clearRect(0,0,canvas.width,canvas.height);
}
function resizeCvs(){const a=document.getElementById('arena');canvas.width=a.offsetWidth;canvas.height=a.offsetHeight;}
window.addEventListener('resize',()=>{if(canvas)resizeCvs();});

function animLoop(){
  if(!animRunning)return;
  if(!ctx){requestAnimationFrame(animLoop);return;}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  projs=projs.filter(p=>p.life>0);
  projs.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;p.life--;p.vx*=.988;p.vy+=.25;p.spin+=.15;
    const a=p.life/p.maxLife;
    // Outer glow
    ctx.save();ctx.globalAlpha=a*.5;
    const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*(p.isMain?4:3));
    grd.addColorStop(0,p.col);grd.addColorStop(1,'transparent');
    ctx.fillStyle=grd;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(p.isMain?4:3),0,Math.PI*2);ctx.fill();ctx.restore();
    // Comet tail for main projectile
    if(p.isMain){
      const tailLen=12;
      for(let i=1;i<=tailLen;i++){
        const tx=p.x-p.vx*i*1.2,ty=p.y-p.vy*i*1.2-(i*i*0.15);
        const ta=a*(1-i/tailLen)*.7;
        const tr=p.r*(1-i/tailLen)*.9;
        ctx.save();ctx.globalAlpha=ta;
        ctx.beginPath();ctx.arc(tx,ty,Math.max(.5,tr),0,Math.PI*2);
        ctx.fillStyle=p.col;ctx.shadowBlur=8;ctx.shadowColor=p.col;ctx.fill();ctx.restore();
      }
    }
    // Core orb
    ctx.save();ctx.globalAlpha=a;ctx.translate(p.x,p.y);ctx.rotate(p.spin);
    ctx.shadowBlur=p.isMain?24:12;ctx.shadowColor=p.col;
    ctx.fillStyle=p.col;
    ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();
    // Bright center
    ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(-p.r*.25,-p.r*.25,p.r*.4,0,Math.PI*2);ctx.fill();
    // Sparkle lines (only main)
    if(p.isMain){
      ctx.strokeStyle=p.col;ctx.lineWidth=1.5;
      for(let i=0;i<8;i++){const a2=i/8*Math.PI*2+p.spin;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a2)*p.r*2.2,Math.sin(a2)*p.r*2.2);ctx.stroke();}
      // Ring pulse
      ctx.globalAlpha=a*.4;ctx.strokeStyle=p.col;ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(0,0,p.r*2.5,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
    // Trail particles (small ones only)
    if(!p.isMain){for(let t2=1;t2<=4;t2++){ctx.save();ctx.globalAlpha=a*.12*(1-t2/5);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x-p.vx*t2*1.5,p.y-p.vy*t2*1.5,p.r*(1-t2/5)*.8,0,Math.PI*2);ctx.fill();ctx.restore();}}
  });
  if(animRunning)requestAnimationFrame(animLoop);
}

function fireProj(from){
  const a=document.getElementById('arena');const W=a.offsetWidth,H=a.offsetHeight;
  let sx,sy,ex,ey;
  if(from==='p1'){sx=W*.27;sy=H*.55;ex=W*.73;ey=H*.55;}
  else{sx=W*.73;sy=H*.55;ex=W*.27;ey=H*.55;}
  const col=from==='p1'?S.p1.mon.color:S.p2.mon.color;
  const frames=28,dx=ex-sx,dy=ey-sy,arc=-H*.3;
  const vx=dx/frames,vy=(dy+arc)/frames-(.25*frames)/2;
  // Main projectile (larger)
  projs.push({x:sx,y:sy,vx,vy,col,r:10,life:frames+10,maxLife:frames+10,spin:0,isMain:true});
  // Burst particles at origin
  for(let i=0;i<14;i++){
    const angle=Math.random()*Math.PI*2,speed=Math.random()*4+1.5;
    projs.push({x:sx,y:sy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1,col,r:Math.random()*3+1.5,life:20,maxLife:20,spin:0});
  }
  // Trailing sparkles along path
  for(let f=0;f<frames;f+=3){
    const fx=sx+vx*f,fy=sy+vy*f+.5*.25*f*f;
    setTimeout(()=>{
      if(!ctx)return;
      projs.push({x:fx+( Math.random()-0.5)*8,y:fy+(Math.random()-0.5)*8,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,col,r:2.5,life:10,maxLife:10,spin:0});
    },f*10);
  }
}

/* ═══════════════════════════════════════════════════════
   ARENA BACKGROUND CANVAS — persistent energy particles
═══════════════════════════════════════════════════════ */
let abCanvas,abCtx,abParticles=[],abRunning=false;
function initArenaBg(){
  abCanvas=document.getElementById('arena-bg-canvas');
  if(!abCanvas)return;
  abCtx=abCanvas.getContext('2d');
  abCanvas.width=document.getElementById('arena').offsetWidth;
  abCanvas.height=document.getElementById('arena').offsetHeight;
  abParticles=[];
  // Spawn ambient arena particles
  for(let i=0;i<60;i++){
    abParticles.push(makeAbParticle());
  }
  if(!abRunning){abRunning=true;abLoop();}
}

function makeAbParticle(){
  const side=Math.random()>.5?'p1':'p2';
  const W=abCanvas?abCanvas.width:600,H=abCanvas?abCanvas.height:300;
  const x=side==='p1'?Math.random()*(W/2):(W/2)+Math.random()*(W/2);
  return{
    x,y:H*.2+Math.random()*H*.6,
    vx:(Math.random()-.5)*0.6,vy:-(Math.random()*.8+.2),
    r:Math.random()*2+.5,
    life:Math.random()*120+60,maxLife:180,
    col:side==='p1'?`rgba(0,212,255,`:`rgba(255,68,102,`,
    p:Math.random()*Math.PI*2
  };
}

function abLoop(){
  if(!abCtx||!abCanvas){abRunning=false;return;}
  abCtx.clearRect(0,0,abCanvas.width,abCanvas.height);
  const W=abCanvas.width,H=abCanvas.height;

  // Draw subtle hex grid lines on arena
  abCtx.save();
  for(let row=0;row<6;row++){
    for(let col=0;col<10;col++){
      const hx=col*60+(row%2?30:0),hy=row*50+20;
      const side=hx<W/2?'p1':'p2';
      abCtx.globalAlpha=.025;
      abCtx.strokeStyle=side==='p1'?'#00d4ff':'#ff4466';
      abCtx.lineWidth=.8;
      abCtx.beginPath();
      for(let k=0;k<6;k++){
        const ang=Math.PI/3*k;
        const px=hx+22*Math.cos(ang),py=hy+22*Math.sin(ang);
        k===0?abCtx.moveTo(px,py):abCtx.lineTo(px,py);
      }
      abCtx.closePath();abCtx.stroke();
    }
  }
  abCtx.restore();

  // Ground gradient lines
  const grd=abCtx.createLinearGradient(0,H*.75,0,H);
  if(!isFinite(H)||H<=0)return;
  grd.addColorStop(0,'transparent');
  grd.addColorStop(.5,'rgba(124,58,237,.04)');
  grd.addColorStop(1,'rgba(124,58,237,.08)');
  abCtx.fillStyle=grd;abCtx.fillRect(0,H*.75,W,H*.25);

  // Perspective grid lines on ground
  abCtx.save();abCtx.globalAlpha=.06;
  abCtx.strokeStyle='#7c3aed';abCtx.lineWidth=.8;
  for(let i=0;i<=10;i++){
    const x=i/10*W;
    abCtx.beginPath();abCtx.moveTo(x,H*.75);abCtx.lineTo(W/2,H);abCtx.stroke();
  }
  for(let i=0;i<=4;i++){
    const t=i/4;const y=H*.75+t*(H*.25);
    const xw=(W/2)*t;
    abCtx.beginPath();abCtx.moveTo(W/2-xw,y);abCtx.lineTo(W/2+xw,y);abCtx.stroke();
  }
  abCtx.restore();

  // Ambient particles
  abParticles.forEach((p,i)=>{
    p.x+=p.vx;p.y+=p.vy;p.life--;p.p+=.05;
    if(p.life<=0)abParticles[i]=makeAbParticle();
    const a=(p.life/p.maxLife)*(.3+.2*Math.sin(p.p));
    abCtx.save();abCtx.globalAlpha=a;
    abCtx.beginPath();abCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
    abCtx.fillStyle=p.col+'0.8)';
    abCtx.shadowBlur=6;abCtx.shadowColor=p.col+'1)';
    abCtx.fill();abCtx.restore();
  });

  requestAnimationFrame(abLoop);
}

function stopArenaBg(){
  abRunning=false;
  if(abCtx&&abCanvas)abCtx.clearRect(0,0,abCanvas.width,abCanvas.height);
  // Remove ambient dots from question panels
  ['qp1','qp2'].forEach(id=>{
    const pan=document.getElementById(id);
    if(pan)pan.querySelectorAll('.amb-dot').forEach(d=>d.remove());
  });
}

/* Ambient floating dots in each question panel */
function spawnAmbDots(){
  ['qp1','qp2'].forEach((id,si)=>{
    const pan=document.getElementById(id);
    if(!pan)return;
    for(let i=0;i<12;i++){
      const d=document.createElement('div');
      d.className='amb-dot';
      const sz=Math.random()*3+1;
      const col=si===0?'rgba(0,212,255,0.4)':'rgba(255,68,102,0.4)';
      const dur=3+Math.random()*4;
      const delay=Math.random()*5;
      const dx=(Math.random()-0.5)*30;
      d.style.cssText=`width:${sz}px;height:${sz}px;background:${col};left:${Math.random()*90+5}%;bottom:5%;--dx:${dx}px;animation-duration:${dur}s;animation-delay:${delay}s;box-shadow:0 0 4px ${col};`;
      pan.appendChild(d);
    }
  });
}

/* Screen shake helper */
function triggerShake(){
  const gs=document.getElementById('game-screen');
  gs.classList.remove('screen-shake');
  void gs.offsetWidth;
  gs.classList.add('screen-shake');
  setTimeout(()=>gs.classList.remove('screen-shake'),450);
}

/* Lightning flash helper */
function triggerLightning(){
  const l=document.getElementById('lightning-overlay');
  if(!l)return;
  l.classList.remove('strike');
  void l.offsetWidth;
  l.classList.add('strike');
  setTimeout(()=>l.classList.remove('strike'),300);
}

/* Aura charge flash */
function triggerAura(pl){
  const id=pl==='p1'?'ar1':'ar2';
  const el=document.getElementById(id);
  if(!el)return;
  el.classList.remove('charge');
  void el.offsetWidth;
  el.classList.add('charge');
  setTimeout(()=>el.classList.remove('charge'),500);
}

/* Shockwave on hit */
function triggerShockwave(def){
  const id=def==='p1'?'sw1':'sw2';
  const el=document.getElementById(id);
  if(!el)return;
  el.classList.remove('boom');
  void el.offsetWidth;
  el.classList.add('boom');
  setTimeout(()=>el.classList.remove('boom'),550);
}


