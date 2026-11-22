import {CONFIG} from './config.js';

export function mountArcade(container,t,look,onToast){
  container.innerHTML=`<canvas class="arcade-canvas" width="800" height="300" aria-label="${t('Arena permainan. Spasi atau tap untuk melompat.','Game arena. Space or tap to jump.')}" tabindex="0"></canvas><div class="game-progress"><i></i></div><div class="game-controls"><span class="game-status"></span><button class="btn primary game-start">${t('Mulai bermain','Start game')}</button></div><p class="note" style="margin-top:12px">${t('Spasi / ↑ / W / tap untuk melompat. Tahan untuk lompat lebih tinggi. Hindari bug sampai garis akhir!','Space / ↑ / W / tap to jump. Hold for a higher jump. Avoid the bugs until the finish line!')}</p><div class="game-reward" hidden></div>`;
  const canvas=container.querySelector('canvas'),ctx=canvas.getContext('2d'),status=container.querySelector('.game-status'),button=container.querySelector('.game-start'),progress=container.querySelector('.game-progress i'),reward=container.querySelector('.game-reward');
  let mode='ready',x=0,y=0,vy=0,lives=3,hold=false,invulnerable=0,obstacles=[],spawnIn=1.5,last=0,frame=0,stopped=false,elapsed=0,score=0;
  const ground=245,goal=1200,runnerX=112;
  function start(){mode='playing';x=y=vy=elapsed=score=invulnerable=0;lives=3;obstacles=[];spawnIn=1.3;reward.hidden=true;button.textContent=t('Ulangi','Restart');canvas.focus();}
  function jump(){hold=true;if(mode==='playing'&&y<=.1){vy=475;y=1;}}
  function release(){hold=false;}
  button.addEventListener('click',start);
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);if(mode==='ready')start();jump();});canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  const keyDown=e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)&&!e.target.closest('button,a,input,textarea')){e.preventDefault();if(!e.repeat){if(mode==='ready')start();jump();}}};
  const keyUp=e=>{if(['Space','ArrowUp','KeyW'].includes(e.code))release();};
  document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);window.addEventListener('blur',release);
  function rect(X,Y,W,H,C){ctx.fillStyle=C;ctx.fillRect(X,Y,W,H);}
  function roundRect(X,Y,W,H,R,C){ctx.fillStyle=C;ctx.beginPath();ctx.roundRect(X,Y,W,H,R);ctx.fill();}
  function bug(o){
    const X=o.x,Y=ground-o.h;roundRect(X,Y,o.w,o.h,10,o.color);rect(X+8,Y+8,6,7,'#fffaf0');rect(X+o.w-14,Y+8,6,7,'#fffaf0');rect(X+10,Y+10,3,4,'#24263a');rect(X+o.w-12,Y+10,3,4,'#24263a');
    ctx.strokeStyle=o.color;ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(X-7,Y+9+i*8);ctx.lineTo(X+o.w+7,Y+9+i*8);ctx.stroke();}
  }
  function player(){
    const X=runnerX,Y=ground-y;ctx.save();if(invulnerable>0&&Math.floor(elapsed*14)%2)ctx.globalAlpha=.35;
    const stride=mode==='playing'?Math.sin(elapsed*17)*5:0;
    roundRect(X-11,Y-27+stride,10,27-stride,3,look.pants);roundRect(X+3,Y-27-stride,10,27+stride,3,look.pants);rect(X-13,Y-5+stride,14,5,'#25252c');rect(X+2,Y-5-stride,14,5,'#25252c');
    roundRect(X-18,Y-58,36,34,7,look.top);roundRect(X-25,Y-54,9,26,4,look.top);roundRect(X+17,Y-54,9,26,4,look.top);
    ctx.fillStyle=look.skin;ctx.beginPath();ctx.arc(X,Y-77,23,0,Math.PI*2);ctx.fill();ctx.fillStyle=look.hairstyle==='hijab'?look.hijab:look.hair;ctx.beginPath();ctx.arc(X,Y-81,24,Math.PI,Math.PI*2);ctx.lineTo(X+24,Y-77);ctx.lineTo(X-24,Y-77);ctx.fill();
    ctx.fillStyle='#24252e';for(const dx of [-8,8]){ctx.beginPath();ctx.ellipse(X+dx,Y-72,2.8,4,0,0,7);ctx.fill();}ctx.restore();
  }
  function finish(){
    mode='won';score+=lives*100;reward.hidden=false;
    const code='DEMO-AERHA-'+Math.floor(1000+Math.random()*9000),voucher={code,value:150000,createdAt:new Date().toISOString(),demo:true};
    try{localStorage.setItem(CONFIG.storagePrefix+'-voucher',JSON.stringify(voucher));}catch{}
    reward.innerHTML=`<div class="voucher"><strong>${t('Selamat! Kamu mencapai garis akhir.','You made it to the finish line!')}</strong><p>${t('Voucher demo Rp150.000','Demo voucher: Rp150,000')}</p><code>${code}</code><p class="note">${t('Kode ini contoh hadiah permainan, belum berlaku untuk transaksi.','This is a sample game reward and is not valid for purchases.')}</p><button class="btn small copy-voucher">${t('Salin kode','Copy code')}</button></div>`;
    reward.querySelector('button').onclick=async()=>{try{await navigator.clipboard.writeText(code);onToast(t('Kode disalin.','Code copied.'));}catch{onToast(code);}};
  }
  function tick(ms){
    if(stopped)return;const dt=Math.min((ms-last)/1000||0,.033);last=ms;
    if(mode==='playing'&&!document.hidden){
      elapsed+=dt;const speed=205+Math.min(elapsed*1.4,70);x+=speed*dt/9;score=Math.floor(x);invulnerable=Math.max(0,invulnerable-dt);
      if(y>0||vy>0){vy-=(hold&&vy>0?1050:1700)*dt;y+=vy*dt;if(y<0){y=0;vy=0;}}
      spawnIn-=dt;if(spawnIn<=0){obstacles.push({x:830,w:34+Math.random()*14,h:28+Math.random()*20,color:['#8a6bbd','#e8765d','#3f8fd6'][Math.floor(Math.random()*3)]});spawnIn=1.40+Math.random()*.65;}
      for(const o of obstacles){o.x-=speed*dt;if(invulnerable===0&&o.x<runnerX+16&&o.x+o.w>runnerX-16&&y<o.h-3){lives--;invulnerable=1.8;if(lives<=0)mode='over';}}
      obstacles=obstacles.filter(o=>o.x+o.w>-20);if(x>=goal)finish();
    }
    rect(0,0,800,300,'#b8e6f1');
    for(let i=0;i<6;i++){const X=((i*180-elapsed*15)%1100+1100)%1100-110;roundRect(X,45+(i%3)*26,90,19,12,'#effbfc');roundRect(X+20,34+(i%3)*26,43,24,14,'#effbfc');}
    rect(0,190,800,55,'#acd08a');for(let i=0;i<20;i++){ctx.fillStyle=i%2?'#81af70':'#91bb78';ctx.beginPath();ctx.arc(i*60-elapsed*3%60,230,35,0,7);ctx.fill();}
    rect(0,ground,800,55,'#a78660');rect(0,ground,800,10,'#709c5c');for(let i=0;i<25;i++)rect(i*40-elapsed*35%40,267,15,3,'#b99a77');
    for(const o of obstacles)bug(o);player();
    ctx.fillStyle='#3c5365';ctx.font='bold 17px Trebuchet MS';ctx.fillText(`${t('POIN','SCORE')} ${score}`,18,28);ctx.fillStyle='#d46769';ctx.fillText('♥'.repeat(lives)+'♡'.repeat(3-lives),705,28);
    progress.style.width=Math.min(x/goal*100,100)+'%';status.textContent=`${t('Nyawa','Lives')}: ${lives} · ${Math.min(Math.floor(x/goal*100),100)}%`;
    if(mode!=='playing'){
      rect(0,0,800,300,'#1b16266b');roundRect(164,90,472,104,19,'#fffaf0');ctx.textAlign='center';ctx.fillStyle='#6b4f3a';ctx.font='900 26px Trebuchet MS';ctx.fillText(mode==='ready'?t('Lompat Anti-Bug','Anti-Bug Jump'):mode==='won'?t('Berhasil! 🎉','You did it! 🎉'):t('Coba lagi, developer!','Try again, developer!'),400,132);ctx.font='15px Trebuchet MS';ctx.fillStyle='#9c8069';ctx.fillText(mode==='ready'?t('Tekan Mulai atau tap arena','Press Start or tap the arena'):mode==='won'?t('Hadiah demo ada di bawah arena','Your demo reward is below'):t('Tekan Ulangi untuk bermain kembali','Press Restart to play again'),400,165);ctx.textAlign='left';
    }
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  return ()=>{stopped=true;cancelAnimationFrame(frame);document.removeEventListener('keydown',keyDown);document.removeEventListener('keyup',keyUp);window.removeEventListener('blur',release);};
}
