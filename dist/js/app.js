import * as THREE from '../assets/vendor/three.module.js';
import {CONFIG,FLOORS,DEFAULT_LOOK,validateLook} from './config.js';
import {PORTFOLIO} from './portfolio-data.js';
import {createWorld} from './world.js';
import {createAvatar,disposeAvatar} from './avatar.js';
import {createUI} from './ui.js';
import {findPath,slideMove,walkable,BOUNDS} from './navigation.js';
import {interactionDistance as distanceToAction,nearestInteraction} from './doors.js';

const canvas=document.querySelector('#world'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,innerWidth/innerHeight,.1,100);
let renderer=null,world=null,ui=null,currentFloor=0,phase='auto',customizing=false,blocked=false,transitioning=false,liftOperating=false,path=[],pendingAction=null,nearest=null,last=0,frame=0,walkTime=0;
const keys=new Set(),joystick={x:0,z:0},position={x:4.2,z:-2.4},cameraTarget=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),desiredTarget=new THREE.Vector3();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
let initialLook=null,language='id';try{initialLook=JSON.parse(localStorage.getItem(CONFIG.storagePrefix+'-look'));language=localStorage.getItem(CONFIG.storagePrefix+'-lang')==='en'?'en':'id';}catch{}
let look=validateLook(initialLook),player=createAvatar(look);player.position.set(position.x,0,position.z);scene.add(player);
const hemi=new THREE.HemisphereLight('#e9efff','#6e4a38',1.8);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff0d1',2.8);sun.position.set(-5,12,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=13;sun.shadow.camera.bottom=-13;sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun);
const fill=new THREE.DirectionalLight('#b6d0ff',.50);fill.position.set(9,6,-5);scene.add(fill);
const targetMarker=new THREE.Mesh(new THREE.RingGeometry(.17,.24,32),new THREE.MeshBasicMaterial({color:'#ffd166',transparent:true,opacity:.8,side:THREE.DoubleSide}));targetMarker.rotation.x=-Math.PI/2;targetMarker.position.y=.035;targetMarker.visible=false;scene.add(targetMarker);

const controller={
  get look(){return look;},language,
  setBlocked(value){blocked=value;keys.clear();joystick.x=joystick.z=0;if(value)stopWalking();},
  stopWalking,
  updateLook(value){look={...value};const previous=player;player=createAvatar(look);player.position.copy(previous.position);player.rotation.copy(previous.rotation);scene.remove(previous);disposeAvatar(previous);scene.add(player);},
  saveLook(){try{localStorage.setItem(CONFIG.storagePrefix+'-look',JSON.stringify(look));}catch{ui?.toast(tr('Tampilan berlaku untuk kunjungan ini.','Your look is saved for this visit.'));}},
  beginCustomization(){customizing=true;stopWalking();player.rotation.y=0;},
  endCustomization(){customizing=false;},
  changeFloor,
  travelElevator,
  refreshHUD,
};
const tr=(a,b)=>controller.language==='id'?a:b;
ui=createUI(controller,PORTFOLIO);

function current(){return world?.floors.get(currentFloor);}
function stopWalking(){path=[];pendingAction=null;targetMarker.visible=false;}
function resolvedPhase(){const h=new Date().getHours();return phase==='auto'?(h>=6&&h<17?'day':h===17?'sunset':'night'):phase;}
function updateLight(){
  const mode=resolvedPhase(),outdoor=currentFloor===0||currentFloor===3;
  const skies={day:outdoor?'#9fd8ff':'#1b1626',sunset:outdoor?'#f4a07c':'#1b1626',night:outdoor?'#1c2346':'#120f1c'};
  scene.background=new THREE.Color(skies[mode]);scene.fog=new THREE.Fog(skies[mode],36,75);
  hemi.intensity=mode==='night'?1.55:1.8;sun.intensity=mode==='night'?2.25:2.8;sun.color.set(mode==='sunset'?'#ffc48c':'#fff0d1');fill.intensity=mode==='night'?.4:.5;
}
function areaName(){
  if(currentFloor===1){if(position.x<-3)return [tr('Area Programmer','Programmer Area'),'#2fa39a'];if(position.x<6.5)return [tr('Area Sales','Sales Area'),'#e8765d'];if(position.z<-.45)return [tr('Ruang CEO','CEO Office'),'#c99a2e'];return [tr('Lorong','Hallway'),'#c99a2e'];}
  if(current()?.mosque?.contains(position))return [tr('Masjid','Mosque'),'#247c69'];
  const f=FLOORS.find(f=>f.id===currentFloor);return [tr(...f.name),f.color];
}
function refreshHUD(){
  const f=FLOORS.find(f=>f.id===currentFloor),[name,color]=areaName();document.querySelector('#floor-badge').textContent=f.badge;const area=document.querySelector('#area-name');area.textContent=name;area.style.color=color;
  const mode=resolvedPhase(),date=new Date(),time=date.toLocaleTimeString(controller.language==='id'?'id-ID':'en-GB',{hour:'2-digit',minute:'2-digit'});
  document.querySelector('#clock').textContent=({day:tr('Siang','Day'),sunset:tr('Senja','Sunset'),night:tr('Malam','Night')})[mode]+' · '+time+(phase!=='auto'?' ✦':'');document.querySelector('#mood-icon').textContent=({day:'☀',sunset:'◒',night:'☾'})[mode];
}
document.querySelector('#mood').onclick=()=>{phase=['auto','day','sunset','night'][(['auto','day','sunset','night'].indexOf(phase)+1)%4];updateLight();refreshHUD();ui.toast(tr('Suasana: ','Mood: ')+(phase==='auto'?tr('otomatis','automatic'):tr(...({day:['siang','day'],sunset:['senja','sunset'],night:['malam','night']})[phase])));};

async function changeFloor(id,spawn={x:11.7,z:1.4}){
  if(transitioning||!world?.floors.has(id))return;transitioning=true;ui.close();ui.closeDialogue();stopWalking();keys.clear();document.querySelector('#fade').classList.add('active');
  await new Promise(resolve=>setTimeout(resolve,260));currentFloor=id;
  for(const f of world.floors.values())f.group.visible=f.id===id;
  position.x=spawn.x;position.z=spawn.z;player.position.set(position.x,0,position.z);player.rotation.y=Math.PI;updateLight();refreshHUD();createLabels();updateCamera(1,true);
  await new Promise(resolve=>setTimeout(resolve,90));document.querySelector('#fade').classList.remove('active');transitioning=false;canvas.focus({preventScroll:true});
}

function interactionDistance(action){return distanceToAction(position,action);}
async function openLift(action){
  if(liftOperating)return;liftOperating=true;controller.setBlocked(true);
  try{action.fixture.requestOpen(6);if(await action.fixture.waitFor(true))ui.elevator(currentFloor);else ui.toast(tr('Lift belum siap. Silakan coba lagi.','The elevator is not ready. Please try again.'));}
  finally{liftOperating=false;if(!ui.blocked)controller.setBlocked(false);}
}
async function travelElevator(id){
  if(liftOperating||transitioning||id===currentFloor||!world?.floors.has(id))return;
  liftOperating=true;controller.setBlocked(true);const origin=current().lift,destination=world.floors.get(id).lift;
  try{
    if(origin){origin.requestClose({force:true});if(!await origin.waitFor(false)){ui.toast(tr('Lift belum siap. Silakan coba lagi.','The elevator is not ready. Please try again.'));return;}}
    destination?.reset(false);await changeFloor(id,{x:11.7,z:1.4});controller.setBlocked(true);
    if(destination){destination.requestOpen(4);await destination.waitFor(true);}
  }finally{liftOperating=false;controller.setBlocked(false);canvas.focus({preventScroll:true});}
}
function activate(action){
  if(!action||blocked||transitioning||customizing)return;stopWalking();
  switch(action.kind){
    case 'door':changeFloor(action.target,action.spawn);break;
    case 'walk':goTo(action.approach);break;
    case 'lift':void openLift(action);break;
    case 'room-door':
      if(action.fixture.isOpen){if(!action.fixture.requestClose())ui.toast(tr('Lewati pintu dulu sebelum menutupnya.','Clear the doorway before closing it.'));}
      else action.fixture.requestOpen();
      break;
    case 'reception':ui.reception();break;
    case 'whatsapp':ui.whatsapp();break;
    case 'portfolio':ui.showPortfolio(action.index??0);break;
    case 'arcade':ui.arcade();break;
    case 'npc':ui.npc(action.person);break;
    default:ui.say(tr(...action.label),action.pages,'#b58b55');
  }
}
function goTo(goal,action=null){
  if(blocked||transitioning||customizing||!current())return;ui.closeDialogue();
  if(action&&['portfolio','arcade','whatsapp'].includes(action.kind)){activate(action);return;}
  if(action&&interactionDistance(action)<=action.range){activate(action);return;}
  const route=findPath(position,goal,current().obstacles);if(!route.length){ui.toast(tr('Tempat ini terhalang. Coba klik area di sebelahnya.','This spot is blocked. Try a nearby floor area.'));return;}
  path=route;pendingAction=action;targetMarker.position.set(route.at(-1).x,.04,route.at(-1).z);targetMarker.visible=!action;
}
canvas.addEventListener('pointerdown',e=>{canvas.dataset.startX=e.clientX;canvas.dataset.startY=e.clientY;});
canvas.addEventListener('pointerup',e=>{
  if(blocked||transitioning||!renderer||Math.hypot(e.clientX-Number(canvas.dataset.startX),e.clientY-Number(canvas.dataset.startY))>12)return;
  const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
  const intersections=raycaster.intersectObjects([current().group],true);let action=null;
  for(const intersection of intersections){let node=intersection.object;while(node&&node!==scene){if(node.visible&&node.userData.action){action=node.userData.action;break;}node=node.parent;}if(action)break;}
  if(action){goTo(action.approach,action.kind==='walk'?null:action);return;}
  if(raycaster.ray.intersectPlane(ground,hit))goTo({x:hit.x,z:hit.z});
});
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select'))return;
  if(ui.dialogue&&['KeyE','Enter','Space'].includes(e.code)){e.preventDefault();ui.advance();return;}
  if(blocked||transitioning)return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);stopWalking();ui.closeDialogue();}
  if(e.code==='KeyE'&&!e.repeat){e.preventDefault();activate(nearest);}
});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();joystick.x=joystick.z=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();joystick.x=joystick.z=0;}});
document.querySelector('#interaction').onclick=()=>activate(nearest);document.querySelector('#touch-interact').onclick=()=>activate(nearest);
const stick=document.querySelector('#joystick'),knob=document.querySelector('#joystick-knob');let stickPointer=null;
function moveStick(e){if(stickPointer!==e.pointerId||blocked)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dz=e.clientY-r.top-r.height/2,length=Math.hypot(dx,dz),scale=Math.min(1,40/(length||1));joystick.x=length<7?0:dx*scale/40;joystick.z=length<7?0:dz*scale/40;knob.style.transform=`translate(${dx*scale}px,${dz*scale}px)`;stopWalking();ui.closeDialogue();}
stick.onpointerdown=e=>{if(blocked)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);};stick.onpointermove=moveStick;
function resetStick(){stickPointer=null;joystick.x=joystick.z=0;knob.style.transform='';}
stick.onpointerup=resetStick;stick.onpointercancel=resetStick;

const projected=new THREE.Vector3();let labelNodes=[];
function createLabels(){
  const container=document.querySelector('#world-labels');container.replaceChildren();labelNodes=[];
  for(const label of current().labels){const node=document.createElement('span');node.className='world-label';node.style.background=label.color;container.append(node);labelNodes.push({node,label});}
  for(const npc of current().people){if(['ayu','ujang','dimas','kevin'].includes(npc.person.id))continue;const node=document.createElement('span');node.className='world-label emoji';node.textContent=npc.person.id==='laras'?'💡':'💬';container.append(node);labelNodes.push({node,label:{x:npc.person.x,y:1.7,z:npc.person.z},npc});}
}
function updateLabels(){
  for(const {node,label,npc} of labelNodes){
    if(npc){label.x=npc.mesh.position.x;label.z=npc.mesh.position.z;node.textContent=npc.activity==='break'?'☕':npc.person.id==='laras'?'💡':'💬';}
    projected.set(label.x,label.y,label.z).project(camera);const x=(projected.x*.5+.5)*innerWidth,y=(-projected.y*.5+.5)*innerHeight;
    node.hidden=blocked||transitioning||projected.z>1||x<-100||x>innerWidth+100||y<65||y>innerHeight-35;
    if(npc)node.hidden ||= Math.hypot(position.x-label.x,position.z-label.z)>4;
    node.style.left=x+'px';node.style.top=y+'px';if(label.text)node.textContent=tr(...label.text);
  }
}
function updateCamera(dt,snap=false){
  const aspect=innerWidth/innerHeight;
  const mosque=current()?.mosque;
  if(mosque)mosque.exterior.visible=!mosque.contains(position);
  if(customizing){
    const small=innerWidth<640,distance=small?8:6.5,tan=Math.tan(Math.PI/12),offsetX=small?0:380/innerWidth*tan*distance*aspect,offsetY=small?-(.55+16/innerHeight)*tan*distance/.9131:0;
    desiredTarget.set(position.x+offsetX,.65+offsetY,position.z);desiredCamera.copy(desiredTarget).add(new THREE.Vector3(0,distance*.4078,distance*.9131));
  }else if(mosque?.exterior.visible&&aspect>=1.4){
    const distance=Math.max(30.5,58/aspect);
    desiredCamera.set(0,distance*.63,distance*.78);
    desiredTarget.set(0,.8,-4);
  }else{
    const scale=aspect<1.3?1.2:1,y=10.5*scale,z=12*scale;
    const halfView=Math.tan(Math.PI/12)*Math.hypot(y,z)*aspect,maxX=Math.max(0,14-halfView),cx=THREE.MathUtils.clamp(position.x,-maxX,maxX);
    const angle=Math.atan2(y-.8,z+1.8),maxZ=5.85-z+y/Math.tan(angle+Math.PI/12),minZ=Math.min(maxZ,(y-4.7)/Math.tan(angle-Math.PI/12)-z-6),cz=THREE.MathUtils.clamp(position.z,minZ,maxZ);
    desiredCamera.set(cx,y,cz+z);desiredTarget.set(cx,.8,cz-1.8);
  }
  const blend=snap?1:1-Math.exp(-4*dt);camera.position.lerp(desiredCamera,blend);cameraTarget.lerp(desiredTarget,blend);camera.lookAt(cameraTarget);
}
function updateNearest(){
  nearest=!blocked&&!transitioning&&!ui.dialogue?nearestInteraction(position,current().interactions):null;
  const button=document.querySelector('#interaction');button.hidden=!nearest;
  if(nearest){const verb=nearest.kind==='room-door'&&nearest.fixture.isOpen?tr('Tutup','Close'):tr(...nearest.verb);button.querySelector('.interaction-label').textContent=verb+' '+tr(...nearest.label);button.setAttribute('aria-label',tr('Tekan E untuk ','Press E to ')+verb+' '+tr(...nearest.label));}
  document.querySelector('#touch-interact').disabled=!nearest;
}
function updateMovement(dt){
  if(blocked||transitioning)return false;
  let dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joystick.x,dz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joystick.z;
  let length=Math.hypot(dx,dz),remaining=Infinity;
  if(length<.05&&path.length){const p=path[0];dx=p.x-position.x;dz=p.z-position.z;length=remaining=Math.hypot(dx,dz);if(length<.09){path.shift();if(!path.length){targetMarker.visible=false;const action=pendingAction;pendingAction=null;if(action&&interactionDistance(action)<=action.range+.15)activate(action);}return false;}}
  if(length<.05)return false;
  const distance=Math.min(CONFIG.walkSpeed*dt,remaining),prevX=position.x,prevZ=position.z;
  slideMove(position,dx/length*distance,dz/length*distance,current().obstacles);player.position.set(position.x,0,position.z);
  const desiredHeading=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(desiredHeading-player.rotation.y),Math.cos(desiredHeading-player.rotation.y));player.rotation.y+=delta*Math.min(1,dt*12);
  const moved=Math.hypot(position.x-prevX,position.z-prevZ)>.0005;
  if(!moved&&path.length){const door=current().doors.find(d=>!d.collider.disabled&&distanceToAction(position,d.collider)<1.4);if(door)door.requestOpen(2);else{path=[];pendingAction=null;targetMarker.visible=false;}}
  return moved;
}
const breakSpots={raka:{x:-11,z:3.7},dinda:{x:-4.8,z:2.9},bayu:{x:-.45,z:3},sinta:{x:4.6,z:-4.8},laras:{x:7.4,z:4.3},maya:{x:11.25,z:-4.1},kevin:{x:-10,z:1.25},nadia:{x:1.8,z:-1.1}};
function updateCrew(dt){
  const f=current();f.elapsed=(f.elapsed??0)+dt;
  for(const [index,npc] of f.people.entries()){
    if(npc.nextBreak===undefined){npc.nextBreak=28+index*17;npc.activity='work';npc.route=[];}
    const home={x:npc.person.x,z:npc.person.z};
    const obstacles=f.obstacles.filter(o=>!(Math.abs(o.x-home.x)<.05&&Math.abs(o.z-home.z)<.05));
    if(!blocked&&!ui.dialogue&&f.elapsed>=npc.nextBreak&&breakSpots[npc.person.id]){
      if(npc.activity==='work'){
        npc.route=findPath({x:npc.mesh.position.x,z:npc.mesh.position.z},breakSpots[npc.person.id],obstacles);npc.activity='break';npc.nextBreak=f.elapsed+24;
      }else{
        npc.route=findPath({x:npc.mesh.position.x,z:npc.mesh.position.z},home,obstacles);npc.activity='work';npc.nextBreak=f.elapsed+45+index*3;
      }
    }
    let moving=false,heading=npc.baseRotation;
    if(npc.route.length&&!blocked&&!ui.dialogue){
      const next=npc.route[0],dx=next.x-npc.mesh.position.x,dz=next.z-npc.mesh.position.z,d=Math.hypot(dx,dz);
      if(d<.05)npc.route.shift();else{
        const step=Math.min(d,1.20*dt),previous={x:npc.mesh.position.x,z:npc.mesh.position.z},point={...previous};slideMove(point,dx/d*step,dz/d*step,obstacles);npc.mesh.position.x=point.x;npc.mesh.position.z=point.z;heading=Math.atan2(dx,dz);moving=Math.hypot(point.x-previous.x,point.z-previous.z)>.0001;
        if(!moving){const door=f.doors.find(door=>!door.collider.disabled&&distanceToAction(point,door.collider)<1.4);door?.requestOpen(2);}
      }
    }
    npc.action.x=npc.mesh.position.x;npc.action.z=npc.mesh.position.z;npc.action.approach={x:Math.min(12.4,npc.action.x+.85),z:Math.min(5.1,npc.action.z+.6)};
    const distance=Math.hypot(position.x-npc.action.x,position.z-npc.action.z);if(!moving&&distance<2.3&&!customizing)heading=Math.atan2(position.x-npc.action.x,position.z-npc.action.z);
    const delta=Math.atan2(Math.sin(heading-npc.mesh.rotation.y),Math.cos(heading-npc.mesh.rotation.y));npc.mesh.rotation.y+=delta*Math.min(1,dt*4);npc.mesh.userData.animate(walkTime+npc.person.x*.3,moving);
  }
}
function tick(ms){
  const dt=Math.min((ms-last)/1000||0,.05);last=ms;walkTime+=dt;ui.update(ms);
  if(renderer&&world){
    const occupants=[position,...current().people.map(npc=>({x:npc.mesh.position.x,z:npc.mesh.position.z}))];
    for(const door of current().doors)door.update(dt,occupants,!transitioning);
    const moving=updateMovement(dt);player.userData.animate(walkTime,moving);updateCamera(dt);
    updateCrew(dt);
    for(const mesh of current().flames??[])mesh.scale.y=1+Math.sin(walkTime*8+mesh.userData.flame)*.15;
    targetMarker.scale.setScalar(1+.10*Math.sin(walkTime*8));updateNearest();updateLabels();renderer.render(scene,camera);
  }
  if(frame++%60===0)refreshHUD();requestAnimationFrame(tick);
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer?.setSize(innerWidth,innerHeight);if(renderer)renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<640?1.5:2));}
window.addEventListener('resize',resize);

// Only expose tools when the browser supports WebMCP; they use the visible actions.
function registerBrowserTools(){
  if(!document.modelContext?.registerTool)return;const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const tool=(name,description,schema,execute,readOnlyHint=false)=>{
    try{Promise.resolve(document.modelContext.registerTool({name,description,inputSchema:schema,execute,annotations:{readOnlyHint,untrustedContentHint:false}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
  };
  tool('read_office_location','Read the visitor’s current floor and area.',{type:'object',properties:{},additionalProperties:false},()=>({floor:currentFloor,area:areaName()[0]}),true);
  tool('navigate_office_floor','Move the visitor to an office floor, using the same floor transition as the elevator.',{type:'object',properties:{floor:{type:'integer',enum:[0,1,2,3,4]}},required:['floor'],additionalProperties:false},async input=>{if(!input||!Number.isInteger(input.floor)||!world?.floors.has(input.floor))throw new Error('Invalid floor');if(transitioning)throw new Error('Floor transition in progress');await changeFloor(input.floor,input.floor===0?{x:4.2,z:-2.4}:{x:11.7,z:1.4});return {floor:currentFloor,area:areaName()[0]};});
  tool('open_office_portfolio','Open a portfolio project in the visible portfolio panel.',{type:'object',properties:{index:{type:'integer',minimum:0,maximum:PORTFOLIO.length-1}},required:['index'],additionalProperties:false},input=>{if(!input||!Number.isInteger(input.index)||input.index<0||input.index>=PORTFOLIO.length)throw new Error('Invalid project index');ui.showPortfolio(input.index);return {title:PORTFOLIO[input.index].title,panel:'portfolio'};});
}

async function boot(){
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    resize();await document.fonts.ready;world=createWorld(PORTFOLIO);for(const f of world.floors.values()){f.group.visible=f.id===currentFloor;scene.add(f.group);}createLabels();updateLight();updateCamera(1,true);scene.updateMatrixWorld(true);renderer.render(scene,camera);
    if(!initialLook)ui.customize();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ui.close();stopWalking();document.querySelector('#webgl-error').hidden=false;});canvas.addEventListener('webglcontextrestored',()=>location.reload());
  }catch(error){console.error('Kantor virtual gagal memulai renderer:',error);renderer=null;document.querySelector('#webgl-error').hidden=false;updateLight();}
  const loading=document.querySelector('#loading');loading.style.opacity='0';setTimeout(()=>loading.hidden=true,350);refreshHUD();registerBrowserTools();requestAnimationFrame(tick);
}
boot();
