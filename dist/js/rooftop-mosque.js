import * as THREE from '../assets/vendor/three.module.js';
import * as P from './props.js';

const cream = '#efe1c5';
const trim = '#d5b576';
const teal = '#247c69';
const darkTeal = '#1b5148';
const gold = '#e6bc60';

function solid(group, geometry, color, x, y, z) {
  const mesh = new THREE.Mesh(geometry, P.mat(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function extrude(group, shape, depth, color, x, y, z) {
  return solid(group, new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: false}), color, x, y, z);
}

function arch(width, height) {
  const shape = new THREE.Shape();
  const radius = width / 2;
  shape.moveTo(-radius, 0);
  shape.lineTo(radius, 0);
  shape.lineTo(radius, height - radius);
  shape.absarc(0, height - radius, radius, 0, Math.PI, false);
  shape.closePath();
  return shape;
}

function windowPanel(group, x, y, z) {
  extrude(group, arch(1.04, 1.53), .05, trim, x, y, z);
  extrude(group, arch(.84, 1.33), .03, darkTeal, x, y + .10, z + .05);
  extrude(group, arch(.68, 1.14), .02, '#79ad9c', x, y + .19, z + .08);
  P.box(group, .050, 1.13, .03, x, y + .76, z + .106, darkTeal);
  P.box(group, .68, .05, .03, x, y + .92, z + .106, darkTeal);
  P.box(group, 1.13, .09, .18, x, y, z + .03, cream);
}

function dome(group, x, y, z, scale = 1) {
  const profile = [[0, 0], [1.56, 0], [1.73, .17], [1.78, .42], [1.67, .77],
    [1.40, 1.10], [1.01, 1.38], [.57, 1.61], [.20, 1.77], [0, 1.84]];
  const geometry = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), 40);
  solid(group, geometry, teal, x, y, z).scale.setScalar(scale);
  P.cylinder(group, 1.64 * scale, .09 * scale, x, y + .02 * scale, z, gold, 1.64 * scale, 40);
  P.cylinder(group, .035 * scale, .36 * scale, x, y + 1.93 * scale, z, gold);
  P.ball(group, .092 * scale, x, y + 1.86 * scale, z, gold);

  const crescent = new THREE.Shape();
  crescent.moveTo(.13, .22);
  crescent.bezierCurveTo(-.17, .31, -.34, .02, -.19, -.16);
  crescent.bezierCurveTo(-.09, -.29, .11, -.27, .22, -.10);
  crescent.bezierCurveTo(-.02, -.19, -.20, .07, .13, .22);
  crescent.closePath();
  extrude(group, crescent, .045, gold, x, y + 2.26 * scale, z).scale.setScalar(scale);
}

function addPrayerCarpet(group, x, z) {
  const texture = P.texture('prayer-carpet', (ctx, width, height) => {
    ctx.fillStyle = '#1c5349';
    ctx.fillRect(0, 0, width, height);
    const margin = 18;
    const rowHeight = (height - 2 * margin) / 3;
    const placeWidth = (width - 2 * margin) / 7;
    for (let row = 0; row < 3; row++) {
      const top = margin + row * rowHeight;
      ctx.fillStyle = row % 2 ? '#28675b' : '#31776a';
      ctx.fillRect(margin, top, width - 2 * margin, rowHeight);
      for (let place = 0; place < 7; place++) {
        const center = margin + (place + .5) * placeWidth;
        const radius = placeWidth * .36;
        const spring = top + rowHeight * .44;
        ctx.beginPath();
        ctx.moveTo(center - radius, top + rowHeight - 12);
        ctx.arc(center, spring, radius, Math.PI, 0);
        ctx.lineTo(center + radius, top + rowHeight - 12);
        ctx.closePath();
        ctx.strokeStyle = '#a9b28b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.strokeStyle = '#d1b77d';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, width - 16, height - 16);
  });
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(8.60, 4.50),
    new THREE.MeshStandardMaterial({map: texture, roughness: 1}),
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(x, .05, z);
  carpet.receiveShadow = true;
  group.add(carpet);
}

export function addRooftopMosque(group) {
  const left = -11.25, right = -1.45, back = -5.25, front = .85;
  const width = right - left, depth = front - back;
  const x = (left + right) / 2, z = (back + front) / 2;
  const wall = .22, height = 2.82, opening = 1.92, spring = 1.22;
  const wing = (width - opening) / 2;
  const wingCenters = [x - (opening + wing) / 2, x + (opening + wing) / 2];
  const roof = new THREE.Group();
  group.add(roof);

  // The courtyard and accessible threshold sit just above the shared deck.
  P.box(group, 12.08, .03, 8.18, -6.35, .022, -1.40, '#d7cbb3');
  P.box(group, 2.58, .019, 1.78, x, .04, 1.83, '#e9dcc2');
  P.box(group, 12.08, .014, .045, -6.35, .042, 2.68, trim);
  for (const side of [-1, 1]) {
    const planterX = x + side * 3.78;
    P.box(group, 1.88, .28, .68, planterX, .18, 1.88, '#b39773');
    P.box(group, 1.72, .035, .54, planterX, .335, 1.88, '#665640');
    for (const dx of [-.56, 0, .56]) P.ball(group, .23, planterX + dx, .45, 1.88, '#588f6e', [1.2, .92, 1]);
  }

  P.box(group, width, height, wall, x, height / 2, back, cream);
  P.box(group, wall, height, depth, left, height / 2, z, cream);
  P.box(group, .27, .16, depth, right, .115, z, trim);
  for (const wingX of wingCenters) P.box(group, wing, .16, .31, wingX, .115, front, trim);
  P.box(roof, wall, height, depth, right, height / 2, z, cream);
  const sideWindows = new THREE.Group();
  sideWindows.position.x = right + wall / 2;
  sideWindows.rotation.y = Math.PI / 2;
  roof.add(sideWindows);
  for (const wallZ of [-3.85, -2.15, -.45]) windowPanel(sideWindows, -wallZ, .67, .005);

  const radius = opening / 2;
  const facade = new THREE.Shape();
  facade.moveTo(-width / 2, 0);
  facade.lineTo(-radius, 0);
  facade.lineTo(-radius, spring);
  facade.absarc(0, spring, radius, Math.PI, 0, true);
  facade.lineTo(radius, 0);
  facade.lineTo(width / 2, 0);
  facade.lineTo(width / 2, height);
  facade.lineTo(-width / 2, height);
  facade.closePath();
  extrude(roof, facade, wall, cream, x, 0, front - wall / 2);

  const surround = new THREE.Shape();
  const outerRadius = radius + .15;
  surround.moveTo(-outerRadius, 0);
  surround.lineTo(-outerRadius, spring);
  surround.absarc(0, spring, outerRadius, Math.PI, 0, true);
  surround.lineTo(outerRadius, 0);
  surround.lineTo(radius, 0);
  surround.lineTo(radius, spring);
  surround.absarc(0, spring, radius, 0, Math.PI, false);
  surround.lineTo(-radius, 0);
  surround.closePath();
  extrude(roof, surround, .085, trim, x, 0, front + wall / 2);
  for (const dx of [-2.85, 2.85]) windowPanel(roof, x + dx, .60, front + wall / 2);
  for (const dx of [-4.57, 4.57]) P.box(roof, .30, height, .17, x + dx, height / 2, front + .15, '#e8cda3');
  P.box(roof, 2.53, .36, .07, x, 2.54, front + .15, darkTeal);
  P.text(roof, 'MASJID', x, 2.54, front + .19, {w: 2.53, h: .36, size: 126, color: '#fff1d1', background: null});

  P.box(roof, width + .36, .15, depth + .35, x, 2.86, z, darkTeal);
  P.box(roof, width + .22, .07, depth + .22, x, 2.96, z, trim);
  P.box(roof, width + .08, .14, depth + .08, x, 3.03, z, teal);
  P.cylinder(roof, 1.67, .23, x, 3.20, z, cream, 1.81, 24);
  dome(roof, x, 3.31, z);

  const tower = {x: -11.93, z: -4.25};
  P.cylinder(group, .54, .22, tower.x, .15, tower.z, trim, .58, 12);
  P.cylinder(group, .39, 2.96, tower.x, 1.70, tower.z, cream, .47, 12);
  P.cylinder(group, .55, .16, tower.x, 3.16, tower.z, teal, .40, 12);
  P.cylinder(group, .54, .08, tower.x, 3.27, tower.z, trim);
  P.cylinder(group, .31, .61, tower.x, 3.56, tower.z, cream, .36, 12);
  extrude(group, arch(.24, .40), .022, darkTeal, tower.x, 3.32, tower.z + .33);
  dome(group, tower.x, 3.87, tower.z, .24);

  addPrayerCarpet(group, x, -2.48);
  extrude(group, arch(1.65, 2.13), .06, trim, x, .13, back + .116);
  extrude(group, arch(1.35, 1.92), .04, darkTeal, x, .21, back + .176);
  extrude(group, arch(.82, 1.51), .018, '#32786a', x, .34, back + .217);
  for (const dx of [-2.85, 2.85]) windowPanel(group, x + dx, .61, back + .116);

  const rackX = -4.62, rackZ = 1.26, wood = '#9e7653';
  for (const dx of [-.545, .545]) P.box(group, .07, .56, .40, rackX + dx, .31, rackZ, wood);
  for (const y of [.12, .33, .58]) P.box(group, 1.16, .05, .40, rackX, y, rackZ, wood);
  for (const [dx,y,color] of [[-.28,.17,'#526b65'],[.26,.38,'#b97259']]) {
    for (const pair of [-.062,.062]) P.ball(group, .05, rackX + dx + pair, y, rackZ, color, [.90,.55,2.05]);
  }

  const obstacles = [
    {x, z: back, w: width, d: wall},
    {x: left, z, w: wall, d: depth},
    {x: right, z, w: wall, d: depth},
    ...wingCenters.map(wingX => ({x: wingX, z: front, w: wing, d: .39})),
    {x: tower.x, z: tower.z, w: 1.12, d: 1.12},
    {x: rackX, z: rackZ, w: 1.16, d: .40},
    {x: x - 3.78, z: 1.88, w: 1.88, d: .68},
    {x: x + 3.78, z: 1.88, w: 1.88, d: .68},
  ];
  return {
    exterior: roof, obstacles,
    entrance: {x, z: front, w: opening, d: wall},
    approach: {x, z: -.85},
    contains: (point) => point.x > left && point.x < right && point.z > back && point.z < front,
  };
}
