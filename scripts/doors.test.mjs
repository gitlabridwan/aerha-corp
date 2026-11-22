import test from 'node:test';
import assert from 'node:assert/strict';
import {createDoorMotion,nearestInteraction} from '../dist/js/doors.js';
import {walkable,findPath,lineClear,slideMove} from '../dist/js/navigation.js';

function advance(door,seconds,actors=[],automatic=true){for(let i=0;i<Math.ceil(seconds/.05);i++)door.update(.05,actors,automatic);}

test('A room door animates before its opening becomes walkable, and closing restores collision',async()=>{
  const samples=[],door=createDoorMotion({x:0,z:0,w:1.4,d:.08,onProgress:value=>samples.push(value)});
  assert.equal(walkable(0,0,[door.collider]),false);
  door.requestOpen();const opened=door.waitFor(true);advance(door,.25,[],false);
  assert.ok(door.progress>0&&door.progress<1);assert.equal(walkable(0,0,[door.collider]),false);
  advance(door,.6,[],false);assert.equal(await opened,true);assert.equal(door.isOpen,true);assert.equal(walkable(0,0,[door.collider]),true);
  assert.ok(samples.some(value=>value>0&&value<1));
  assert.equal(door.requestClose(),true);const closed=door.waitFor(false);advance(door,.8,[],false);
  assert.equal(await closed,true);assert.equal(door.isClosed,true);assert.equal(walkable(0,0,[door.collider]),false);
});

test('Approach works from both sides; an occupied doorway stays open and closes after visitors leave',()=>{
  const door=createDoorMotion({x:0,z:0,w:1.4,d:.08});
  advance(door,.8,[{x:0,z:1}]);assert.equal(door.isOpen,true);
  advance(door,1,[{x:0,z:0}]);assert.equal(door.requestClose(),false);
  advance(door,4,[{x:0,z:0}]);assert.equal(door.isOpen,true);
  advance(door,3);assert.equal(door.isClosed,true);
  advance(door,.8,[{x:0,z:-1}]);assert.equal(door.isOpen,true);
});

test('A visitor can close a clear doorway manually without the proximity sensor immediately reopening it',()=>{
  const door=createDoorMotion({x:0,z:0,w:1.4,d:.08}),near=[{x:0,z:1}];
  advance(door,.8,near);assert.equal(door.requestClose(),true);advance(door,1,near);assert.equal(door.isClosed,true);
  door.requestOpen();advance(door,.8,near);assert.equal(door.isOpen,true);
});

test('The E interaction targets a nearby colleague rather than overlapping workstation furniture',()=>{
  const colleague={id:'raka',x:0,z:0,w:.55,d:.4,range:1.55,person:{name:'Raka'},kind:'npc'};
  const desk={id:'desk',x:0,z:.6,w:3,d:.9,range:2,kind:'inspect'};
  assert.equal(nearestInteraction({x:0,z:.9},[desk,colleague]),colleague);
  assert.equal(nearestInteraction({x:0,z:2.3},[desk,colleague]),desk);
  assert.equal(nearestInteraction({x:10,z:10},[desk,colleague]),null);
});

test('CEO/finance geometry pivots, lift leaves slide, and clicks resolve to their real door actions',async()=>{
  const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
  const {createWorld}=await import('../dist/js/world.js'),{PORTFOLIO}=await import('../dist/js/portfolio-data.js');
  const world=createWorld(PORTFOLIO);
  for(const [floorId,id] of [[1,'ceo-door'],[2,'finance-door']]){
    const floor=world.floors.get(floorId),action=floor.interactions.find(a=>a.id===id),door=action.fixture,leaf=door.leaves[0];
    assert.equal(leaf.userData.action,action);assert.equal(leaf.rotation.y,0);
    assert.equal(walkable(action.x,action.z,floor.obstacles),false);
    door.requestOpen();advance(door,.8,[],false);assert.ok(Math.abs(leaf.rotation.y-Math.PI/2)<.00001);
    assert.equal(walkable(action.x,action.z,floor.obstacles),true);
    door.requestClose();advance(door,.8,[],false);assert.equal(leaf.rotation.y,0);
  }
  for(const floorId of [4,1,2,3]){
    const f=world.floors.get(floorId),action=f.interactions.find(a=>a.id==='lift'),door=action.fixture;
    assert.equal(door,f.lift);assert.equal(door.leaves[0].parent.userData.action,action);
    assert.deepEqual(door.leaves.map(p=>p.position.z),[-.4,.4]);
    door.requestOpen();advance(door,.85,[],false);
    assert.ok(door.leaves[0].position.z<-1.2&&door.leaves[1].position.z>1.2);
    door.requestClose({force:true});advance(door,.85,[],false);assert.deepEqual(door.leaves.map(p=>p.position.z),[-.4,.4]);
  }
  const finance=world.floors.get(2),gate=finance.interactions.find(a=>a.id==='finance-door').fixture,start={x:1.8,z:.5},goal={x:1.8,z:-1.5};
  assert.ok(findPath(start,goal,finance.obstacles).length>0);assert.equal(lineClear(start,goal,finance.obstacles),false);
  const player={...start};slideMove(player,0,-2,finance.obstacles);assert.ok(player.z>-.6);
  gate.requestOpen();advance(gate,.8,[],false);assert.equal(lineClear(start,goal,finance.obstacles),true);
  slideMove(player,0,goal.z-player.z,finance.obstacles);assert.ok(Math.abs(player.z-goal.z)<.00001);
});
