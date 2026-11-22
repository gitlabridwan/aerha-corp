import * as THREE from '../assets/vendor/three.module.js';
import {CONFIG} from './config.js';
import {createDoorMotion} from './doors.js';

const materials=new Map(),geometries=new Map(),textures=new Map();
const seeded=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.75,...extra}));return materials.get(key);}
function geometry(key,fn){if(!geometries.has(key))geometries.set(key,fn());return geometries.get(key);}
function add(g,geo,material,x,y,z){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function box(g,w,h,d,x,y,z,color,extra={}){return add(g,geometry(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d)),mat(color,extra),x,y,z);}
export function ball(g,r,x,y,z,color,s=[1,1,1]){const m=add(g,geometry(`s${r}`,()=>new THREE.SphereGeometry(r,12,8)),mat(color),x,y,z);m.scale.set(...s);return m;}
export function cylinder(g,r,h,x,y,z,color,r2=r,sides=12){return add(g,geometry(`c${r},${r2},${h},${sides}`,()=>new THREE.CylinderGeometry(r,r2,h,sides)),mat(color),x,y,z);}
export function torus(g,r,t,x,y,z,color){return add(g,geometry(`t${r},${t}`,()=>new THREE.TorusGeometry(r,t,6,24)),mat(color),x,y,z);}
export function texture(key,draw,w=1024,h=512){
  if(textures.has(key))return textures.get(key);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;textures.set(key,t);return t;
}
export function screen(g,w,h,x,y,z,kind='code',accent='#3f8fd6'){
  const tex=texture(`screen-${kind}-${accent}`,(c,W,H)=>{
    c.fillStyle=kind==='code'?'#20242e':'#fffaf0';c.fillRect(0,0,W,H);
    if(kind==='code'){
      c.fillStyle='#313643';c.fillRect(0,0,W,H*.13);c.fillRect(0,0,W*.15,H);
      for(let i=0;i<13;i++){c.fillStyle=['#e6c778','#8fa9d3','#b188c6','#78b2a2'][i%4];c.fillRect(W*(.20+(i%3)*.03),H*(.19+i*.055),W*(.15+seeded(i)*.43),H*.016);}
    }else if(kind==='colors'){
      c.fillStyle='#454455';c.fillRect(0,0,W,H*.13);
      for(let i=0;i<12;i++){c.fillStyle=['#e8765d','#f2c14e','#2fa39a','#8a6bbd','#ff7eb6','#3f8fd6'][i%6];c.fillRect(W*(.07+(i%6)*.15),H*(.25+Math.floor(i/6)*.35),W*.12,H*.27);}
    }else if(kind==='game'){
      c.fillStyle='#85cdec';c.fillRect(0,0,W,H);c.fillStyle='#a8d780';c.fillRect(0,H*.7,W,H*.3);c.fillStyle='white';c.fillRect(W*.1,H*.2,W*.22,H*.06);c.fillRect(W*.62,H*.3,W*.15,H*.06);c.fillStyle='#8a6bbd';c.fillRect(W*.43,H*.52,W*.04,H*.18);
    }else if(kind==='stats'){
      c.fillStyle='#232736';c.fillRect(0,0,W,H);c.fillStyle='#dddbe3';c.font='bold 40px Arial';c.fillText('SOCIAL DASHBOARD',W*.05,H*.12);
      for(let i=0;i<4;i++){const X=W*(.04+i*.24);c.fillStyle='#f1edf3';c.font='bold 52px Arial';c.fillText(['12.4K','38.1K','41.7K','9.8K'][i],X,H*.34);for(let j=0;j<7;j++){c.fillStyle=['#d3d7df','#ba8acf','#39bfc3','#6ab6e4'][i];let ht=H*(.08+seeded(i*9+j)*.36);c.fillRect(X+j*W*.024,H*.87-ht,W*.016,ht);}}
    }else{
      c.fillStyle=accent;c.fillRect(0,0,W,H*.54);c.fillStyle='#ffffff';c.font='bold 55px Arial';c.fillText(kind==='finance'?'Finance Overview':'Website untuk',W*.07,H*.24);c.font='35px Arial';c.fillText(kind==='finance'?'Laporan & arus kas':'bisnis Anda',W*.07,H*.37);c.fillStyle='#e3e7eb';for(let i=0;i<3;i++)c.fillRect(W*(.06+i*.31),H*.65,W*.26,H*.23);
    }
  });
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));m.position.set(x,y,z);g.add(m);return m;
}
export function text(g,words,x,y,z,{w=2,h=.38,color='#fffaf0',background='#293542',size=66,glow=false,flat=false}={}){
  const tex=texture(`text:${words}:${color}:${background}:${glow}`,(c,W,H)=>{
    if(background){c.fillStyle=background;c.fillRect(0,0,W,H);}
    c.textAlign='center';c.textBaseline='middle';c.font=`900 ${Math.min(size,(W-40)/(words.length*.58))}px Trebuchet MS, Arial`;
    if(glow){c.shadowColor=color;c.shadowBlur=25;}c.fillStyle=color;c.fillText(words,W/2,H/2);
  },1024,160);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:!background,toneMapped:false,side:THREE.DoubleSide,depthWrite:!!background}));m.position.set(x,y,z);if(flat)m.rotation.x=-Math.PI/2;g.add(m);return m;
}
export function brand(g,x=0,z=-5.76,y=2.2){
  text(g,CONFIG.brand,x,y,z,{w:5.5,h:.7,color:'#ff7eb6',background:null,glow:true,size:92});
  text(g,CONFIG.tagline,x,y-.55,z+.002,{w:3.2,h:.23,color:'#baf7e9',background:null,glow:true,size:60});
}
export function floor(g,{x=0,z=0,w=26,d=12,type='tile',color='#efe7da',alternate='#f7f1e7'}={}){
  box(g,w,.20,d,x,-.15,z,'#322b39');
  const tw=type==='wood'?1.4:.65,td=type==='wood'?.35:.65,nx=Math.ceil(w/tw),nz=Math.ceil(d/td);
  const geom=new THREE.BoxGeometry(w/nx-.015,.06,d/nz-.01),material=mat(color),tiles=new THREE.InstancedMesh(geom,material,nx*nz),o=new THREE.Object3D();
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const idx=j*nx+i;o.position.set(x-w/2+(i+.5)*w/nx,-.025,z-d/2+(j+.5)*d/nz);o.updateMatrix();tiles.setMatrixAt(idx,o.matrix);
    const c=new THREE.Color(type==='wood'?color:(i+j)%2?color:alternate);if(type==='wood')c.multiplyScalar(.91+seeded(idx)*.18);tiles.setColorAt(idx,c);
  }
  tiles.receiveShadow=true;g.add(tiles);
}
export function walls(g,{color='#ded7d1',brick=false}={}){
  box(g,26.4,3.5,.22,0,1.70,-6.12,color);
  box(g,.22,3.5,12.4,-13.12,1.70,0,color);box(g,.22,3.5,12.4,13.12,1.70,0,color);
  for(const x of [-13.12,13.12])box(g,.28,.14,12.5,x,.08,0,'#35323a');box(g,26.5,.14,.3,0,.08,-5.98,'#35323a');
  if(brick){
    box(g,5.7,3.4,.08,-.05,1.75,-5.95,'#663b36');
    for(let j=0;j<13;j++)for(let i=0;i<9;i++)box(g,.60,.018,.012,-2.7+i*.65+(j%2)*.20,.15+j*.26,-5.90,'#422b2a');
  }
}
export function cityWindow(g,x,z=-5.96,y=1.92,w=3,h=1.55){
  box(g,w+.15,h+.15,.1,x,y,z,'#242936');
  const t=texture('night-city',(c,W,H)=>{
    c.fillStyle='#171e3a';c.fillRect(0,0,W,H);c.fillStyle='#fff7bf';c.beginPath();c.arc(W*.77,H*.18,H*.07,0,7);c.fill();
    for(let i=0;i<12;i++){const X=i*W/12,height=H*(.35+seeded(i)*.48);c.fillStyle=i%2?'#222c47':'#273451';c.fillRect(X,H-height,W*.075,height);for(let j=0;j<6;j++)for(let k=0;k<3;k++)if(seeded(i*25+j*3+k)>.38){c.fillStyle='#e6d9a3';c.fillRect(X+W*.008+k*W*.02,H-height+H*.025+j*H*.09,W*.008,H*.035);}}
  });const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z+.06);g.add(m);
  for(const k of [-.25,.25])box(g,.028,h,.04,x+w*k,y,z+.09,'#3a4050');
}
export function clock(g,x,y=2.55,z=-5.90){
  const disk=cylinder(g,.26,.035,x,y,z,'#f6ecd9',.26,32);disk.rotation.x=Math.PI/2;
  const rim=torus(g,.27,.026,x,y,z+.03,'#35323a');
  const h=box(g,.023,.135,.025,x,y+.055,z+.035,'#35323a');h.rotation.z=-.7;box(g,.014,.195,.025,x+.017,y+.08,z+.035,'#35323a');return rim;
}
export function plant(g,x,z,{big=false,pot='#bf7954',height=0}={}){
  const r=big?.27:.18;cylinder(g,r,.33,x,height+.165,z,pot,r*.78);
  cylinder(g,.025,.29,x,height+.44,z,'#825137');
  ball(g,r*1.5,x,height+.57,z,'#27884b',[1,.75,1]);ball(g,r*1.05,x-r*.5,height+.76,z-.03,'#2b9d57',[1,.85,1]);ball(g,r*.9,x+r*.5,height+.72,z+.02,'#3aa95a');
}
export function tree(g,x,z){cylinder(g,.13,1.8,x,.9,z,'#775336');ball(g,.83,x,2.12,z,'#278345',[.9,1.1,.9]);ball(g,.7,x-.43,1.99,z+.1,'#237b3e');ball(g,.65,x+.44,2.25,z,'#2d914c');}
export function desk(g,x,z,{w=2.6,d=1.2,kind='code',accent='#3f8fd6'}={}){
  box(g,w,.11,d,x,.77,z,'#e8e5e9');for(const dx of [-w/2+.15,w/2-.15])for(const dz of [-d/2+.12,d/2-.12])box(g,.05,.69,.05,x+dx,.35,z+dz,'#38313d');
  monitor(g,x,z-.20,kind,accent);box(g,.38,.025,.15,x,.85,z+.15,'#33333d');box(g,.18,.018,.19,x+.4,.845,z+.12,'#dad3db');
  cylinder(g,.055,.14,x+w*.33,.885,z+.15,accent);box(g,.24,.015,.24,x-w*.34,.84,z+.18,accent);
}
export function monitor(g,x,z,kind='code',accent='#3f8fd6',height=.83){
  box(g,.57,.36,.035,x,height+.26,z,'#292833');screen(g,.52,.31,x,height+.26,z+.021,kind,accent);box(g,.045,.13,.05,x,height+.02,z,'#3d3942');box(g,.26,.025,.17,x,height-.035,z,'#3d3942');
}
export function chair(g,x,z,color='#2fa39a',rotation=0){
  const p=new THREE.Group();p.position.set(x,0,z);p.rotation.y=rotation;g.add(p);
  box(p,.6,.1,.55,0,.41,0,color);box(p,.61,.53,.10,0,.74,.23,color);cylinder(p,.045,.33,0,.20,0,'#33323a');
  for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;const b=box(p,.39,.035,.045,Math.sin(angle)*.15,.06,Math.cos(angle)*.15,'#33323a');b.rotation.y=angle;ball(p,.045,Math.sin(angle)*.29,.04,Math.cos(angle)*.29,'#222127');}return p;
}
export function sofa(g,x,z,{w=3,color='#d7a12f',rotation=0}={}){
  const p=new THREE.Group();p.position.set(x,0,z);p.rotation.y=rotation;g.add(p);
  box(p,w,.33,.9,0,.27,0,color);box(p,w,.48,.18,0,.67,-.40,color);for(const dx of [-w/2+.14,w/2-.14])box(p,.25,.49,.9,dx,.58,0,color);
  for(const dx of [-w*.25,w*.25])box(p,w*.40,.09,.66,dx,.48,.07,new THREE.Color(color).multiplyScalar(1.13).getStyle());
  for(const dx of [-w*.30,w*.30]){const cushion=box(p,.37,.30,.14,dx,.71,-.22,dx<0?'#2fa39a':'#e8765d');cushion.rotation.z=dx<0?.13:-.10;}
  for(const dx of [-w/2+.2,w/2-.2])for(const dz of [-.28,.3])box(p,.08,.13,.08,dx,.085,dz,'#59402f');return p;
}
export function table(g,x,z,{w=1.5,d=.75,color='#b58154',height=.43,round=false}={}){
  if(round)cylinder(g,w/2,.08,x,height,z,color,w/2,24);else box(g,w,.10,d,x,height,z,color);
  for(const dx of [-w/2+.13,w/2-.13])for(const dz of [-d/2+.13,d/2-.13])box(g,.055,height-.07,.055,x+dx,(height-.07)/2,z+dz,'#5f4a3b');
  cylinder(g,.04,.12,x-.22,height+.10,z,'#fbf0db');box(g,.32,.015,.22,x+.20,height+.065,z,'#3f8fd6');
}
export function shelf(g,x,z,{w=1.6,h=1.7,d=.45}={}){
  box(g,w,h,d,x,h/2,z,'#986f4b');box(g,w-.10,h-.10,.05,x,h/2,z+d/2,'#5f493a');
  for(let j=0;j<3;j++){
    const y=.14+j*.50;box(g,w,.065,d+.02,x,y,z+.035,'#b88d62');
    for(let i=0;i<6;i++)box(g,.11,.26+seeded(i+j)*.1,.22,x-w*.4+i*w*.12,y+.18,z+.12,['#e8765d','#3f8fd6','#8a6bbd','#f2c14e','#2fa39a','#d8cbc0'][(i+j)%6]);
  }plant(g,x+w*.28,z,{height:h});
}
export function floorLamp(g,x,z){cylinder(g,.23,.055,x,.03,z,'#35323a');cylinder(g,.035,1.9,x,.98,z,'#34323a');const shade=cylinder(g,.23,.28,x,1.96,z,'#f7ecd5',.33);shade.material=mat('#f7ecd5',{emissive:'#ffe8b1',emissiveIntensity:.15});}
export function dispenser(g,x,z){box(g,.48,.86,.45,x,.45,z,'#f1f0ed');box(g,.43,.29,.42,x,.99,z,'#d1e1e8');cylinder(g,.18,.44,x,1.3,z,'#80b6d2',.18,12);for(const dx of [-.09,.09])box(g,.055,.04,.06,x+dx,.86,z+.25,dx<0?'#e8765d':'#3f8fd6');box(g,.28,.09,.04,x,.72,z+.23,'#566071');}
export function partition(g,x1,x2,z,{height=2.6,doorX=null,orientation='horizontal'}={}){
  const root=new THREE.Group();g.add(root);g=root;
  const spans=doorX===null?[[x1,x2]]:[[x1,doorX-.7],[doorX+.7,x2]];
  for(const [a,b] of spans){if(b<=a)continue;const w=b-a;
    if(orientation==='horizontal'){
      box(g,w,.07,.06,(a+b)/2,.08,z,'#292b34');box(g,w,.07,.06,(a+b)/2,height,z,'#292b34');
      box(g,w-.045,height-.12,.025,(a+b)/2,height/2,z,'#b6d6de',{transparent:true,opacity:.15,depthWrite:false});
      for(const x of [a,b])box(g,.07,height,.07,x,height/2,z,'#292b34');
    }else{
      box(g,.06,.07,w,z,.08,(a+b)/2,'#292b34');box(g,.06,.07,w,z,height,(a+b)/2,'#292b34');
      box(g,.025,height-.12,w-.045,z,height/2,(a+b)/2,'#b6d6de',{transparent:true,opacity:.15,depthWrite:false});
      for(const q of [a,b])box(g,.07,height,.07,z,height/2,q,'#292b34');
    }
  }
  if(doorX!==null&&orientation==='horizontal'){
    box(g,1.4,.07,.06,doorX,height,z,'#292b34');
    const leaf=new THREE.Group();leaf.position.set(doorX-.65,0,z);g.add(leaf);
    box(leaf,1.30,height-.12,.025,.65,height/2,0,'#b6d6de',{transparent:true,opacity:.20,depthWrite:false});
    for(const x of [.02,1.28])box(leaf,.035,height-.12,.045,x,height/2,0,'#343641');
    for(const y of [.055,height-.055])box(leaf,1.30,.035,.045,.65,y,0,'#343641');
    for(const side of [-1,1])box(leaf,.026,.24,.07,1.15,1.23,side*.07,'#bca16b');
    const fixture=createDoorMotion({x:doorX,z,w:1.40,d:.08,onProgress:p=>{leaf.rotation.y=Math.PI/2*p;}});
    fixture.leaves=[leaf];root.userData.fixture=fixture;root.userData.doorNode=leaf;
  }
  return root;
}
export function elevator(g,x,z,{roof=false}={}){
  const lift=new THREE.Group();lift.position.set(x,0,z);g.add(lift);
  box(lift,.13,2.55,1.95,.32,1.275,0,'#35343f');box(lift,.07,2.29,1.62,.235,1.19,0,'#171b29');
  for(const dz of [-.9,.9])box(lift,.075,2.5,.08,.14,1.26,dz,'#565866');
  box(lift,.085,.13,1.96,.14,2.46,0,'#565866');box(lift,.10,.06,1.8,.15,.075,0,'#a6a4a6');
  const panels=[];
  for(const dz of [-.40,.40]){const panel=new THREE.Group();panel.position.z=dz;lift.add(panel);box(panel,.04,2.17,.78,.192,1.18,0,'#aaaeb3',{metalness:.35,roughness:.38});box(panel,.045,2.17,.018,.172,1.18,dz<0?.388:-.388,'#656673');panels.push(panel);}
  // Side pockets hide the sliding leaves once they clear the entrance.
  for(const dz of [-1.28,1.28])box(lift,.07,2.30,.86,.13,1.20,dz,roof?'#d4d4d7':'#d9d5d1');
  const fixture=createDoorMotion({x:x+.192,z,w:.08,d:1.60,autoRange:1.65,duration:.72,onProgress:p=>{panels[0].position.z=-.4-.82*p;panels[1].position.z=.4+.82*p;}});
  fixture.leaves=panels;lift.userData.fixture=fixture;
  box(lift,.028,.28,.15,.14,1.16,-1.06,'#393743');ball(lift,.025,.11,1.16,-1.06,'#ffd166');
  text(lift,'LIFT',.11,2.43,0,{w:1.08,h:.20,color:'#ffd166'}).rotation.y=-Math.PI/2;
  if(roof){box(lift,1.05,2.7,.15,.77,1.35,-1.08,'#d4d4d7');box(lift,1.05,2.7,.15,.77,1.35,1.08,'#d4d4d7');box(lift,1.5,.13,2.35,.70,2.75,0,'#33313e');}
  return lift;
}
export function wallDoor(g,x,z=-5.94,{label='AREA KANTOR',color='#888c96'}={}){
  box(g,1.7,2.48,.10,x,1.24,z,'#252631');box(g,1.50,2.30,.08,x,1.21,z+.07,color);
  box(g,.028,2.32,.02,x,1.21,z+.13,'#2f3039');box(g,.035,.24,.04,x+.12,1.11,z+.13,'#d9bc6d');text(g,label,x,2.77,z+.09,{w:2,h:.22,color:'#f2c14e'});
}
export function arcade(g,x,z,color='#2fa39a',rotation=-Math.PI/2){
  const p=new THREE.Group();p.position.set(x,0,z);p.rotation.y=rotation;g.add(p);box(p,.70,.98,.61,0,.49,0,color);box(p,.70,.74,.47,0,1.31,-.13,color);
  box(p,.59,.48,.035,0,1.35,.13,'#232536');screen(p,.49,.34,0,1.39,.153,'game');box(p,.70,.12,.43,0,1.04,.16,'#343442');ball(p,.052,-.16,1.15,.2,'#e8765d');cylinder(p,.048,.04,.17,1.12,.25,'#f2c14e');text(p,'ANTI-BUG',0,1.72,.15,{w:.63,h:.14,color:'#fffaf0',background:'#6e53a0'});return p;
}
export function umbrella(g,x,z,{color='#2fa39a',radius=1.25,height=2.55}={}){
  cylinder(g,.035,height,x,height/2,z,'#775b43');
  const colors=[color,'#f5ecd8'];for(let i=0;i<8;i++){
    const a=i*Math.PI/4,b=(i+1)*Math.PI/4,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,.4,0,Math.sin(a)*radius,0,Math.cos(a)*radius,Math.sin(b)*radius,0,Math.cos(b)*radius],3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat(colors[i%2],{side:THREE.DoubleSide}));m.position.set(x,height,z);m.castShadow=true;g.add(m);
  }
}
export function car(g,x,z,color='#d7a12f'){
  box(g,1.68,.38,3.45,x,.43,z,color);ball(g,.83,x,.57,z,color,[1,.58,2.13]);box(g,1.42,.55,1.83,x,.84,z-.05,'#b4bcc0');ball(g,.71,x,1.05,z-.05,'#aeb7ba',[1,.3,1.28]);
  for(const dx of [-.90,.90])for(const dz of [-1.08,1.08]){const tire=cylinder(g,.28,.15,x+dx,.31,z+dz,'#25242b');tire.rotation.z=Math.PI/2;}
  for(const dx of [-.56,.56])box(g,.28,.10,.06,x+dx,.55,z+1.80,'#fff4ba');
}
export function cityBuildings(g,night=true){
  for(let i=0;i<17;i++){
    const x=-27+i*3.3,height=4.5+seeded(i+24)*6,z=-10.2-seeded(i)*3;
    box(g,2.8,height,2.6,x,height/2-.1,z,night?'#202940':'#99abb4');
    for(let r=0;r<Math.floor(height/.70);r++)for(let c=0;c<3;c++){
      const lit=seeded(i*72+r*3+c)>.27;box(g,.38,.30,.022,x-.91+c*.87,.45+r*.7,z+1.32,lit?'#fff3b2':'#4d5671',{emissive:lit?'#fff0a3':'#000000',emissiveIntensity:night?.42:.03});
    }
  }
}
