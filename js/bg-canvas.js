/* ═══════════════════════════════════════════════════════
   BACKGROUND CANVAS — Starfield + Circuit lines
═══════════════════════════════════════════════════════ */
(function(){
  const c=document.getElementById('bg-canvas');
  const ctx=c.getContext('2d');
  let W,H,stars=[],circuits=[],orbs=[],shooters=[],hexes=[];

  function resize(){
    W=c.width=window.innerWidth;
    H=c.height=window.innerHeight;
    stars=[];circuits=[];orbs=[];hexes=[];
    // Stars
    for(let i=0;i<160;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.2,s:Math.random()*.018+.004,p:Math.random()*Math.PI*2,col:Math.random()>.7?'#00d4ff':Math.random()>.5?'#7c3aed':Math.random()>.5?'#ff4466':'#ffffff'});
    // Circuit traces
    for(let i=0;i<22;i++){
      const x=Math.random()*W,y=Math.random()*H;
      const segs=[];let cx=x,cy=y;
      for(let j=0;j<7;j++){const d=Math.floor(Math.random()*4);const l=Math.random()*80+25;if(d===0)cx+=l;else if(d===1)cx-=l;else if(d===2)cy+=l;else cy-=l;segs.push({x:cx,y:cy});}
      circuits.push({x,y,segs,col:Math.random()>.5?'rgba(0,212,255,.07)':Math.random()>.5?'rgba(124,58,237,.06)':'rgba(255,68,102,.04)',a:Math.random()*Math.PI*2,sp:Math.random()*.006+.002});
    }
    // Floating energy orbs
    for(let i=0;i<8;i++){
      orbs.push({
        x:Math.random()*W,y:Math.random()*H,
        r:Math.random()*60+30,
        vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,
        col:['rgba(0,212,255,','rgba(124,58,237,','rgba(255,68,102,','rgba(255,215,0,'][Math.floor(Math.random()*4)],
        p:Math.random()*Math.PI*2,sp:Math.random()*.012+.005,
        pulse:Math.random()*Math.PI*2
      });
    }
    // Hex grid nodes
    const hSize=70;
    for(let row=0;row<Math.ceil(H/hSize)+1;row++){
      for(let col=0;col<Math.ceil(W/(hSize*.87))+1;col++){
        const hx=col*hSize*.87+(row%2?hSize*.435:0);
        const hy=row*hSize*.75;
        hexes.push({x:hx,y:hy,a:Math.random()*Math.PI*2,sp:Math.random()*.008+.003,bright:Math.random()>.85});
      }
    }
    // Shooting stars pool
    shooters=[];
    for(let i=0;i<5;i++) shooters.push(makeShooter());
  }

  function makeShooter(){
    return {
      x:Math.random()*W*1.2-W*.1,y:-20,
      vx:(Math.random()-.3)*4,vy:Math.random()*3+2,
      life:0,maxLife:60+Math.random()*40,
      col:Math.random()>.5?'#00d4ff':'#a78bfa',
      len:Math.random()*60+40,
      active:false,
      nextSpawn:Math.random()*400+100
    };
  }

  resize();window.addEventListener('resize',resize);

  let t=0;
  function draw(){
    if(!W||!H||!isFinite(W)||!isFinite(H)){t++;requestAnimationFrame(draw);return;}
    ctx.clearRect(0,0,W,H);
    // Deep space gradient
    const grd=ctx.createRadialGradient(W*.35,H*.4,0,W*.5,H*.5,Math.max(1,W*.75));
    grd.addColorStop(0,'rgba(10,5,25,.55)');
    grd.addColorStop(.5,'rgba(6,6,15,.75)');
    grd.addColorStop(1,'rgba(4,4,10,.9)');
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);

    // Aurora bands (wide sweeping color bands)
    const auroras=[
      {y:H*.15,col1:'rgba(0,212,255,',col2:'rgba(124,58,237,',amp:60,spd:.0012,phase:0},
      {y:H*.55,col1:'rgba(255,68,102,',col2:'rgba(124,58,237,',amp:40,spd:.0009,phase:2.1},
      {y:H*.8,col1:'rgba(0,212,255,',col2:'rgba(255,215,0,',amp:30,spd:.0015,phase:4.2},
    ];
    auroras.forEach(au=>{
      const waveY=au.y+Math.sin(t*au.spd+au.phase)*au.amp;
      if(!isFinite(waveY)||!isFinite(W))return;
      const ag=ctx.createLinearGradient(0,waveY-50,0,waveY+50);
      ag.addColorStop(0,'transparent');
      ag.addColorStop(.3,au.col1+'0.025)');
      ag.addColorStop(.5,au.col2+'0.035)');
      ag.addColorStop(.7,au.col1+'0.02)');
      ag.addColorStop(1,'transparent');
      ctx.fillStyle=ag;ctx.fillRect(0,waveY-50,W,100);
    });

    // Nebula clouds (soft glowing blobs)
    const nebulas=[
      {x:W*.15,y:H*.3,rx:W*.18,ry:H*.2,col:'rgba(124,58,237,',spd:.0008,phase:1.0},
      {x:W*.85,y:H*.6,rx:W*.15,ry:H*.18,col:'rgba(0,212,255,',spd:.001,phase:3.0},
      {x:W*.5,y:H*.85,rx:W*.2,ry:H*.12,col:'rgba(255,68,102,',spd:.0007,phase:5.0},
    ];
    nebulas.forEach(nb=>{
      const pulse=0.018+0.012*Math.sin(t*nb.spd+nb.phase);
      ctx.save();ctx.globalAlpha=pulse;
      const ng=ctx.createRadialGradient(nb.x,nb.y,0,nb.x,nb.y,nb.rx);
      ng.addColorStop(0,nb.col+'0.6)');
      ng.addColorStop(.5,nb.col+'0.2)');
      ng.addColorStop(1,'transparent');
      ctx.fillStyle=ng;
      ctx.beginPath();ctx.ellipse(nb.x,nb.y,nb.rx,nb.ry,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });

    // Hex grid (subtle)
    hexes.forEach(h=>{
      const aa=.5+.5*Math.sin(t*h.sp+h.a);
      const base=h.bright?.05:.018;
      ctx.save();ctx.globalAlpha=aa*base;
      ctx.strokeStyle='rgba(100,120,255,1)';ctx.lineWidth=.5;
      drawHex(ctx,h.x,h.y,34);
      ctx.stroke();ctx.restore();
      if(h.bright){
        ctx.save();ctx.globalAlpha=aa*.12;
        ctx.fillStyle='rgba(120,100,255,1)';
        ctx.beginPath();ctx.arc(h.x,h.y,2,0,Math.PI*2);ctx.fill();
        ctx.restore();
      }
    });

    // Floating energy orbs
    orbs.forEach(orb=>{
      orb.x+=orb.vx;orb.y+=orb.vy;
      orb.pulse+=orb.sp;
      if(orb.x<-orb.r*2)orb.x=W+orb.r;
      if(orb.x>W+orb.r*2)orb.x=-orb.r;
      if(orb.y<-orb.r*2)orb.y=H+orb.r;
      if(orb.y>H+orb.r*2)orb.y=-orb.r;
      const pScale=.7+.3*Math.sin(orb.pulse);
      const r=orb.r*pScale;
      ctx.save();
      const og=ctx.createRadialGradient(orb.x,orb.y,0,orb.x,orb.y,r);
      og.addColorStop(0,orb.col+'0.06)');
      og.addColorStop(.5,orb.col+'0.03)');
      og.addColorStop(1,orb.col+'0)');
      ctx.fillStyle=og;ctx.beginPath();ctx.arc(orb.x,orb.y,r,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });

    // Shooting stars
    shooters.forEach(sh=>{
      if(!sh.active){
        sh.nextSpawn--;
        if(sh.nextSpawn<=0){sh.active=true;sh.life=sh.maxLife;sh.x=Math.random()*W*.8;sh.y=-10;}
      } else {
        sh.x+=sh.vx;sh.y+=sh.vy;sh.life--;
        const a=sh.life/sh.maxLife;
        ctx.save();ctx.globalAlpha=a*.9;
        const hyp=Math.hypot(sh.vx,sh.vy)||1;
        const ex=sh.x-sh.vx*(sh.len/hyp);
        const ey=sh.y-sh.vy*(sh.len/hyp);
        if(!isFinite(ex)||!isFinite(ey)||!isFinite(sh.x)||!isFinite(sh.y)){ctx.restore();return;}
        const lg=ctx.createLinearGradient(ex,ey,sh.x,sh.y);
        lg.addColorStop(0,'transparent');lg.addColorStop(1,sh.col);
        ctx.strokeStyle=lg;ctx.lineWidth=1.5;
        ctx.shadowBlur=8;ctx.shadowColor=sh.col;
        ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(sh.x,sh.y);ctx.stroke();
        // head dot
        ctx.globalAlpha=a;ctx.fillStyle=sh.col;ctx.shadowBlur=12;
        ctx.beginPath();ctx.arc(sh.x,sh.y,2,0,Math.PI*2);ctx.fill();
        ctx.restore();
        if(sh.life<=0){sh.active=false;sh.nextSpawn=Math.random()*300+150;}
      }
    });

    // Stars
    stars.forEach(s=>{
      s.p+=s.s;const aa=.25+.75*(Math.sin(s.p)*.5+.5);
      ctx.save();ctx.globalAlpha=aa;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=s.col;ctx.shadowBlur=s.r>1?6:2;ctx.shadowColor=s.col;ctx.fill();ctx.restore();
    });

    // Circuit traces
    circuits.forEach(c2=>{
      ctx.save();ctx.globalAlpha=.45+.55*Math.sin(t*c2.sp+c2.a);
      ctx.strokeStyle=c2.col;ctx.lineWidth=1;ctx.lineCap='square';
      ctx.beginPath();ctx.moveTo(c2.x,c2.y);
      c2.segs.forEach(s=>ctx.lineTo(s.x,s.y));
      ctx.stroke();
      [c2,...c2.segs.slice(0,-1)].forEach((s,i)=>{if(i%2===0){ctx.fillStyle=c2.col;ctx.beginPath();ctx.arc(s.x||c2.x,s.y||c2.y,2,0,Math.PI*2);ctx.fill();}});
      ctx.restore();
    });

    // Scan line sweep (subtle)
    const scanY=(t*1.2)%H;
    if(isFinite(scanY)&&isFinite(H)&&H>0){
      const sg=ctx.createLinearGradient(0,scanY-60,0,scanY+20);
      sg.addColorStop(0,'rgba(0,212,255,0)');
      sg.addColorStop(.7,'rgba(0,212,255,0.012)');
      sg.addColorStop(1,'rgba(0,212,255,0)');
      ctx.fillStyle=sg;ctx.fillRect(0,scanY-60,W,80);
    }

    t++;
    requestAnimationFrame(draw);
  }

  function drawHex(ctx,x,y,size){
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const angle=Math.PI/3*i-Math.PI/6;
      const px=x+size*Math.cos(angle);
      const py=y+size*Math.sin(angle);
      i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();
  }

  draw();
})();

