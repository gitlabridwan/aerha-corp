import * as THREE from '../assets/vendor/three.module.js';
import {DEFAULT_LOOK} from './config.js';

const geo={head:new THREE.SphereGeometry(.34,20,14),eye:new THREE.SphereGeometry(.047,10,8),glint:new THREE.SphereGeometry(.014,6,4),arm:new THREE.CapsuleGeometry(.055,.14,4,8),leg:new THREE.CapsuleGeometry(.065,.12,4,8),shoe:new THREE.BoxGeometry(.13,.08,.18),body:new THREE.BoxGeometry(.38,.34,.28)};
function material(color){return new THREE.MeshStandardMaterial({color,roughness:.72});}
function mesh(group,geometry,color,x,y,z,scale){const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
export function createAvatar(value=DEFAULT_LOOK){
  const look={...DEFAULT_LOOK,...value},g=new THREE.Group();
  const body=mesh(g,geo.body,look.top,0,.43,0);
  if(look.outfit==='hoodie'){
    mesh(g,new THREE.TorusGeometry(.11,.035,5,16),look.top,0,.61,-.10).rotation.x=Math.PI/2;
    mesh(g,new THREE.BoxGeometry(.23,.08,.019),'#ffffff',0,.38,.145).material.opacity=.14;g.children.at(-1).material.transparent=true;
    for(const x of [-.04,.04])mesh(g,new THREE.BoxGeometry(.012,.09,.01),'#e9dcc5',x,.53,.145);
  }else{
    for(const x of [-.065,.065]){const collar=mesh(g,new THREE.BoxGeometry(.10,.06,.018),'#eee7dc',x,.56,.145);collar.rotation.z=x>0?.38:-.38;}
    mesh(g,new THREE.SphereGeometry(.012,6,4),'#fffaf0',0,.49,.15);
  }
  const leftArm=mesh(g,geo.arm,look.top,-.225,.45,0),rightArm=mesh(g,geo.arm,look.top,.225,.45,0);
  const hands=[];for(const x of [-.225,.225])hands.push(mesh(g,new THREE.SphereGeometry(.055,10,8),look.skin,x,.34,0));
  const leftLeg=mesh(g,geo.leg,look.pants,-.085,.16,0),rightLeg=mesh(g,geo.leg,look.pants,.085,.16,0);
  const shoes=[];for(const x of [-.085,.085])shoes.push(mesh(g,geo.shoe,'#24232a',x,.05,.03));
  const head=new THREE.Group();head.position.y=.9;head.scale.setScalar(.91);g.add(head);mesh(head,geo.head,look.skin,0,0,0);
  for(const x of [-.12,.12]){
    mesh(head,geo.eye,'#171719',x,-.03,.30,[.88,1.22,.65]);mesh(head,geo.glint,'#ffffff',x-.012,-.01,.33);
    mesh(head,new THREE.SphereGeometry(.032,8,6),'#df917d',x*1.68,-.14,.245,[1,.6,.18]);
  }
  mesh(head,new THREE.SphereGeometry(.028,8,6),look.skin,0,-.087,.335,[1,.7,.75]);
  const smile=mesh(head,new THREE.TorusGeometry(.034,.007,4,10,Math.PI),'#875842',0,-.16,.303);smile.rotation.z=Math.PI;
  for(const x of [-.337,.337])mesh(head,new THREE.SphereGeometry(.057,10,8),look.skin,x,-.023,0,[.55,1,.8]);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.356,20,14,0,Math.PI*2,0,look.hairstyle==='hijab'?Math.PI*.62:Math.PI*.49),material(look.hairstyle==='hijab'?look.hijab:look.hair));hair.position.y=.013;hair.castShadow=true;head.add(hair);
  if(look.hairstyle==='spiky')for(let i=0;i<5;i++){const spike=mesh(head,new THREE.ConeGeometry(.09,.2,5),look.hair,-.2+i*.1,.31+Math.sin(i)*.03,.035);spike.rotation.z=(2-i)*.2;}
  if(look.hairstyle==='long'){
    mesh(head,new THREE.SphereGeometry(.35,16,10),look.hair,0,-.16,-.16,[1,1.05,.5]);
    for(const x of [-.30,.30])mesh(head,new THREE.CapsuleGeometry(.057,.20,4,8),look.hair,x,-.11,.09);
  }
  if(look.hairstyle==='hijab'){
    mesh(head,new THREE.SphereGeometry(.32,16,10),look.hijab,0,-.21,-.105,[1,1,.6]);
    for(const x of [-.3,.3])mesh(head,new THREE.CapsuleGeometry(.06,.24,4,8),look.hijab,x,-.13,.07);
  }
  if(look.glasses){
    for(const x of [-.123,.123]){const glasses=mesh(head,new THREE.TorusGeometry(.072,.012,5,14),'#25242b',x,-.025,.336);glasses.scale.y=.85;}
    mesh(head,new THREE.BoxGeometry(.09,.018,.018),'#25242b',0,-.022,.34);
  }
  g.userData.animate=(time,moving=false)=>{
    const stride=moving?Math.sin(time*13):0;
    leftLeg.rotation.x=stride*.55;rightLeg.rotation.x=-stride*.55;
    leftArm.rotation.x=-stride*.38;rightArm.rotation.x=stride*.38;
    hands[0].position.z=-stride*.07;hands[1].position.z=stride*.07;
    shoes[0].position.z=.03+stride*.05;shoes[1].position.z=.03-stride*.05;
    body.position.y=.43+(moving?Math.abs(stride)*.028:Math.sin(time*2)*.008);
    head.position.y=.9+(moving?Math.abs(stride)*.028:Math.sin(time*2)*.008);
  };
  return g;
}
export function disposeAvatar(g){g.traverse(n=>{if(n.isMesh){n.material.dispose();if(!Object.values(geo).includes(n.geometry))n.geometry.dispose();}});}
