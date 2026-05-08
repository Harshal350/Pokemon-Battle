
/* ═══════════════════════════════════════════════════════
   PIN LOCK SYSTEM
═══════════════════════════════════════════════════════ */
const PIN_CODE='ACM@26';
let pinBuffer='';
let pinCallback=null;
let pinAttempts=0;

function requirePin(cb){
  pinCallback=cb;
  pinBuffer='';
  pinAttempts=0;
  updatePinDots();
  document.getElementById('pin-error').classList.remove('show');
  document.getElementById('pin-lock-icon').textContent='🔒';
  document.getElementById('pin-lock-icon').classList.remove('unlock');
  document.getElementById('pin-overlay').classList.add('show');
}

function closePinOverlay(){
  document.getElementById('pin-overlay').classList.remove('show');
  // NOTE: do NOT null pinCallback here — caller does it after firing
}

function pinCancel(){
  pinCallback=null;
  pinBuffer='';
  document.getElementById('pin-overlay').classList.remove('show');
}

function pinInput(char){
  if(pinBuffer.length>=PIN_CODE.length)return;
  // clear error on new input
  document.getElementById('pin-error').classList.remove('show');
  pinBuffer+=char;
  updatePinDots();
  if(pinBuffer.length===PIN_CODE.length){
    setTimeout(checkPin,80);
  }
}

function pinBackspace(){
  if(!pinBuffer.length)return;
  pinBuffer=pinBuffer.slice(0,-1);
  updatePinDots();
}

function pinClear(){
  pinBuffer='';
  updatePinDots();
  document.getElementById('pin-error').classList.remove('show');
}

function updatePinDots(){
  for(let i=0;i<6;i++){
    const d=document.getElementById('pd'+i);
    d.classList.remove('filled','error');
    if(i<pinBuffer.length)d.classList.add('filled');
  }
}

function checkPin(){
  if(pinBuffer===PIN_CODE){
    // Success — stagger dots green, then unlock icon burst, then fire callback
    document.getElementById('pin-lock-icon').textContent='🔓';
    document.getElementById('pin-lock-icon').classList.add('unlock');
    for(let i=0;i<6;i++){
      setTimeout(()=>{
        const d=document.getElementById('pd'+i);
        d.classList.remove('error','filled');
        d.classList.add('success');
        d.style.background='';d.style.borderColor='';d.style.boxShadow='';
      }, i*55);
    }
    const cb=pinCallback;
    pinCallback=null;
    setTimeout(()=>{
      document.getElementById('pin-overlay').classList.remove('show');
      // reset dots
      for(let i=0;i<6;i++){
        const d=document.getElementById('pd'+i);
        d.className='pin-dot';
        d.style.background='';d.style.borderColor='';d.style.boxShadow='';
      }
      pinBuffer='';
      updatePinDots();
      if(cb) cb();
    },520);
  } else {
    // Wrong PIN
    pinAttempts++;
    document.getElementById('pin-error').classList.add('show');
    for(let i=0;i<6;i++){document.getElementById('pd'+i).classList.add('error');}
    const card=document.querySelector('.pin-card');
    card.style.animation='none';
    void card.offsetWidth;
    card.style.animation='pinCardShake .4s ease';
    setTimeout(()=>{
      card.style.animation='';
      pinBuffer='';
      updatePinDots();
    },450);
  }
}

// Keyboard handler for PIN overlay — must be the FIRST keydown listener registered
// so it can stopPropagation before the game listener sees keys.
document.addEventListener('keydown',e=>{
  const overlay=document.getElementById('pin-overlay');
  if(!overlay.classList.contains('show'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if(e.key==='Escape'){pinCancel();return;}
  if(e.key==='Backspace'){pinBackspace();return;}
  // accept alphanumeric + special chars
  if(e.key.length===1){
    pinInput(e.key.toUpperCase());
  }
},true); // capture phase — fires before any bubble-phase listeners


/* ═══════════════════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════════════════ */
let S={level:null,questions:[],cq:0,
  p1:{hp:100,mhp:100,score:0,mon:null,cur:0,ans:false,ch:-1,streak:0,lockAt:null},
  p2:{hp:100,mhp:100,score:0,mon:null,cur:0,ans:false,ch:-1,streak:0,lockAt:null},
  active:false,timer:null,tLeft:20,first:null,paused:false,suddenDeath:false,suddenDeathDone:false,forceWin:null};
let p1p=null,p2p=null;
// Pick-screen keyboard cursor positions
let pickCur1=0,pickCur2=0;

