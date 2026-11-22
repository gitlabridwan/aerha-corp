import {CONFIG,FLOORS,PALETTES,DEFAULT_LOOK} from './config.js';
import {mountArcade} from './arcade.js';

const $=s=>document.querySelector(s);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLink=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch{return '#';}};

export function createUI(controller,portfolio){
  let language=controller.language,cleanup=null,previousFocus=null,modalType='',menuActions=[],selectedMenu=0,dialogue=null,toastTimer=null,projectIndex=0,imageIndex=0;
  const t=(id,en)=>language==='id'?id:en;
  const overlay=$('#overlay');
  const brand=escape(CONFIG.brand);
  function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3600);}
  function close(){
    if(cleanup)cleanup();cleanup=null;
    if(modalType==='avatar')controller.endCustomization();
    overlay.hidden=true;overlay.className='';overlay.replaceChildren();modalType='';menuActions=[];
    controller.setBlocked(false);if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});previousFocus=null;
  }
  function open(type,html,className=''){
    closeDialogue();close();previousFocus=document.activeElement;modalType=type;overlay.className=className;overlay.innerHTML=html;overlay.hidden=false;controller.setBlocked(true);
    overlay.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
    overlay.onclick=e=>{if(e.target===overlay&&type!=='avatar')close();};
    requestAnimationFrame(()=>overlay.querySelector('button,input,a')?.focus({preventScroll:true}));
  }
  function shell(title,body,css='',footer=''){
    return `<section class="panel modal ${css}" role="dialog" aria-modal="true" aria-label="${escape(title)}"><header class="modal-header"><h2>${escape(title)}</h2><button class="btn small" data-close>× ${t('Tutup','Close')}</button></header><div class="modal-body">${body}</div>${footer?`<footer class="modal-footer">${footer}</footer>`:''}</section>`;
  }
  function menu(title,items){
    menuActions=items;
    open('menu',shell(title,`<div class="menu-list">${items.map((item,i)=>`<button class="menu-item" data-menu="${i}"><span class="number">${i+1}</span><span><strong>${escape(item.label)}</strong>${item.hint?`<small>${escape(item.hint)}</small>`:''}</span><span class="chevron">›</span></button>`).join('')}</div>`));
    menuActions=items;selectedMenu=0;overlay.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>{const fn=items[Number(b.dataset.menu)].action;close();fn();});
  }
  function closeDialogue(){dialogue=null;$('#dialogue').hidden=true;}
  function say(name,pages,color='#c99a2e',after=null){
    close();dialogue={name,pages:pages.map(p=>Array.isArray(p)?t(...p):p),index:0,start:performance.now(),shown:0,color,after};
    $('#dialogue-name').textContent=name;$('#dialogue-name').style.background=color;$('#dialogue').hidden=false;$('#dialogue-text').textContent='';controller.stopWalking();
  }
  function advance(){
    if(!dialogue)return;const text=dialogue.pages[dialogue.index];
    if(dialogue.shown<text.length){dialogue.start=0;dialogue.shown=text.length;$('#dialogue-text').textContent=text;return;}
    dialogue.index++;if(dialogue.index>=dialogue.pages.length){const after=dialogue.after;closeDialogue();after?.();}else{dialogue.start=performance.now();dialogue.shown=0;}
  }
  $('#dialogue').onclick=advance;
  function customize(){
    let look={...controller.look};
    open('avatar','', 'avatar-backdrop');controller.beginCustomization();
    const labels={skin:t('Warna kulit','Skin tone'),hair:t('Warna rambut','Hair color'),hijab:t('Warna hijab','Hijab color'),top:t('Warna baju','Top color'),pants:t('Warna celana','Pants color')};
    function swatch(key){return `<div class="field-group"><label>${labels[key]}</label><div class="swatches">${PALETTES[key].map(c=>`<button class="swatch ${look[key]===c?'selected':''}" style="background:${c}" data-color="${key}" data-value="${c}" aria-label="${labels[key]} ${c}" aria-pressed="${look[key]===c}"></button>`).join('')}</div></div>`;}
    function segment(key,choices){return `<div class="segments">${choices.map(([id,name])=>`<button class="segment ${look[key]===id?'selected':''}" data-choice="${key}" data-value="${id}" aria-pressed="${look[key]===id}">${name}</button>`).join('')}</div>`;}
    function draw(){
      overlay.innerHTML=`<section class="panel avatar-panel" role="dialog" aria-modal="true" aria-label="${t('Buat karaktermu','Create your character')}"><header class="modal-header"><h2>♧ ${t('Buat karaktermu','Create your character')}</h2><p>${t(`Selamat datang di kantor ${brand}! Pilih tampilanmu dulu, ya.`,`Welcome to the ${brand} office! Choose your look before exploring.`)}</p></header><div class="modal-body">${swatch('skin')}<div class="field-group"><label>${t('Rambut','Hair')}</label>${segment('hairstyle',[['short',t('Pendek','Short')],['spiky',t('Jabrik','Spiky')],['long',t('Panjang','Long')],['hijab','Hijab']])}</div>${swatch(look.hairstyle==='hijab'?'hijab':'hair')}<div class="field-group"><label>${t('Baju','Outfit')}</label>${segment('outfit',[['hoodie','Hoodie'],['polo','Polo']])}</div>${swatch('top')}${swatch('pants')}<label class="check-label"><input type="checkbox" id="glasses" ${look.glasses?'checked':''}>${t('Pakai kacamata','Wear glasses')}</label></div><footer class="modal-footer"><button class="btn" id="random-look">⤨ ${t('Acak','Random')}</button><button class="btn primary" id="start-visit">✓ ${t('Mulai','Start')}</button></footer></section>`;
      overlay.querySelectorAll('[data-color],[data-choice]').forEach(b=>b.onclick=()=>{look[b.dataset.color??b.dataset.choice]=b.dataset.value;controller.updateLook(look);draw();});
      $('#glasses').onchange=e=>{look.glasses=e.target.checked;controller.updateLook(look);};
      $('#random-look').onclick=()=>{for(const k of Object.keys(PALETTES))look[k]=PALETTES[k][Math.floor(Math.random()*PALETTES[k].length)];look.hairstyle=['short','spiky','long','hijab'][Math.floor(Math.random()*4)];look.outfit=Math.random()>.5?'hoodie':'polo';look.glasses=Math.random()>.7;controller.updateLook(look);draw();};
      $('#start-visit').onclick=()=>{controller.saveLook();close();toast(t('Selamat datang! Klik pintu untuk masuk ke lobi.','Welcome! Click the door to enter the lobby.'));};
    }
    draw();
  }
  function reception(){
    menu(t('Ayu · Resepsionis','Ayu · Reception'),[
      {label:t('Ngobrol','Have a chat'),hint:t('Kenalan dengan kantor dan tim kami','Meet the office and the team'),action:()=>say('Ayu · '+t('Resepsionis','Reception'),[[`Halo, Kak! Selamat datang di kantor ${CONFIG.brand}. Saya Ayu, siap membantu.`,`Hi! Welcome to the ${CONFIG.brand} office. I’m Ayu, happy to help.`],['Silakan lihat portofolio di dinding kiri. Tim programmer dan sales ada di lantai 1, tim social media di lantai 2.','Browse the portfolio on the left wall. The development and sales teams are on floor 1; social media is on floor 2.'],['Naik lift ke rooftop untuk ke masjid atau duduk santai di teras. Selamat berkeliling!','Take the elevator to the rooftop for the mosque and open terrace. Enjoy your visit!']],'#e26d9c')},
      {label:t('Layanan kami','Our services'),action:services},
      {label:t('Lihat portofolio','View portfolio'),action:()=>showPortfolio(0)},
      {label:t('Chat via WhatsApp','Chat on WhatsApp'),action:whatsapp},
      {label:t('Tinggalkan kontak','Leave your contact'),action:contact},
      {label:t('Tidak jadi','Maybe later'),action:()=>{}},
    ]);
  }
  function services(){
    const cards=[['Company Profile',t('Profil bisnis yang profesional, cepat, dan nyaman di smartphone.','A professional, fast business website that works on every screen.')],['Toko Online',t('Katalog produk, keranjang belanja, dan alur pemesanan sesuai bisnis.','Product catalogs, shopping carts, and ordering flows for your business.')],['Landing Page',t('Halaman promosi yang fokus pada penawaran dan konversi pelanggan.','Focused campaign pages that turn visitors into customers.')],['Website Custom',t('Booking, dashboard, dan aplikasi web sesuai kebutuhan tim Anda.','Booking, dashboards, and web apps built for your team.')]];
    open('services',shell(t('Layanan kami','Our services'),`<p>${t('Website yang membantu bisnis Anda tumbuh.','Websites that help your business grow.')}</p><div class="service-grid">${cards.map(([a,b])=>`<div class="service-card"><strong>${a}</strong><p>${b}</p></div>`).join('')}</div>`, '',`<button class="btn green" id="service-wa">${t('Konsultasi gratis','Free consultation')}</button>`));$('#service-wa').onclick=whatsapp;
  }
  function elevator(currentFloor){
    menu(t('Mau ke lantai berapa?','Which floor would you like?'),FLOORS.filter(f=>f.id!==0).map(f=>({label:t(...f.name)+(f.id===currentFloor?t(' · di sini',' · here'):''),hint:t(...f.hint),action:()=>{if(f.id!==currentFloor)controller.travelElevator(f.id);}})));
  }
  function sendWhatsApp(message){
    const number=CONFIG.whatsapp.replace(/\D/g,'');
    if(!/^[1-9]\d{7,14}$/.test(number)){toast(t('Nomor WhatsApp penerima belum diatur. Pesan belum dikirim.','The recipient’s WhatsApp number is not configured. No message was sent.'));return;}
    window.open('https://wa.me/'+number+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
  }
  function whatsapp(){
    $('#wa-teaser').hidden=true;
    const quick=[t('Saya mau buat website untuk bisnis saya.','I’d like a website for my business.'),t('Boleh tanya-tanya harga pembuatan website?','Could I ask about website pricing?'),t('Saya mau konsultasi dulu.','I’d like a consultation first.')];
    open('whatsapp',`<section class="panel wa-chat" role="dialog" aria-modal="true" aria-label="Chat WhatsApp"><header class="modal-header"><div><h2>◉ Dimas · CS ${brand}</h2><small>● ${t('Chat lewat WhatsApp','Chat on WhatsApp')}</small></div><button data-close aria-label="${t('Tutup','Close')}">×</button></header><div class="modal-body"><div class="bubble">${t(`Halo Kak! Saya Dimas, customer service ${brand}.`,`Hi! I’m Dimas, customer service at ${brand}.`)}<br><br>${t('Mau dibuatkan website untuk bisnis? Pilih pesan di bawah atau tulis sendiri. Nanti lanjut di WhatsApp, ya.','Need a website for your business? Pick a message or write your own, then continue on WhatsApp.')}</div><div class="quick-messages">${quick.map((q,i)=>`<button data-quick="${i}">${q}</button>`).join('')}</div></div><form class="wa-compose"><input name="message" maxlength="1000" placeholder="${t('Tulis pesan…','Write a message…')}" aria-label="${t('Pesan WhatsApp','WhatsApp message')}" required><button title="${t('Lanjut ke WhatsApp','Continue to WhatsApp')}">➤</button></form></section>`);
    overlay.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>sendWhatsApp(quick[Number(b.dataset.quick)]));overlay.querySelector('form').onsubmit=e=>{e.preventDefault();sendWhatsApp(e.target.elements.message.value.trim());};
  }
  function contact(){
    const configured=!!CONFIG.contactEndpoint;
    open('contact',shell(t('Tinggalkan kontak','Leave your contact'),`<p>${t('Ceritakan kebutuhan website Anda.','Tell us about your website needs.')}</p>${!configured?`<p class="note">${t('Form ini belum terhubung ke penerima. Anda dapat menyimpan pesan di perangkat ini untuk dikirim nanti.','This form is not connected to a recipient yet. You can save your message on this device to send later.')}</p>`:''}<form id="contact-form" class="form-grid"><label>${t('Nama','Name')}<input class="text-field" name="name" required maxlength="60" autocomplete="name"></label><label>WhatsApp<input class="text-field" name="whatsapp" type="tel" inputmode="tel" required maxlength="25" autocomplete="tel" placeholder="08…"></label><label>${t('Kebutuhan website','Website needs')}<textarea name="needs" required maxlength="500" placeholder="${t('Jenis bisnis, fitur, atau pertanyaan Anda…','Business type, features, or your questions…')}"></textarea></label><label class="trap-field" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><button class="btn primary" type="submit">${configured?t('Kirim kontak','Send contact'):t('Simpan pesan di perangkat','Save message on this device')}</button><p class="form-status" role="status"></p></form>`));
    $('#contact-form').onsubmit=async e=>{
      e.preventDefault();const form=e.target,status=form.querySelector('.form-status'),button=form.querySelector('button'),data=Object.fromEntries(new FormData(form));
      if(data.website)return;
      for(const k of ['name','whatsapp','needs'])data[k]=data[k].trim();
      if(data.name.length<2||!/^\+?[\d\s()-]{8,25}$/.test(data.whatsapp)||!data.needs){status.className='form-status error';status.textContent=t('Isi nama, nomor WhatsApp, dan kebutuhan dengan benar.','Enter a valid name, WhatsApp number, and message.');return;}
      button.disabled=true;status.className='form-status';status.textContent=t('Menyimpan…','Saving…');
      try{
        if(configured){
          const response=await fetch(CONFIG.contactEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,source:'kantor-virtual'}),signal:AbortSignal.timeout(15000)});
          if(!response.ok)throw new Error('send failed');status.textContent=t('Kontak berhasil dikirim. Terima kasih!','Your contact was sent. Thank you!');
        }else{
          localStorage.setItem(CONFIG.storagePrefix+'-contact-draft',JSON.stringify({...data,savedAt:new Date().toISOString()}));status.textContent=t('Pesan tersimpan di perangkat ini. Belum dikirim ke penerima.','Saved on this device. It has not been sent to a recipient.');
          const copy=document.createElement('button');copy.type='button';copy.className='btn';copy.textContent=t('Salin pesan','Copy message');copy.onclick=async()=>{try{await navigator.clipboard.writeText(`${data.name}\nWhatsApp: ${data.whatsapp}\n${data.needs}`);toast(t('Pesan disalin.','Message copied.'));}catch{toast(t('Salin isi formulir secara manual.','Please copy the form content manually.'));}};form.append(copy);
        }
      }catch{status.className='form-status error';status.textContent=t('Pesan belum berhasil disimpan atau dikirim. Silakan coba lagi.','The message could not be saved or sent. Please try again.');button.disabled=false;}
    };
  }
  function showPortfolio(index=0){
    projectIndex=Math.max(0,Math.min(portfolio.length-1,index));imageIndex=0;
    const heading=t(`Portofolio ${brand}`,`${brand} portfolio`);
    open('portfolio',`<section class="panel modal portfolio" role="dialog" aria-modal="true" aria-label="${heading}"><header class="modal-header"><h2>▣ ${heading}</h2><button class="btn small" data-close>× ${t('Tutup','Close')}</button></header><div class="portfolio-main"><div class="portfolio-visual"><div class="portfolio-stage"></div><div class="gallery-thumbs"></div><div class="project-thumbs"></div></div><div class="portfolio-details"></div></div></section>`);
    const stage=overlay.querySelector('.portfolio-stage'),thumbs=overlay.querySelector('.project-thumbs'),gallery=overlay.querySelector('.gallery-thumbs'),details=overlay.querySelector('.portfolio-details');
    function draw(){
      const p=portfolio[projectIndex],images=p.gallery?.length?p.gallery:[p.image];imageIndex=(imageIndex+images.length)%images.length;
      stage.innerHTML=`<img src="${escape(images[imageIndex])}" alt="${escape(p.title)} · ${imageIndex+1}" draggable="false"><button class="gallery-arrow prev" aria-label="${t('Gambar sebelumnya','Previous image')}">‹</button><button class="gallery-arrow next" aria-label="${t('Gambar berikutnya','Next image')}">›</button><span class="image-count">${imageIndex+1} / ${images.length}</span>${p.liveUrl?`<a class="btn small blue stage-demo" href="${safeLink(p.liveUrl)}" target="_blank" rel="noopener noreferrer">↗ ${t('Lihat demo','View demo')}</a>`:''}`;
      stage.querySelector('.prev').onclick=()=>{imageIndex--;draw();};stage.querySelector('.next').onclick=()=>{imageIndex++;draw();};
      gallery.innerHTML=images.map((src,i)=>`<button class="${i===imageIndex?'active':''}" data-image="${i}" aria-label="${t('Gambar','Image')} ${i+1}" aria-pressed="${i===imageIndex}"><img src="${escape(src)}" alt=""></button>`).join('');gallery.querySelectorAll('button').forEach(b=>b.onclick=()=>{imageIndex=Number(b.dataset.image);draw();});
      thumbs.innerHTML=portfolio.map((q,i)=>`<button class="project-thumb ${i===projectIndex?'active':''}" data-project="${i}" aria-label="${escape(q.title)}" aria-pressed="${i===projectIndex}"><img src="${escape(q.image)}" alt=""></button>`).join('');thumbs.querySelectorAll('button').forEach(b=>b.onclick=()=>{projectIndex=Number(b.dataset.project);imageIndex=0;draw();});
      details.innerHTML=`<div class="chips"><span class="chip">${escape(p.category)}</span><span class="chip">${t('Proyek klien','Client project')}</span></div><h3>${escape(p.title)}</h3><div class="project-actions">${p.liveUrl?`<a class="btn blue" href="${safeLink(p.liveUrl)}" target="_blank" rel="noopener noreferrer">↗ ${t('Lihat demo website','View website demo')}</a>`:''}${p.detailUrl?`<a class="btn" href="${safeLink(p.detailUrl)}" target="_blank" rel="noopener noreferrer">↗ ${t('Detail proyek','Project details')}</a>`:''}</div><p>${escape(p.blurb)}</p><div class="project-meta"><div><small>${t('Kategori','Category')}</small><strong>${escape(p.category)}</strong></div><div><small>${t('Tahun','Year')}</small><strong>${escape(p.year)}</strong></div></div><div><p>${t('Teknologi','Technology')}</p><div class="chips">${p.features.map(f=>`<span class="chip">${escape(f)}</span>`).join('')}</div></div><div class="portfolio-cta"><strong>${t('Mau punya website seperti ini?','Would you like a website like this?')}</strong><p>${t('Konsultasi & penawaran gratis, disesuaikan dengan bisnis Anda.','Free consultation and a proposal tailored to your business.')}</p><button class="btn green" id="portfolio-wa">${t('Konsultasi website seperti ini','Discuss a website like this')}</button><button class="btn" id="portfolio-contact">${t('Tinggalkan kontak, kami yang hubungi','Leave your contact')}</button></div>`;
      $('#portfolio-wa').onclick=()=>sendWhatsApp(t('Halo, saya tertarik membuat website seperti ','Hi, I’m interested in a website like ')+p.title);$('#portfolio-contact').onclick=contact;
    }
    let pointerX=null;stage.addEventListener('pointerdown',e=>{if(!e.target.closest('button,a'))pointerX=e.clientX;});stage.addEventListener('pointerup',e=>{if(pointerX!==null&&Math.abs(e.clientX-pointerX)>50){imageIndex+=e.clientX<pointerX?1:-1;draw();}pointerX=null;});
    const key=e=>{if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();imageIndex+=e.code==='ArrowRight'?1:-1;draw();}};document.addEventListener('keydown',key);cleanup=()=>document.removeEventListener('keydown',key);draw();
  }
  function arcade(){open('arcade',shell(t('♧ Lompat Anti-Bug','♧ Anti-Bug Jump'),'<div id="arcade-mount"></div>','arcade'));cleanup=mountArcade($('#arcade-mount'),t,controller.look,toast);}
  function npc(person){
    const greetings={raka:[['Halo, Kak! Saya Raka. Saya yang bikin tampilan website jadi enak dilihat dan dipakai.','Hi! I’m Raka. I make websites look good and feel easy to use.'],['Kalau ada tombol yang kurang rapi, bilang ya. Pixel-perfect itu perjuangan!','Tell me if a button looks off. Pixel-perfect takes practice!']],dinda:[['Hai, saya Dinda. Di balik layar, saya mengurus data, server, dan fitur website.','Hi, I’m Dinda. I handle data, servers, and behind-the-scenes website features.'],['Sistem yang bagus harus cepat, rapi, dan bisa diandalkan. Kopi juga membantu.','Good systems are fast, organized, and reliable. Coffee helps too.']],bayu:[['Halo, Kak! Bayu di sini. Lagi mencari website yang cocok untuk bisnis?','Hi! Bayu here. Looking for the right website for your business?'],['Kita bisa ngobrol dulu tentang kebutuhan Anda. Konsultasi awal gratis.','Let’s talk about what you need. The first consultation is free.']],sinta:[['Halo, saya Sinta. Saya membantu memastikan komunikasi proyek berjalan lancar.','Hi, I’m Sinta. I help keep project communication running smoothly.'],['Mulai dari brief sampai peluncuran, setiap detail kami perhatikan.','From the brief to launch, we pay attention to every detail.']],ujang:[['Kopi, Kak? Kopi susu gula aren paling laris di sini.','Coffee? The palm sugar latte is the favorite here.'],['Tim programmer sudah langganan. Semangat kerja, jangan lupa istirahat!','The programmers are regulars. Keep going, and remember to take a break!']],laras:[[`Halo, Kak! Saya Laras, pegang media sosial ${CONFIG.brand}.`,`Hi! I’m Laras, the social media manager at ${CONFIG.brand}.`],['Konten yang konsisten dan relevan membuat brand lebih dekat dengan pelanggan.','Consistent, relevant content brings a brand closer to its customers.']],maya:[['Halo, saya Maya. Saya mengubah ide jadi desain yang punya cerita.','Hi, I’m Maya. I turn ideas into designs with a story.'],['Warna, tipografi, dan visual harus cocok dengan karakter brand.','Colors, type, and visuals should reflect the brand’s personality.']],kevin:[['Lampu sudah menyala, kamera siap! Saya Kevin, content creator di sini.','Lights on, camera ready! I’m Kevin, the content creator here.'],['Kadang ide video muncul setelah tiga kali take dan satu gelas kopi.','Sometimes a video idea takes three takes and a cup of coffee.']],nadia:[['Halo, saya Nadia dari finance. Angka rapi, proyek lancar.','Hi, I’m Nadia from finance. Organized numbers keep projects running.'],['Setiap pengeluaran dan pemasukan dicatat agar tim bisa fokus berkarya.','We track income and spending so the team can focus on their work.']]};
    say(`${person.name} · ${person.role}`,greetings[person.id]??[[`Halo! Saya ${person.name}.`,`Hi! I’m ${person.name}.`]],person.top);
  }
  function setLanguage(lang){language=lang;controller.language=lang;try{localStorage.setItem(CONFIG.storagePrefix+'-lang',lang);}catch{};document.documentElement.lang=lang;document.querySelectorAll('[data-language]').forEach(b=>{b.classList.toggle('active',b.dataset.language===lang);b.setAttribute('aria-pressed',b.dataset.language===lang);});$('#customize span').textContent=t('Ubah karakter','Customize');$('#help').textContent=t('WASD / ↑↓←→ atau klik lantai untuk berjalan · E untuk mengobrol / berinteraksi','WASD / ↑↓←→ or click the floor to walk · E to chat / interact');$('#dialogue-next-label').textContent=t('Lanjut','Continue');if(modalType==='avatar')customize();else if(modalType)close();closeDialogue();controller.refreshHUD();}
  $('#customize').onclick=customize;$('#whatsapp').onclick=whatsapp;$('#teaser-open').onclick=whatsapp;$('.teaser-close').onclick=()=>$('#wa-teaser').hidden=true;$('#fallback-portfolio').onclick=()=>showPortfolio(0);$('#fallback-contact').onclick=contact;$('#retry').onclick=()=>location.reload();document.querySelectorAll('[data-language]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.language));
  document.addEventListener('keydown',e=>{
    if(e.code==='Escape'){if(dialogue)closeDialogue();else if(modalType)close();return;}
    if(modalType==='menu'){
      if(/^[1-9]$/.test(e.key)){overlay.querySelector(`[data-menu="${Number(e.key)-1}"]`)?.click();e.preventDefault();}
      else if(['ArrowDown','ArrowUp'].includes(e.code)){selectedMenu=(selectedMenu+(e.code==='ArrowDown'?1:-1)+menuActions.length)%menuActions.length;overlay.querySelector(`[data-menu="${selectedMenu}"]`)?.focus();e.preventDefault();}
      else if(e.code==='KeyE'||(['Enter','Space'].includes(e.code)&&e.target===document.body)){const index=document.activeElement?.dataset.menu??selectedMenu;overlay.querySelector(`[data-menu="${index}"]`)?.click();e.preventDefault();}
    }
    if(modalType&&e.code==='Tab'){
      const focusable=[...overlay.querySelectorAll('button:not(:disabled),a[href],input:not([tabindex="-1"]),textarea,select')].filter(n=>n.getClientRects().length);
      if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(!overlay.contains(document.activeElement)){first.focus();e.preventDefault();}else if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}
    }
  });
  setLanguage(language);
  return {t,toast,close,customize,reception,services,elevator,whatsapp,contact,showPortfolio,arcade,npc,say,advance,closeDialogue,
    get blocked(){return !!modalType;},get dialogue(){return !!dialogue;},get modalType(){return modalType;},
    update(ms){if(dialogue){const text=dialogue.pages[dialogue.index];dialogue.shown=Math.min(text.length,Math.floor((ms-dialogue.start)/26));$('#dialogue-text').textContent=text.slice(0,dialogue.shown);}}
  };
}
