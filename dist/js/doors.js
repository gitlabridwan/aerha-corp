// Shared door state keeps the visible animation and the walkable opening in sync.
// Scene builders supply the transform callback; this module also runs without a GPU.
export function createDoorMotion({x,z,w,d,duration=.65,autoRange=1.45,closeDelay=1.8,onProgress=()=>{}}){
  const collider={x,z,w,d,openable:true,disabled:false};
  let progress=0,target=0,hold=0,closeIn=closeDelay,manualClosed=false,actors=[];
  const waiters=new Set();
  const distance=actor=>Math.hypot(Math.max(Math.abs(actor.x-x)-w/2,0),Math.max(Math.abs(actor.z-z)-d/2,0));
  const inOpening=actor=>Math.abs(actor.x-x)<w/2+.32&&Math.abs(actor.z-z)<d/2+.42;
  function apply(){
    collider.disabled=progress>=.85;
    const eased=progress*progress*(3-2*progress);onProgress(eased);
    for(const waiter of waiters)if(Math.abs(progress-(waiter.open?1:0))<.00001){clearTimeout(waiter.timer);waiters.delete(waiter);waiter.resolve(true);}
  }
  const door={
    collider,
    get progress(){return progress;},
    get requestedOpen(){return target===1;},
    get isOpen(){return progress>=.99999;},
    get isClosed(){return progress<=.00001;},
    requestOpen(seconds=4){manualClosed=false;target=1;hold=Math.max(hold,seconds);closeIn=closeDelay;},
    requestClose({force=false}={}){
      if(!force&&actors.some(inOpening))return false;
      manualClosed=true;hold=0;target=0;return true;
    },
    reset(open=false){progress=target=open?1:0;manualClosed=false;hold=0;closeIn=closeDelay;apply();},
    update(dt,occupants=[],automatic=true){
      dt=Math.max(0,Math.min(dt,.1));actors=occupants;hold=Math.max(0,hold-dt);
      if(automatic){
        const near=actors.some(a=>distance(a)<autoRange);
        if(!actors.some(a=>distance(a)<autoRange+.7))manualClosed=false;
        if(progress>.05&&actors.some(inOpening)){manualClosed=false;target=1;closeIn=closeDelay;}
        else if(manualClosed)target=0;
        else if(near||hold>0){target=1;closeIn=closeDelay;}
        else if((closeIn-=dt)<=0)target=0;
      }
      const step=dt/duration;
      progress=target===1?Math.min(1,progress+step):Math.max(0,progress-step);apply();
    },
    waitFor(open){
      if(Math.abs(progress-(open?1:0))<.00001)return Promise.resolve(true);
      return new Promise(resolve=>{const waiter={open,resolve,timer:null};waiter.timer=setTimeout(()=>{waiters.delete(waiter);resolve(false);},5000);waiters.add(waiter);});
    },
  };
  apply();return door;
}

export function interactionDistance(position,action){
  return Math.hypot(Math.max(Math.abs(position.x-action.x)-action.w/2,0),Math.max(Math.abs(position.z-action.z)-action.d/2,0));
}
export function nearestInteraction(position,actions){
  const candidates=actions.filter(a=>interactionDistance(position,a)<=a.range);
  // Nearby colleagues take precedence over the furniture at their workstation.
  const people=candidates.filter(a=>a.person&&Math.hypot(position.x-a.x,position.z-a.z)<1.8);
  const eligible=people.length?people:candidates;
  return eligible.reduce((best,a)=>!best||interactionDistance(position,a)<interactionDistance(position,best)?a:best,null);
}
