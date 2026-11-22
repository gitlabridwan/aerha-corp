import test from 'node:test';
import assert from 'node:assert/strict';
import {Raycaster,Vector3} from '../dist/assets/vendor/three.module.js';
import {walkable,findPath,lineClear,slideMove} from '../dist/js/navigation.js';

test('A visitor routes around furniture without cutting a blocked corner',()=>{
  const furniture=[{x:0,z:0,w:4,d:2}],start={x:-4,z:0},goal={x:4,z:0};
  const path=findPath(start,goal,furniture);assert.ok(path.length>1);let previous=start;
  for(const point of path){assert.ok(walkable(point.x,point.z,furniture));assert.ok(lineClear(previous,point,furniture));previous=point;}
  assert.deepEqual(path.at(-1),goal);
});
test('A click inside furniture ends at a nearby reachable floor point',()=>{
  const furniture=[{x:0,z:0,w:2,d:2}],path=findPath({x:-4,z:0},{x:0,z:0},furniture);
  assert.ok(path.length);assert.ok(walkable(path.at(-1).x,path.at(-1).z,furniture));
});
test('Keyboard movement slides along furniture and stays inside room bounds',()=>{
  const furniture=[{x:0,z:0,w:2,d:2}],p={x:-1.4,z:0};slideMove(p,2,1.8,furniture);assert.ok(walkable(p.x,p.z,furniture));assert.ok(p.z>1);
  slideMove(p,100,100,furniture);assert.ok(walkable(p.x,p.z,furniture));
});
test('An unreachable room returns no route',()=>{
  const furniture=[{x:0,z:0,w:.2,d:30}];assert.equal(findPath({x:-4,z:0},{x:4,z:0},furniture).length,0);
});
test('Every floor builds valid geometry, every doorway spawn is free, and primary interactions are reachable',async()=>{
  // A small canvas stub validates scene construction without a browser or GPU.
  // It does not claim to validate rendered appearance or WebGL support.
  const ctx=new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:100}):()=>{},set:()=>true});
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
  const {createWorld}=await import('../dist/js/world.js'),{PORTFOLIO}=await import('../dist/js/portfolio-data.js'),world=createWorld(PORTFOLIO);
  assert.equal(world.floors.size,5);let meshes=0;
  for(const f of world.floors.values()){
    const spawn=f.id===0?{x:4.2,z:-2.4}:f.id===4||f.id===1?{x:4.2,z:4.9}:{x:11.7,z:1.4};
    assert.ok(walkable(spawn.x,spawn.z,f.obstacles),`floor ${f.id} spawn is blocked`);
    f.group.updateMatrixWorld(true);f.group.traverse(node=>{assert.ok(node.position.toArray().every(Number.isFinite));if(node.isMesh){meshes++;assert.ok(node.geometry.attributes.position.count>0);}});
    const ids=new Set();
    for(const action of f.interactions){
      assert.ok(!ids.has(action.id),`duplicate action ${action.id}`);
      ids.add(action.id);
      if(f.id!==3&&!['door','lift','reception','npc'].includes(action.kind))continue;
      const route=findPath(spawn,action.approach,f.obstacles);
      assert.ok(route.length,`floor ${f.id}: ${action.id} unreachable`);
      if(action.kind==='walk'){
        assert.deepEqual(route.at(-1),action.approach);
        assert.ok(f.mosque.contains(route.at(-1)));
        continue;
      }
      const p=route.at(-1),dx=Math.max(Math.abs(p.x-action.x)-action.w/2,0),dz=Math.max(Math.abs(p.z-action.z)-action.d/2,0);
      assert.ok(Math.hypot(dx,dz)<=action.range,`floor ${f.id}: ${action.id} goal outside interaction range`);
    }
    for(const action of f.interactions.filter(a=>a.kind==='door')){const destination=world.floors.get(action.target);assert.ok(walkable(action.spawn.x,action.spawn.z,destination.obstacles),`door ${action.id} destination blocked`);}
  }
  const {mosque,obstacles}=world.floors.get(3),{x,z}=mosque.entrance;
  const terrace={x:11.7,z:1.4};
  assert.ok(lineClear({x,z:z+.55},mosque.approach,obstacles),'the archway is open');
  for(const dx of [-2,2])assert.ok(!lineClear({x:x+dx,z:z+.55},{x:x+dx,z:z-.55},obstacles),'the archway is bordered by solid walls');
  const ray=new Raycaster(new Vector3(x,1.35,z+.55),new Vector3(0,0,-1),0,1.1);
  assert.equal(ray.intersectObject(mosque.exterior,true).length,0,'the archway has a visible opening');
  ray.ray.origin.x+=2;
  assert.ok(ray.intersectObject(mosque.exterior,true).length>0,'the façade is visible beside the opening');
  const exit=findPath(mosque.approach,terrace,obstacles);
  assert.deepEqual(exit.at(-1),terrace,'visitors can walk back out to the open terrace');
  assert.ok(meshes>1000);console.log(`Validated ${meshes} scene meshes across five floors.`);
});
