// Ganti identitas, nomor WhatsApp, dan endpoint formulir sebelum dipublikasikan.
// Nomor kosong mencegah pesan terkirim ke bisnis pada website referensi.
export const CONFIG = {
  brand: 'aerha corp',
  tagline: 'BUILD · SHIP · GROW',
  whatsapp: '', // Format internasional tanpa +, misalnya 6281234567890.
  contactEndpoint: '', // Opsional: endpoint HTTPS milik Anda yang menerima POST JSON.
  storagePrefix: 'kantor-virtual',
  walkSpeed: 3.6,
};

export const FLOORS = [
  { id: 0, badge: 'LUAR', name: ['Halaman Depan','Front Yard'], color: '#25a863', hint: ['Pintu masuk & kopi keliling','Entrance & coffee cart'] },
  { id: 4, badge: 'LOBI', name: ['Lobi','Lobby'], color: '#e26d9c', hint: ['Resepsionis & ruang tunggu tamu','Reception & guest lounge'] },
  { id: 1, badge: 'LT 1', name: ['Lantai 1 · Kantor','Floor 1 · Office'], color: '#f2c14e', hint: ['Programmer, sales & CEO','Programmers, sales & CEO'] },
  { id: 2, badge: 'LT 2', name: ['Lantai 2 · Open Space','Floor 2 · Open Space'], color: '#3f8fd6', hint: ['Social media, studio & finance','Social media, studio & finance'] },
  { id: 3, badge: 'LT 3', name: ['Rooftop','Rooftop'], color: '#ff7eb6', hint: ['Masjid, teras terbuka & pemandangan kota','Mosque, open terrace & city views'] },
];
export const PALETTES = {
  skin: ['#f6d3b3','#eabd90','#d9a066','#b97a4a','#8a5a36'],
  hair: ['#1f1b1a','#4a2f1f','#8a5a36','#c98a4b','#e8765d','#8a6bbd'],
  hijab: ['#d9667a','#2fa39a','#3f8fd6','#8a6bbd','#f2c14e','#6b4f3a'],
  top: ['#2fa39a','#e8765d','#f2c14e','#3f8fd6','#8a6bbd','#ff7eb6','#3fb56b','#f7efe2'],
  pants: ['#2b2d3a','#3a3a48','#4a3b2c','#5a6d8a'],
};
export const DEFAULT_LOOK = {skin:'#eabd90',hair:'#8a6bbd',hairstyle:'short',outfit:'hoodie',top:'#e8765d',pants:'#2b2d3a',hijab:'#d9667a',glasses:false};
export const CREW = [
  {id:'raka',name:'Raka',role:'Frontend Developer',floor:1,x:-10,z:-2.15,top:'#2f5d9e',hair:'#1f1b1a',hairstyle:'spiky',glasses:true,skin:'#e8b58a'},
  {id:'dinda',name:'Dinda',role:'Backend Developer',floor:1,x:-5.8,z:-2.15,top:'#7a4fa3',hair:'#4a2f1f',hairstyle:'long',skin:'#f3cfa0'},
  {id:'bayu',name:'Bayu',role:'Sales',floor:1,x:-.2,z:-2.15,top:'#3fb56b',outfit:'polo',hair:'#1f1b1a',skin:'#c68642'},
  {id:'sinta',name:'Sinta',role:'Account Executive',floor:1,x:3.8,z:-2.15,top:'#f2c14e',outfit:'polo',hairstyle:'hijab',hijab:'#d9667a',skin:'#eabd90'},
  {id:'ayu',name:'Ayu',role:'Resepsionis',floor:4,x:0,z:-4.25,top:'#e26d9c',outfit:'polo',hair:'#4a2f1f',hairstyle:'long',skin:'#f3cfa0'},
  {id:'dimas',name:'Dimas',role:`CS ${CONFIG.brand}`,floor:4,x:6.6,z:3.4,top:'#25b86a',outfit:'polo',hair:'#1f1b1a',skin:'#d9a066'},
  {id:'ujang',name:'Mang Ujang',role:'Penjual Kopi',floor:0,x:1.85,z:-4.25,top:'#e8765d',outfit:'polo',hair:'#4a2f1f',skin:'#c98e62'},
  {id:'laras',name:'Laras',role:'Social Media Manager',floor:2,x:5.7,z:-2.15,top:'#f2c14e',outfit:'polo',hairstyle:'hijab',hijab:'#8a6bbd',skin:'#e8b58a'},
  {id:'maya',name:'Maya',role:'Graphic Designer',floor:2,x:9.1,z:-2.15,top:'#2fa39a',hair:'#4a2f1f',hairstyle:'long',glasses:true,skin:'#f3cfa0'},
  {id:'kevin',name:'Kevin',role:'Content Creator',floor:2,x:-9.2,z:-3.9,top:'#e8765d',hair:'#1f1b1a',hairstyle:'spiky',skin:'#c68642'},
  {id:'nadia',name:'Nadia',role:'Finance',floor:2,x:-.8,z:-2.15,top:'#3f8fd6',outfit:'polo',hair:'#4a2f1f',hairstyle:'long',glasses:true,skin:'#f1c7a0'},
];

export function validateLook(value) {
  const look = {...DEFAULT_LOOK};
  if (!value || typeof value !== 'object') return look;
  for (const key of Object.keys(PALETTES)) if (PALETTES[key].includes(value[key])) look[key]=value[key];
  if (['short','spiky','long','hijab'].includes(value.hairstyle)) look.hairstyle=value.hairstyle;
  if (['hoodie','polo'].includes(value.outfit)) look.outfit=value.outfit;
  look.glasses=value.glasses===true;
  return look;
}
