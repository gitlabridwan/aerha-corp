export const BOUNDS = {minX:-12.65,maxX:12.65,minZ:-5.65,maxZ:5.3};
export const PLAYER_RADIUS = .28;

export function walkable(x,z,obstacles,bounds=BOUNDS,radius=PLAYER_RADIUS) {
  if (x<bounds.minX || x>bounds.maxX || z<bounds.minZ || z>bounds.maxZ) return false;
  for (const o of obstacles) {
    if(o.disabled)continue;
    const dx=Math.max(Math.abs(x-o.x)-o.w/2,0), dz=Math.max(Math.abs(z-o.z)-o.d/2,0);
    if (dx*dx+dz*dz<radius*radius) return false;
  }
  return true;
}
export function slideMove(position,dx,dz,obstacles,bounds=BOUNDS) {
  const length=Math.hypot(dx,dz), steps=Math.max(1,Math.ceil(length/.12));
  for(let i=0;i<steps;i++) {
    const x=position.x+dx/steps,z=position.z+dz/steps;
    if(walkable(x,z,obstacles,bounds)){position.x=x;position.z=z;}
    else {
      if(walkable(x,position.z,obstacles,bounds))position.x=x;
      if(walkable(position.x,z,obstacles,bounds))position.z=z;
    }
  }
  return position;
}
export function lineClear(a,b,obstacles,bounds=BOUNDS) {
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));
  for(let i=1;i<=steps;i++)if(!walkable(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps,obstacles,bounds))return false;
  return true;
}
// A* grid routing. Diagonal moves require both adjacent cells to be free.
export function findPath(start,goal,obstacles,bounds=BOUNDS) {
  // Automatic doors can be planned through; movement waits until they open.
  obstacles=obstacles.filter(o=>!o.openable);
  const cell=.25,cols=Math.floor((bounds.maxX-bounds.minX)/cell)+1,rows=Math.floor((bounds.maxZ-bounds.minZ)/cell)+1;
  const point=i=>({x:bounds.minX+(i%cols)*cell,z:bounds.minZ+Math.floor(i/cols)*cell});
  const blocked=new Uint8Array(cols*rows);
  for(let i=0;i<blocked.length;i++){const p=point(i);blocked[i]=!walkable(p.x,p.z,obstacles,bounds);}
  function nearest(p) {
    const cx=Math.max(0,Math.min(cols-1,Math.round((p.x-bounds.minX)/cell))),cz=Math.max(0,Math.min(rows-1,Math.round((p.z-bounds.minZ)/cell)));
    let best=-1,dist=Infinity;
    for(let r=0;r<16;r++){
      for(let z=Math.max(0,cz-r);z<=Math.min(rows-1,cz+r);z++)for(let x=Math.max(0,cx-r);x<=Math.min(cols-1,cx+r);x++){
        const i=z*cols+x;if(blocked[i])continue;
        const q=point(i),d=(q.x-p.x)**2+(q.z-p.z)**2;if(d<dist){dist=d;best=i;}
      }
      if(best>=0)return best;
    }
    return -1;
  }
  const from=nearest(start),to=nearest(goal);if(from<0||to<0)return [];
  const end=walkable(goal.x,goal.z,obstacles,bounds)?goal:point(to);
  if(lineClear(start,end,obstacles,bounds))return [end];
  const scores=new Float64Array(cols*rows).fill(Infinity),previous=new Int32Array(cols*rows).fill(-1),closed=new Uint8Array(cols*rows),heap=[];
  const heuristic=i=>Math.hypot(i%cols-to%cols,Math.floor(i/cols)-Math.floor(to/cols));
  function push(node){heap.push(node);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p].f<=node.f)break;heap[i]=heap[p];i=p;}heap[i]=node;}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(last.f<=heap[c].f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first.i;}
  scores[from]=0;push({i:from,f:heuristic(from)});
  while(heap.length){
    const current=pop();if(closed[current])continue;closed[current]=1;
    if(current===to){
      const route=[end];let i=to;while(i!==from){route.push(point(i));i=previous[i];}route.reverse();
      const smooth=[];let anchor=start,k=0;while(k<route.length){let far=k;while(far+1<route.length&&lineClear(anchor,route[far+1],obstacles,bounds))far++;smooth.push(route[far]);anchor=route[far];k=far+1;}return smooth;
    }
    const x=current%cols,z=Math.floor(current/cols);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(nx<0||nx>=cols||nz<0||nz>=rows)continue;
      const next=nz*cols+nx;if(blocked[next]||closed[next])continue;
      if(dx&&dz&&(blocked[z*cols+nx]||blocked[nz*cols+x]))continue;
      const tentative=scores[current]+Math.hypot(dx,dz);
      if(tentative<scores[next]){scores[next]=tentative;previous[next]=current;push({i:next,f:tentative+heuristic(next)});}
    }
  }
  return [];
}
