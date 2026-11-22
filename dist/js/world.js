import * as THREE from '../assets/vendor/three.module.js';
import * as P from './props.js';
import {CREW,DEFAULT_LOOK} from './config.js';
import {createAvatar} from './avatar.js';
import {addRooftopMosque} from './rooftop-mosque.js';

export function createWorld(portfolio){
  const floors=new Map();
  for(const id of [0,4,1,2,3])floors.set(id,{id,group:new THREE.Group(),obstacles:[],interactions:[],people:[],labels:[],doors:[]});
  const register=(f,node,{id,label,verb=['Lihat','Look at'],x,z,w=1,d=1,kind='inspect',range=1.5,approach=null,pages=[],...rest})=>{
    const action={id,label,verb,x,z,w,d,kind,range,approach:approach??{x,z:z+d/2+.6},pages,...rest};
    f.interactions.push(action);if(node)node.userData.action=action;return action;
  };
  const obstacle=(f,x,z,w,d)=>f.obstacles.push({x,z,w,d});
  const plant=(f,x,z,big=false)=>{P.plant(f.group,x,z,{big});obstacle(f,x,z,big?.7:.45,big?.7:.45);};
  const desk=(f,x,z,kind='code',accent='#3f8fd6')=>{P.desk(f.group,x,z,{kind,accent});P.chair(f.group,x,z+1.05,accent,Math.PI);obstacle(f,x,z,2.6,1.2);obstacle(f,x,z+1.05,.6,.5);};
  const inspect=(f,node,id,label,x,z,w,d,pages,rest={})=>register(f,node,{id,label:[label,label],x,z,w,d,pages, ...rest});
  const lift=f=>{const node=P.elevator(f.group,12.75,1.4,{roof:f.id===3}),fixture=node.userData.fixture;f.doors.push(fixture);f.lift=fixture;register(f,node,{id:'lift',label:['Lift','Elevator'],verb:['Naik','Take'],x:12.75,z:1.4,w:.6,d:2.2,kind:'lift',range:1.4,approach:{x:11.7,z:1.4},fixture});obstacle(f,12.94,1.4,.45,2.2);};
  const roomDoor=(f,node,id,label,x,z)=>{const fixture=node.userData.fixture;f.doors.push(fixture);f.obstacles.push(fixture.collider);register(f,node.userData.doorNode,{id,label,verb:['Buka','Open'],x,z,w:1.4,d:.08,kind:'room-door',range:1.45,approach:{x,z:z+.85},fixture});};
  const floorExit=(f,x,z,label,target,spawn)=>{const sign=P.text(f.group,label[0].toUpperCase()+' ▾',x,.035,z,{w:1.8,h:.7,color:'#f5e4c3',background:'#7d4e3c',flat:true});register(f,sign,{id:'exit',label,verb:['Keluar ke','Exit to'],x,z,w:1.8,d:1,kind:'door',range:1.1,approach:{x,z:z-.45},target,spawn});};

  // Halaman depan: fasad, gerobak kopi, taman, dan area parkir.
  {
    const f=floors.get(0),g=f.group;
    P.floor(g,{type:'wood',color:'#bcad94',alternate:'#c4b79d'});
    P.box(g,20,.065,7.55,3,-.005,.7,'#3c3b42');P.box(g,6,.06,8,-10,-.005,.7,'#7da966');
    P.floor(g,{x:0,z:-4.75,w:26,d:2.5,type:'tile',color:'#d2c3a8',alternate:'#c5b69d'});
    P.box(g,26.6,6.4,.4,0,3.15,-6.15,'#e6dfca');P.box(g,26.6,.20,.45,0,3.35,-5.92,'#393641');
    for(const row of [0,1])for(let i=0;i<10;i++){
      const x=-12+i*2.62;P.box(g,2.05,2.38,.05,x,1.55+row*3.2,-5.91,'#f0d797',{emissive:'#e8cf8a',emissiveIntensity:.18});
      P.box(g,.08,2.38,.035,x,1.55+row*3.2,-5.865,'#37333e');
    }
    P.box(g,2.2,2.8,.12,4.2,1.4,-5.76,'#232b2e');P.box(g,1.96,2.53,.03,4.2,1.31,-5.68,'#f3dfa2',{emissive:'#d1ac55',emissiveIntensity:.12});P.box(g,.05,2.55,.06,4.2,1.31,-5.63,'#3e3b32');
    P.box(g,2.47,.10,.60,4.2,2.83,-5.45,'#156347');P.box(g,2.3,.08,.6,4.2,.04,-5.48,'#794938');
    P.brand(g,-3.9,-5.63,3.1);
    const door=P.box(g,2,2.6,.025,4.2,1.35,-5.61,'#f4d890',{transparent:true,opacity:.01});
    register(f,door,{id:'front-door',label:['Lobi','Lobby'],verb:['Masuk ke','Enter'],x:4.2,z:-5.8,w:2,d:.2,range:1.7,kind:'door',approach:{x:4.2,z:-4.7},target:4,spawn:{x:4.2,z:4.9}});
    for(const x of [-9.5,-1.2,9.8]){P.box(g,2.4,.38,.6,x,.19,-5.25,'#938675');for(const dx of [-.76,0,.76])P.ball(g,.30,x+dx,.66,-5.25,'#4b9f45');obstacle(f,x,-5.25,2.4,.6);}
    for(const x of [-11.4,-7.8,1,8.4,12]){P.cylinder(g,.037,2.55,x,1.28,-3.4,'#25252b');P.ball(g,.15,x,2.67,-3.4,'#fff4c9');}
    for(const [x,z] of [[-11.4,-1.65],[-10.8,1.4]]){P.tree(g,x,z);obstacle(f,x,z,.45,.45);}
    for(const [x,z] of [[-5.6,-4.3],[-3.2,3.1]]){P.table(g,x,z,{w:2.7,d:.49,height:.45,color:'#9d613d'});P.box(g,2.7,.28,.08,x,.7,z-.25,'#9d613d');obstacle(f,x,z,2.7,.7);}
    P.cylinder(g,1.15,.26,-7,.13,.4,'#c7c0aa',1.25,24);P.cylinder(g,1.03,.035,-7,.28,.4,'#78bccc',1.03,24);P.cylinder(g,.15,.72,-7,.62,.4,'#d7d3c0');P.ball(g,.23,-7,1.01,.4,'#bddfe3',[1,.8,1]);obstacle(f,-7,.4,2.35,2.35);
    P.box(g,2,.16,.8,-10.2,.12,3.2,'#a58158');for(let i=0;i<14;i++){const x=-11+seed(i)*1.65,z=2.94+seed(i+20)*.52;P.ball(g,.075,x,.34,z,['#ff7eb6','#f2c14e','#e8765d'][i%3]);}
    for(const [x,color] of [[4,'#d7a12f'],[7.6,'#1e9c72']]){P.car(g,x,.9,color);obstacle(f,x,.9,1.9,3.7);}
    for(const x of [2.4,6,9.6,12.1])P.box(g,.05,.015,4.3,x,.044,.9,'#eeeee7');
    P.box(g,.45,.21,1.2,11.1,.45,.9,'#8a6bbd');for(const z of [.4,1.4]){const tire=P.cylinder(g,.26,.09,11.1,.25,z,'#25242b');tire.rotation.z=Math.PI/2;}obstacle(f,11.1,.9,.65,1.5);
    P.box(g,26,.04,1.4,0,.004,5.22,'#4b4850');for(let i=0;i<14;i++)P.box(g,1.1,.012,.07,-12+i*1.9,.04,5.2,'#ddd6c8');
    const cart=new THREE.Group();g.add(cart);P.box(cart,1.7,.69,.85,.6,.52,-4.2,'#b27b2d');P.box(cart,1.82,.09,.97,.6,.91,-4.2,'#835537');for(const x of [-.02,1.22]){const t=P.cylinder(cart,.20,.13,x,.20,-3.76,'#1f2025');t.rotation.x=Math.PI/2;}
    P.umbrella(cart,.6,-4.2,{height:2.4,radius:1.35});for(const x of [.1,.42,.8,1.1])P.cylinder(cart,.055,.13,x,1.03,-4.15,'#e4e8dc');obstacle(f,.6,-4.2,1.7,.95);
    inspect(f,cart,'coffee-cart','Gerobak Kopi',.6,-4.2,1.7,.9,[['Kopi susu gula aren, kopi hitam, atau teh hangat? Mang Ujang selalu siap menemani hari kerja.','Palm sugar latte, black coffee, or warm tea? Mang Ujang has you covered.']],{verb:['Pesan di','Order at'],approach:{x:.6,z:-3.1}});
    for(const x of [-3.1,6.4]){P.cylinder(g,.045,1.4,x,.7,-5.13,'#4d3b31');P.box(g,.40,.34,.30,x,1.51,-5.13,'#b95e43');}
  }

  // Lobi dan ruang tunggu.
  {
    const f=floors.get(4),g=f.group;P.floor(g);P.walls(g);
    P.box(g,6,3.4,.08,0,1.7,-5.91,'#82573d');for(let i=0;i<30;i++)P.box(g,.045,3.4,.024,-2.9+i*.2,1.7,-5.85,i%2?'#926546':'#744b33');P.brand(g,0,-5.78,2.35);
    P.cylinder(g,2.15,.014,-3.5,.027,1.7,'#d36a9f',2.15,64);P.cylinder(g,1.96,.017,-3.5,.045,1.7,'#ebd4c5',1.96,64);
    const reception=new THREE.Group();g.add(reception);P.box(reception,4.4,.86,1,0,.43,-3.2,'#e4cda9');P.box(reception,4.5,.12,1.08,0,.91,-3.2,'#855d40');P.text(reception,'RESEPSIONIS',0,.55,-2.685,{w:1.7,h:.24});P.monitor(reception,0,-3.35,'browser','#e26d9c',.98);P.plant(reception,-1.9,-3.2,{height:.98});P.cylinder(reception,.045,.1,1.65,1.03,-3.1,'#f2c14e');obstacle(f,0,-3.2,4.4,1);P.chair(g,0,-4.25,'#e26d9c');obstacle(f,0,-4.25,.6,.6);
    register(f,reception,{id:'reception',label:['Resepsionis','Reception'],verb:['Ngobrol dengan','Talk to'],x:0,z:-3.2,w:4.4,d:1,kind:'reception',range:2.5,approach:{x:0,z:-1.95}});
    const lounge=P.sofa(g,-8.6,-4.35,{w:3.2,color:'#2fa39a'});P.table(g,-8.6,-2.75);P.sofa(g,-11.7,-2.4,{w:1,color:'#e26d9c',rotation:Math.PI/2});P.sofa(g,-5.6,-2.4,{w:1,color:'#d7a12f',rotation:-Math.PI/2});P.floorLamp(g,-11,-5.35);obstacle(f,-8.6,-4.35,3.2,1);obstacle(f,-8.6,-2.75,1.5,.75);obstacle(f,-11.7,-2.4,1,1);obstacle(f,-5.6,-2.4,1,1);
    inspect(f,lounge,'sofa-lobby','Sofa Tamu',-8.6,-4.35,3.2,1,[['Silakan duduk dulu, Kak. Di sini bisa santai sambil melihat portofolio kami.','Make yourself comfortable and browse our portfolio.']],{verb:['Duduk di','Sit on'],approach:{x:-8.6,z:-3.35}});
    const cat=new THREE.Group();cat.position.set(-9.3,.54,-4.25);g.add(cat);P.ball(cat,.21,0,.12,0,'#ed9747',[1.7,.65,.72]);P.ball(cat,.13,.24,.16,.03,'#ed9747');for(const x of [.18,.3]){const ear=P.cylinder(cat,0,.13,x,.28,.03,'#ed9747',.06,3);ear.rotation.z=.2;}const tail=P.torus(cat,.16,.045,-.35,.13,0,'#ed9747');tail.rotation.x=Math.PI/2;
    inspect(f,cat,'piksel','Piksel si Kucing',-9.3,-4.25,.5,.4,[['Piksel: mrrr… zzz… Jangan lupa istirahat setelah selesai coding.','Piksel: mrrr… zzz… Remember to take a break after coding.']],{verb:['Elus','Pet'],range:2.1,approach:{x:-9.3,z:-3.28}});
    const boards=[];for(const [i,x] of [-10.3,-8.6,-6.9].entries()){
      const b=new THREE.Group();g.add(b);P.box(b,1.56,1.06,.06,x,1.95,-5.92,'#30303b');P.screen(b,1.45,.95,x,1.95,-5.87,'browser',['#e8765d','#3f8fd6','#f2994a'][i]);boards.push(b);register(f,b,{id:'portfolio-'+i,label:['Portofolio','Portfolio'],verb:['Lihat','Browse'],x,z:-5.85,w:1.6,d:.2,kind:'portfolio',index:i,range:3,approach:{x:-5.45,z:-4.6}});
    }P.text(g,'PORTOFOLIO KAMI',-8.6,2.72,-5.84,{w:3,h:.26,color:'#f2c14e'});f.labels.push({x:-8.6,y:1.15,z:-5.5,text:['Klik untuk lihat portofolio','Click to view portfolio'],color:'#e8765d',action:'portfolio-0'});
    const tv=new THREE.Group();g.add(tv);P.box(tv,2.45,1.5,.08,5.4,1.75,-5.94,'#282a34');P.screen(tv,2.30,1.35,5.4,1.75,-5.89,'browser','#e8765d');register(f,tv,{id:'slideshow',label:['Portofolio','Portfolio'],verb:['Lihat','Browse'],x:5.4,z:-5.8,w:2.45,d:.15,kind:'portfolio',index:0,range:3,approach:{x:5.4,z:-4.3}});f.labels.push({x:5.4,y:.85,z:-5.5,text:['Lihat portofolio','View portfolio'],color:'#e8765d',action:'slideshow'});
    const door=new THREE.Group();g.add(door);P.wallDoor(door,8.2);register(f,door,{id:'office-door',label:['Area Kantor','Office'],verb:['Masuk ke','Enter'],x:8.2,z:-5.85,w:1.6,d:.2,range:1.6,kind:'door',approach:{x:8.2,z:-4.6},target:1,spawn:{x:4.2,z:4.9}});
    P.cityWindow(g,11);P.clock(g,-3.8);P.shelf(g,-12.62,1,{w:.45,d:1.8});obstacle(f,-12.62,1,.6,1.9);
    const game=P.arcade(g,12.35,-4.3);register(f,game,{id:'arcade',label:['Game Lompat Anti-Bug','Anti-Bug Jump'],verb:['Main','Play'],x:12.35,z:-4.3,w:.8,d:.8,range:1.2,kind:'arcade',approach:{x:11.3,z:-4.3}});obstacle(f,12.35,-4.3,.8,.8);f.labels.push({x:12.25,y:2.15,z:-4.3,text:['Main & dapat voucher','Play & get a voucher'],color:'#8a6bbd',action:'arcade'});
    for(const [z,color,name] of [[3.05,'#c2353d','Vending Minuman'],[4.1,'#325e9b','Vending Camilan']]){
      const v=new THREE.Group();v.position.set(12.4,0,z);v.rotation.y=-Math.PI/2;g.add(v);P.box(v,.75,1.95,.65,0,.98,0,color);P.box(v,.53,1.25,.04,-.07,1.2,.34,'#b7d9e9');for(let i=0;i<9;i++)P.cylinder(v,.043,.14,-.22+(i%3)*.13,.83+Math.floor(i/3)*.27,.38,['#f2c14e','#e8765d','#2fa39a'][i%3]);P.box(v,.26,.10,.06,0,.34,.35,'#25252e');obstacle(f,12.4,z,.8,.95);inspect(f,v,name,name,12.4,z,.8,.95,[['Kopi susu, teh dingin, jus, dan camilan. Favorit tim programmer: kopi susu!','Coffee, iced tea, juice, and snacks. The programmers love iced coffee.']],{approach:{x:11.2,z}});
    }
    const brochure=new THREE.Group();g.add(brochure);P.cylinder(brochure,.025,1.1,3.4,.55,-3.3,'#292b32');P.cylinder(brochure,.17,.03,3.4,.015,-3.3,'#292b32');P.box(brochure,.50,.37,.045,3.4,1.20,-3.3,'#f6ecd9');for(let i=0;i<3;i++)P.box(brochure,.14,.28,.016,3.24+i*.16,1.20,-3.267,['#e8765d','#2fa39a','#f2c14e'][i]);inspect(f,brochure,'brochure','Rak Brosur',3.4,-3.3,.55,.45,[['Website company profile, toko online, dan landing page untuk bisnis Anda. Konsultasi dan penawaran gratis melalui resepsionis.','Company profiles, online stores, and landing pages for your business. Ask reception for a free consultation.']],{approach:{x:3.4,z:-2.3}});
    P.box(g,.18,.56,.18,2.9,.28,5.25,'#6b4f3a');for(const dx of [-.07,.07])P.cylinder(g,.022,.9,2.9+dx,.74,5.25,dx<0?'#e8765d':'#3f8fd6');P.dispenser(g,-12.4,3.2);obstacle(f,-12.4,3.2,.55,.55);
    for(const [x,z] of [[-3.4,-5.4],[3.4,-5.4],[9.5,-5.45],[-12.3,5.2],[12.2,5.2]])plant(f,x,z);P.cylinder(g,.24,.43,12.35,.22,-1.25,'#25a863');
    floorExit(f,4.2,5.0,['Halaman Depan','Front Yard'],0,{x:4.2,z:-4.7});lift(f);
  }

  // Lantai satu: area programmer, sales, dan ruang CEO.
  {
    const f=floors.get(1),g=f.group;
    P.floor(g,{x:-8,z:0,w:10,d:12,color:'#c5c8cd',alternate:'#d2d2d6'});P.floor(g,{x:1.75,w:9.5,type:'wood',color:'#d7bd97'});P.floor(g,{x:9.75,w:6.5,type:'wood',color:'#715343'});P.walls(g,{brick:true});P.brand(g,-.1,-5.80,2.35);
    for(const [x,z] of [[-10,-3.2],[-5.8,-3.2]])desk(f,x,z);for(const [x,z] of [[-.2,-3.2],[3.8,-3.2]])desk(f,x,z,'browser','#f2c14e');
    P.text(g,'PROGRAMMER',-7.9,2.9,-5.82,{w:2.2,h:.22,color:'#c1f3ec',background:'#326878'});P.text(g,'SALES',3.1,2.9,-5.81,{w:1.3,h:.22,color:'#80e78e'});P.text(g,'CEO',9.5,2.9,-5.81,{w:1,h:.22,color:'#f2c14e'});
    P.shelf(g,-7.9,-5.55);obstacle(f,-7.9,-5.55,1.6,.5);P.box(g,.7,1.85,.6,-3.8,.925,-5.45,'#252631');for(let i=0;i<6;i++)P.ball(g,.017,-3.9,.23+i*.25,-5.14,'#5ce09e');obstacle(f,-3.8,-5.45,.7,.6);
    P.cityWindow(g,-11.1);P.cityWindow(g,11);P.clock(g,-6.3);
    P.partition(g,-6,-.45,6.5,{orientation:'vertical'});const ceoPartition=P.partition(g,6.5,13,-.45,{doorX:7.9});roomDoor(f,ceoPartition,'ceo-door',['Pintu Ruang CEO','CEO Office Door'],7.9,-.45);obstacle(f,6.5,-3.22,.10,5.55);obstacle(f,6.9,-.45,.8,.09);obstacle(f,10.83,-.45,4.35,.09);P.text(g,'CEO',9.75,2.68,-.40,{w:1.1,h:.20,color:'#f2c14e'});
    P.desk(g,9.8,-2.5,{w:3,d:1.3,kind:'stats',accent:'#c99a2e'});P.chair(g,9.8,-3.7,'#3c3542');obstacle(f,9.8,-2.5,3,1.3);obstacle(f,9.8,-3.7,.7,.7);for(const x of [9.1,10.5]){P.chair(g,x,-1.1,'#e4c997',Math.PI);obstacle(f,x,-1.1,.6,.6);}
    const ceo=new THREE.Group();g.add(ceo);P.box(ceo,.77,1.25,.65,12.25,.625,-4.4,'#4d5461');P.box(ceo,.65,1.04,.045,12.25,.67,-4.06,'#666d79');P.torus(ceo,.11,.015,12.25,.79,-4.01,'#a4a8ae');obstacle(f,12.25,-4.4,.8,.7);inspect(f,ceo,'safe','Brankas',12.25,-4.4,.8,.7,[['Brankas CEO. Isinya? Mungkin kontrak, mungkin stok kopi darurat.','The CEO’s safe. Contracts, or perhaps an emergency coffee stash.']]);
    const computer=P.box(g,.7,.45,.08,9.8,1.1,-2.68,'#ffffff',{transparent:true,opacity:0});computer.castShadow=false;
    inspect(f,computer,'ceo-computer','Komputer CEO',9.8,-2.5,1.2,1,[['Komputer ini hanya dapat diakses pemilik kantor. Silakan hubungi resepsionis untuk kebutuhan Anda.','This computer is reserved for the office owner. Reception can help with your request.']],{approach:{x:9.8,z:-3.7}});
    P.box(g,1.4,.43,.45,7.5,.23,-5.55,'#8e6746');for(const x of [7.1,7.5,7.9]){P.cylinder(g,.05,.29,x,.62,-5.55,'#dfb842',.08);P.ball(g,.10,x,.83,-5.55,'#f2c14e');}
    P.box(g,.45,.75,2.6,-3,.375,-3.3,'#b38859');for(let i=0;i<7;i++)P.ball(g,.18,-3,.94,-4.4+i*.35,'#33904f');obstacle(f,-3,-3.3,.5,2.6);
    P.dispenser(g,5.85,-5.45);obstacle(f,5.85,-5.45,.55,.55);
    const kanban=new THREE.Group();g.add(kanban);P.box(kanban,2.05,1.33,.04,4.2,1.95,-5.88,'#3c3941');P.box(kanban,1.96,1.23,.02,4.2,1.95,-5.85,'#e2ddd4');for(let i=0;i<12;i++)P.box(kanban,.28,.14,.012,3.49+(i%4)*.44,2.28-Math.floor(i/4)*.27,-5.83,['#b7d8ef','#f2c14e','#e8a6c1','#8dbfa1'][i%4]);inspect(f,kanban,'kanban','Papan Kanban',4.2,-5.85,2,.1,[['To do, in progress, done. Setiap proyek punya langkah yang jelas agar selesai tepat waktu.','To do, in progress, done. Every project follows a clear path to delivery.']],{range:2.8,approach:{x:4.2,z:-4.3}});
    const coffee=new THREE.Group();g.add(coffee);P.box(coffee,2.8,.73,.9,-11,.365,2.5,'#e3ddd1');P.box(coffee,2.85,.09,.95,-11,.78,2.5,'#bb906b');P.box(coffee,.65,.04,.24,-11.6,.85,2.5,'#eee7da');P.ball(coffee,.06,-11.7,.92,2.5,'#e8765d');P.ball(coffee,.06,-11.5,.92,2.5,'#f2c14e');P.box(coffee,.4,.26,.33,-10.25,.955,2.5,'#ede9df');obstacle(f,-11,2.5,2.8,.9);inspect(f,coffee,'coffee','Coffee Corner',-11,2.5,2.8,.9,[['Kopi dulu, baru debug. Silakan ambil secangkir dan santai sebentar.','Coffee first, debugging later. Help yourself to a cup.']],{verb:['Minum di','Have coffee at'],approach:{x:-11,z:3.7}});
    const ping=new THREE.Group();g.add(ping);P.box(ping,2.7,.09,1.5,-6.8,.78,2.9,'#2786a4');for(const dx of [-1.1,1.1])for(const dz of [-.55,.55])P.box(ping,.06,.72,.06,-6.8+dx,.36,2.9+dz,'#3c3941');P.box(ping,.015,.20,1.50,-6.8,.91,2.9,'#e3e6da',{transparent:true,opacity:.6});P.box(ping,2.7,.01,.025,-6.8,.833,2.9,'#eef0de');P.ball(ping,.075,-7.65,.84,2.5,'#e8765d',[1,.15,1]);P.ball(ping,.075,-5.95,.84,3.3,'#22252d',[1,.15,1]);P.box(g,3.4,.012,2.15,-6.8,.022,2.9,'#dbcfb3');obstacle(f,-6.8,2.9,2.7,1.5);inspect(f,ping,'ping-pong','Meja Ping Pong',-6.8,2.9,2.7,1.5,[['Best of three? Tim programmer siap menantang tim sales setelah jam kerja.','Best of three? The programmers challenge the sales team after work.']],{verb:['Main','Play'],approach:{x:-4.8,z:2.9}});
    const lounge=P.sofa(g,1.6,3,{color:'#d8a131'});P.table(g,1.6,4.35,{w:1.4,d:.7,color:'#eee8da'});P.box(g,3.8,.01,3.0,1.6,.01,3.7,'#d87862');P.box(g,3.5,.01,2.7,1.6,.025,3.7,'#e7d8bc');obstacle(f,1.6,3,3,1);obstacle(f,1.6,4.35,1.4,.7);inspect(f,lounge,'office-sofa','Sofa Santai',1.6,3,3,1,[['Tempat favorit untuk brainstorming. Ide bagus sering lahir sambil duduk santai.','A favorite brainstorming spot. Great ideas start with a relaxed conversation.']],{verb:['Duduk di','Sit on'],approach:{x:-.4,z:3}});
    for(const [x,z,big] of [[-12.4,-5.4,0],[-3,5.1,1],[-2.4,-5.3,0],[6.1,5.1,1],[12.4,-5.4,0],[-12.3,5.1,1]])plant(f,x,z,big);
    floorExit(f,4.2,5.0,['Lobi','Lobby'],4,{x:8.2,z:-4.6});lift(f);
  }

  // Lantai dua: studio, finance, social media, dan open space.
  {
    const f=floors.get(2),g=f.group;P.floor(g,{type:'wood',color:'#d8bd94'});P.walls(g,{color:'#eadfd1'});
    P.box(g,10,.014,5.35,-8,.016,-2.7,'#e5d6d2');P.box(g,9.2,.014,5.35,7.75,.016,-2.7,'#ead9e6');
    const financePartition=P.partition(g,-5,3.5,-.6,{doorX:1.8});roomDoor(f,financePartition,'finance-door',['Pintu Ruang Finance','Finance Office Door'],1.8,-.6);P.partition(g,-6,-.6,-5,{orientation:'vertical'});P.partition(g,-6,-.6,3.5,{orientation:'vertical'});obstacle(f,-5,-3.3,.08,5.4);obstacle(f,3.5,-3.3,.08,5.4);obstacle(f,-1.95,-.6,6.1,.08);obstacle(f,3,-.6,1,.08);P.text(g,'FINANCE',-.8,2.75,-.55,{w:1.7,h:.23,color:'#b4deed'});
    desk(f,-.8,-3.2,'finance');desk(f,5.7,-3.2,'colors','#8a6bbd');desk(f,9.1,-3.2,'browser','#8a6bbd');
    P.text(g,'FINANCE',-.8,2.85,-5.87,{w:1.7,h:.23,color:'#b4deed'});P.text(g,'TIM SOCIAL MEDIA',7.2,2.9,-5.87,{w:3,h:.27,color:'#fffaf0',background:'#8a6bbd'});P.cityWindow(g,-2.6);P.cityWindow(g,10.9);P.box(g,3.10,1.48,.08,6.6,1.8,-5.89,'#252731');P.screen(g,2.95,1.34,6.6,1.8,-5.84,'stats');P.box(g,1.8,1.08,.08,1.9,1.8,-5.91,'#252731');P.screen(g,1.65,.94,1.9,1.8,-5.86,'stats');
    P.box(g,.7,1.25,.6,-4.35,.625,-5.45,'#bbc0c6');for(let i=0;i<4;i++){P.box(g,.64,.018,.03,-4.35,.2+i*.29,-5.13,'#696a72');P.box(g,.20,.025,.035,-4.35,.33+i*.29,-5.11,'#414550');}P.plant(g,-4.35,-5.45,{height:1.28});obstacle(f,-4.35,-5.45,.7,.6);P.sofa(g,-4.45,-2.1,{w:1.8,color:'#5c9abb',rotation:Math.PI/2});obstacle(f,-4.45,-2.1,.8,1.8);
    const backdrop=new THREE.Group();g.add(backdrop);P.box(backdrop,3.6,2.6,.06,-9.2,1.3,-5.55,'#d19bbd');P.box(backdrop,3.6,.012,1.7,-9.2,.02,-4.70,'#d5a2c1');for(const x of [-11,-7.4])P.cylinder(backdrop,.025,2.65,x,1.32,-5.55,'#35333c');P.text(g,'STUDIO KONTEN',-9.2,2.96,-5.88,{w:2.7,h:.24});P.text(g,'ON AIR',-6.2,2.5,-5.87,{w:1.1,h:.22,color:'#ef91ab',background:'#4e2837'});obstacle(f,-9.2,-5.55,3.6,.25);
    const cam=new THREE.Group();g.add(cam);for(let i=0;i<3;i++){const leg=P.box(cam,.025,.85,.025,-9.2+Math.sin(i*2.094)*.25,.44,-1.6+Math.cos(i*2.094)*.25,'#292833');leg.rotation.z=Math.sin(i*2.094)*.45;leg.rotation.x=Math.cos(i*2.094)*.45;}P.box(cam,.34,.21,.19,-9.2,1.06,-1.6,'#25252e');const lens=P.cylinder(cam,.077,.13,-9.2,1.06,-1.76,'#303846');lens.rotation.x=Math.PI/2;obstacle(f,-9.2,-1.6,.6,.6);inspect(f,cam,'camera','Kamera Studio',-9.2,-1.6,.6,.6,[['Kamera sudah siap. Kevin sedang menyiapkan konten berikutnya untuk media sosial.','The camera is ready. Kevin is preparing the next social media video.']],{approach:{x:-8.3,z:-1.5}});
    for(const [x,z,ring] of [[-10.9,-2.2,true],[-7,-2.6,false]]){P.cylinder(g,.025,1.55,x,.78,z,'#292833');P.cylinder(g,.15,.04,x,.02,z,'#292833');if(ring)P.torus(g,.23,.028,x,1.74,z,'#fffaf0');else{P.box(g,.50,.60,.04,x,1.76,z,'#292833');P.box(g,.43,.53,.02,x,1.76,z+.035,'#fffaf0');}obstacle(f,x,z,.35,.35);}
    const podcast=new THREE.Group();g.add(podcast);P.cylinder(podcast,1.35,.015,-11.3,.015,2.6,'#302c36',1.35,40);P.table(podcast,-11.3,2.6,{w:.7,d:.7,height:.50,round:true});P.sofa(podcast,-12.15,2.6,{w:.75,color:'#2fa39a',rotation:Math.PI/2});P.sofa(podcast,-10.45,2.6,{w:.75,color:'#e8765d',rotation:-Math.PI/2});P.box(podcast,.035,.3,.035,-11.3,.74,2.6,'#33333b');P.ball(podcast,.05,-11.3,.92,2.6,'#272832');obstacle(f,-11.3,2.6,2.65,1.9);inspect(f,podcast,'podcast','Sudut Podcast',-11.3,2.6,2.65,1.9,[['Episode minggu ini: “Kenapa bisnis Anda perlu website?” Siapkan kopi dan mikrofon.','This week’s episode: “Why does your business need a website?” Grab a coffee and a mic.']],{range:2,approach:{x:-10,z:1.45}});
    const meeting=new THREE.Group();g.add(meeting);P.table(meeting,-7.6,3.9,{w:3,d:1.1,height:.76});for(const x of [-8.7,-7.6,-6.5])for(const z of [2.95,4.85]){P.chair(meeting,x,z,z<4?'#2fa39a':'#bd8859',z<4?0:Math.PI);obstacle(f,x,z,.55,.55);}for(const x of [-8.6,-6.6])P.monitor(meeting,x,3.9,'browser','#3f8fd6',.83);obstacle(f,-7.6,3.9,3,1.1);inspect(f,meeting,'meeting','Meja Kolaborasi',-7.6,3.9,3,1.1,[['Brainstorming ide, jadwal konten, dan rencana campaign dimulai di meja ini.','Ideas, content schedules, and campaign plans start at this table.']],{approach:{x:-5.6,z:3.9}});
    const pods=new THREE.Group();g.add(pods);for(const x of [-4.05,-2.35]){P.box(pods,1.47,.11,1.35,x,.11,2.05,'#e7e1d9');P.box(pods,1.47,.11,1.35,x,1.09,2.05,'#eee9df');for(const dx of [-.72,.72])P.box(pods,.08,.9,1.35,x+dx,.61,2.05,'#e7e1d9');P.box(pods,1.40,.95,.06,x,.61,1.40,'#e7e1d9');P.box(pods,1.2,.10,1.05,x,.27,2.05,'#ab93bd');P.box(pods,.32,.09,.5,x-.38,.36,1.9,'#f4ecd9');obstacle(f,x,2.05,1.47,1.35);}inspect(f,pods,'pods','Sleeping Pods',-3.2,2.05,3.2,1.35,[['Power nap 20 menit dulu. Alarm dipasang, ide segar datang setelah istirahat.','Time for a 20-minute power nap. Set an alarm and recharge.']],{verb:['Istirahat di','Rest in'],approach:{x:-3.2,z:3.15}});
    for(const [x,z,color] of [[-3.9,4.4,'#8a6bbd'],[-2.5,4.95,'#2fa39a'],[5.2,4.8,'#b87342']]){P.ball(g,.42,x,.30,z,color,[1,.65,1]);P.ball(g,.29,x,.58,z-.09,color,[1,.62,1]);obstacle(f,x,z,.72,.72);}
    P.box(g,4.0,.012,3.8,1.85,.03,3.20,'#dfcdc3');const tv=new THREE.Group();g.add(tv);P.box(tv,1.65,.9,.08,1.9,1.21,1.75,'#282934');P.screen(tv,1.52,.77,1.9,1.21,1.805,'game');P.box(tv,1.7,.52,.46,1.9,.27,1.75,'#976946');for(const x of [1.34,2.42])P.box(tv,.18,.12,.19,x,.60,1.8,'#e8765d');obstacle(f,1.9,1.75,1.7,.5);inspect(f,tv,'game-tv','TV & Konsol Game',1.9,1.75,1.7,.5,[['Satu ronde setelah pekerjaan selesai? Jangan lupa simpan progres sebelum pulang.','One round after work? Remember to save your progress before heading home.']],{verb:['Main','Play'],approach:{x:1.9,z:2.5}});
    P.sofa(g,1.9,3.95,{w:2.7,color:'#d46743',rotation:Math.PI});obstacle(f,1.9,3.95,2.7,1);const arcade=P.arcade(g,3.55,2.4,'#8a6bbd');obstacle(f,3.55,2.4,.8,.7);inspect(f,arcade,'arcade-upstairs','Mesin Arcade',3.55,2.4,.8,.7,[['Mesin arcade untuk rehat tim. Game Lompat Anti-Bug dapat dimainkan di lobi.','A break-time arcade for the team. Play Anti-Bug Jump in the lobby.']],{approach:{x:2.65,z:2.4}});
    const pantry=new THREE.Group();g.add(pantry);P.box(pantry,.8,.77,2.2,12.4,.385,-4.6,'#e4ddd4');P.box(pantry,.86,.08,2.3,12.4,.82,-4.6,'#8b6148');for(let i=0;i<3;i++)P.cylinder(pantry,.045,.13,12.25,.93,-5.1+i*.4,['#3f8fd6','#e8765d','#f2c14e'][i]);P.box(pantry,.36,.34,.36,12.4,1.03,-4.05,'#e6e3df');obstacle(f,12.4,-4.6,.8,2.2);inspect(f,pantry,'pantry','Pantry',12.4,-4.6,.8,2.2,[['Kata Kevin, ide konten terbaik muncul sambil antre kopi di sini.','Kevin says the best content ideas come while waiting for coffee here.']],{approach:{x:11.3,z:-4.1}});
    const calendar=new THREE.Group();g.add(calendar);P.box(calendar,1.9,1.05,.05,7.4,1.23,3.3,'#34343e');P.screen(calendar,1.80,.95,7.4,1.23,3.34,'colors');P.text(calendar,'KALENDER KONTEN',7.4,1.66,3.355,{w:1.65,h:.13,color:'#6b4f3a',background:'#fffaf0'});for(const x of [6.65,8.15])P.box(calendar,.045,1.25,.045,x,.625,3.3,'#34343e');obstacle(f,7.4,3.3,1.9,.4);inspect(f,calendar,'calendar','Kalender Konten',7.4,3.3,1.9,.4,[['Konsisten adalah kunci. Kalender ini mengatur ide konten, waktu posting, dan campaign tim.','Consistency matters. This calendar organizes content ideas, posting dates, and campaigns.']],{range:1.6,approach:{x:7.4,z:4.2}});
    for(const [x,z] of [[-12.4,-5.35],[-6.3,-5.4],[3.9,-5.35],[12.2,5.1],[-12.3,5.1]])plant(f,x,z);lift(f);
  }

  // Rooftop: masjid di sebelah kiri dan teras terbuka di sebelah kanan.
  {
    const f=floors.get(3),g=f.group;P.floor(g,{type:'wood',color:'#ac7b50'});P.cityBuildings(g);
    for(const z of [-5.85,5.8]){P.box(g,26,.38,.11,0,.25,z,'#a49990');P.box(g,26,.05,.09,0,1.08,z,'#353440');for(let i=0;i<21;i++)P.box(g,.04,.86,.04,-12.7+i*1.27,.64,z,'#353440');}
    for(const x of [-12.85,12.85]){P.box(g,.11,.38,11.8,x,.25,0,'#a49990');P.box(g,.09,.05,11.8,x,1.08,0,'#353440');}
    f.mosque=addRooftopMosque(g);
    f.obstacles.push(...f.mosque.obstacles);
    const mosqueLabel=['Masjid','Mosque'];
    register(f,f.mosque.exterior,{id:'mosque',label:mosqueLabel,verb:['Masuk ke','Enter the'],kind:'walk',range:.8,...f.mosque.entrance,approach:f.mosque.approach});

    const sign=new THREE.Group(),signX=10.25,signZ=2.68;
    g.add(sign);
    P.box(sign,.10,.88,.11,signX,.45,signZ,'#4e514b');
    P.box(sign,2.00,.44,.12,signX,1.04,signZ,'#dfbd7c');
    P.text(sign,'← MASJID',signX,1.04,signZ+.065,{w:1.90,h:.36,color:'#fff1d1',background:'#1b5148',size:124});
    obstacle(f,signX,signZ,.24,.24);
    register(f,sign,{id:'mosque-sign',label:mosqueLabel,verb:['Menuju','Walk to the'],x:signX,z:signZ,w:1.65,d:.16,kind:'walk',range:.95,approach:f.mosque.approach});

    const fire=new THREE.Group(),fireX=3.5,fireZ=2.8;
    g.add(fire);
    P.cylinder(fire,2.12,.012,fireX,.02,fireZ,'#76a949',2.12,48);
    P.cylinder(fire,.82,.28,fireX,.14,fireZ,'#635749',.9,12);
    P.cylinder(fire,.67,.03,fireX,.30,fireZ,'#342a25',.67,12);
    for(let i=0;i<7;i++) P.box(fire,.22,.14,.85,fireX,.36,fireZ,'#754732').rotation.y=i*1.7;
    f.flames=[];
    for(let i=0;i<5;i++){
      const flame=P.cylinder(fire,0,.36+seed(i)*.3,fireX+(seed(i+2)-.5)*.4,.5,fireZ+(seed(i+8)-.5)*.3,i%2?'#ffd166':'#e8765d',.12,5);
      flame.userData.flame=i;
      f.flames.push(flame);
    }
    for(let i=0;i<4;i++){
      const a=Math.PI/4+i*Math.PI/2,x=fireX+Math.sin(a)*1.55,z=fireZ+Math.cos(a)*1.55;
      P.ball(g,.40,x,.27,z,['#8a6bbd','#e8765d','#2fa39a','#f2c14e'][i],[1,.7,1]);
      obstacle(f,x,z,.65,.65);
    }
    obstacle(f,fireX,fireZ,1.6,1.6);
    inspect(f,fire,'firepit','Api Unggun',fireX,fireZ,1.6,1.6,[['Hangatnya api unggun, cerita tim, dan pemandangan kota. Selamat datang di tempat favorit setelah kerja.','A warm fire, team stories, and city views. Welcome to our favorite after-work spot.']],{verb:['Santai di','Relax at'],approach:{x:fireX,z:4.65}});

    const bbq=new THREE.Group(),bbqX=5.35,bbqZ=-4.9;
    g.add(bbq);
    P.box(bbq,1.5,.20,.8,bbqX,.9,bbqZ,'#323440');
    for(const dx of [-.55,.55]) P.box(bbq,.05,.8,.05,bbqX+dx,.4,bbqZ,'#34333c');
    for(let i=0;i<8;i++) P.box(bbq,.025,.022,.67,bbqX-.60+i*.17,1.02,bbqZ,'#b3b7bb');
    obstacle(f,bbqX,bbqZ,1.5,.8);
    inspect(f,bbq,'bbq','BBQ Grill',bbqX,bbqZ,1.5,.8,[['Menu malam ini: sate, jagung bakar, dan diskusi ide proyek berikutnya.','Tonight’s menu: satay, grilled corn, and ideas for the next project.']],{approach:{x:bbqX,z:-3.75}});

    const tableX=2.40,tableZ=-3.15;
    P.table(g,tableX,tableZ,{w:1.1,d:1.1,height:.72,round:true});
    P.umbrella(g,tableX,tableZ,{color:'#cf6d54',height:2.3});
    obstacle(f,tableX,tableZ,1.1,1.1);
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,x=tableX+Math.sin(a)*.95,z=tableZ+Math.cos(a)*.95;
      P.chair(g,x,z,'#2fa39a',a+Math.PI);
      obstacle(f,x,z,.6,.6);
    }
    const lounge=P.sofa(g,7.25,-1.4,{w:3,color:'#e6d4aa'});
    P.table(g,7.25,.12,{color:'#c8965a'});
    obstacle(f,7.25,-1.4,3,1);
    obstacle(f,7.25,.12,1.5,.75);
    inspect(f,lounge,'roof-sofa','Sofa Rooftop',7.25,-1.4,3,1,[['Nikmati angin sore dan pemandangan kota. Pekerjaan bisa dilanjutkan setelah rehat.','Enjoy the breeze and the city. Work can wait for a short break.']],{verb:['Duduk di','Sit on'],approach:{x:5.15,z:-1.4}});
    const bar=new THREE.Group();g.add(bar);P.box(bar,3.2,.94,.75,9.6,.47,-4.1,'#88533e');P.box(bar,3.4,.10,.90,9.6,1.0,-4.1,'#d8c6a5');P.box(bar,3,1.04,.40,9.6,.53,-5.55,'#593c36');for(let i=0;i<8;i++)P.cylinder(bar,.045,.22,8.35+i*.35,1.12,-5.55,['#2fa39a','#8a6bbd','#e8765d'][i%3]);P.text(bar,'ROOFTOP BAR',9.6,2.1,-5.50,{w:3.1,h:.42,color:'#ff7eb6',background:null,glow:true});for(const x of [8.65,9.6,10.55]){P.cylinder(bar,.17,.08,x,.67,-3.35,'#e8765d');P.cylinder(bar,.033,.64,x,.34,-3.35,'#292c35');P.cylinder(bar,.16,.04,x,.02,-3.35,'#292c35');obstacle(f,x,-3.35,.4,.4);}obstacle(f,9.6,-4.1,3.2,.8);inspect(f,bar,'bar','Rooftop Bar',9.6,-4.1,3.2,.8,[['Mocktail atau es teh? Semua ide diterima, termasuk yang muncul saat melihat bintang.','Mocktail or iced tea? All ideas are welcome, especially under the stars.']],{approach:{x:7.55,z:-4.1}});

    const telescope=new THREE.Group(),scopeX=-.35,scopeZ=-5.12;
    g.add(telescope);
    P.cylinder(telescope,.035,1.08,scopeX,.54,scopeZ,'#34333d');
    P.cylinder(telescope,.10,.78,scopeX,1.25,scopeZ,'#cbb9a0').rotation.z=1.1;
    obstacle(f,scopeX,scopeZ,.5,.5);
    inspect(f,telescope,'telescope','Teleskop',scopeX,scopeZ,.5,.5,[['Langit malam ini cerah. Coba cari bulan di atas gedung-gedung kota.','The night sky is clear. Look for the moon above the city buildings.']],{approach:{x:scopeX,z:-4.15}});
    for(const z of [-4.95,-3.63]){P.box(g,1,.70,1,12.15,.35,z,'#b8bbc1');P.cylinder(g,.32,.03,12.15,.72,z,'#343642',.32,18);obstacle(f,12.15,z,1,1);}
    for(const [x,z] of [[-12.05,3.85],[-.65,5.1],[12.1,5.1]])plant(f,x,z,true);
    for(const x of [1.03,6.70,11.34]){
      for(const z of [-4.7,4.7]){P.cylinder(g,.035,2.75,x,1.38,z,'#34333b');obstacle(f,x,z,.08,.08);}
      const points=[];for(let i=0;i<=20;i++)points.push(new THREE.Vector3(x,2.6-.50*Math.sin(i/20*Math.PI),-4.7+i*.47));
      const curve=new THREE.CatmullRomCurve3(points);const cable=new THREE.Mesh(new THREE.TubeGeometry(curve,22,.011,4,false),P.mat('#34333b'));g.add(cable);
      for(let i=0;i<9;i++){const t=(i+.5)/9,v=curve.getPoint(t);P.ball(g,.053,v.x,v.y-.07,v.z,['#fff4b9','#ffb7d8','#bcf7eb'][i%3]);}
    }
    lift(f);
  }

  for(const person of CREW){
    const f=floors.get(person.floor),mesh=createAvatar({...DEFAULT_LOOK,...person});mesh.position.set(person.x,0,person.z);mesh.rotation.y=['ayu','ujang','dimas','kevin'].includes(person.id)?0:Math.PI;f.group.add(mesh);
    const action=register(f,mesh,{id:person.id,label:[person.name,person.name],verb:['Ngobrol dengan','Talk to'],x:person.x,z:person.z,w:.55,d:.4,kind:person.id==='ayu'?'reception':person.id==='dimas'?'whatsapp':'npc',range:1.55,approach:{x:person.x+.85,z:person.z+.60},person});
    f.people.push({person,mesh,action,baseRotation:mesh.rotation.y});
    if(person.id==='dimas'){const ring=P.torus(f.group,.54,.035,person.x,.02,person.z,'#74e897');ring.rotation.x=-Math.PI/2;f.labels.push({x:person.x,y:1.75,z:person.z,text:['Chat WhatsApp','Chat WhatsApp'],color:'#25bd69',action:person.id});}
  }
  return {floors,portfolio};
}
function seed(n){const v=Math.sin(n*72.33+11)*43254.12;return v-Math.floor(v);}
