// Generates the site's line drawings and injects them into the HTML pages
// between <!--fig:name--> ... <!--/fig:name--> markers.
// Run: node tools/figures.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Plate palette: drawings are printed on travertine paper.
const C = {
  paper: '#D8CFC2',
  top: '#E6DFD4',
  left: '#CDC3B5',
  right: '#BFB4A5',
  ink: '#2A231D',
  soft: '#6E6257',
  acc: '#A0582F',
  accFill: '#C98B66',
  dark: '#3A322B',
};
const MONO = "'DM Mono', ui-monospace, monospace";
const f = (n) => Math.round(n * 10) / 10;
const pts = (a) => a.map((p) => `${f(p[0])},${f(p[1])}`).join(' ');

// Isometric projector. x runs down-right, y runs down-left, z runs up.
const iso = (ox, oy, s) => (x, y, z = 0) => [ox + (x - y) * 0.866 * s, oy + (x + y) * 0.5 * s - z * s];

function box(P, x, y, z, w, d, h, fills = {}) {
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const front = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const side = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  return `<polygon points="${pts(front)}" fill="${fills.front || C.left}"/>` +
    `<polygon points="${pts(side)}" fill="${fills.side || C.right}"/>` +
    `<polygon points="${pts(top)}" fill="${fills.top || C.top}"/>`;
}
const quad = (P, x, y, z, w, d, attrs = '') =>
  `<polygon points="${pts([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)])}" ${attrs}/>`;

function columns(P, w, d, z, h, inset = 18, size = 8) {
  const spots = [
    [inset, inset], [w - inset - size, inset], [inset, d - inset - size], [w - inset - size, d - inset - size],
    [w / 2 - size / 2, inset], [w / 2 - size / 2, d - inset - size],
  ].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  return spots.map(([x, y]) => box(P, x, y, z, size, size, h)).join('');
}

function cylinder(P, x, y, z, r, h) {
  const [cx, cyb] = P(x, y, z);
  const cyt = cyb - h * 1; // caller passes already-scaled h via P difference
  const rx = r * 1.2247, ry = r * 0.7071;
  return `<path d="M${f(cx - rx)},${f(cyt)} L${f(cx - rx)},${f(cyb)} A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(cyb)} L${f(cx + rx)},${f(cyt)}" fill="${C.left}"/>` +
    `<ellipse cx="${f(cx)}" cy="${f(cyt)}" rx="${f(rx)}" ry="${f(ry)}" fill="${C.top}"/>`;
}

function leader(from, toX, label, sub, anchorRight = false, ty = null) {
  const [x1, y0] = from;
  const y1 = ty ?? y0;
  const elbowX = toX;
  const tx = anchorRight ? elbowX - 8 : elbowX + 8;
  const anchor = anchorRight ? 'end' : 'start';
  return `<g class="lbl"><polyline points="${f(x1)},${f(y0)} ${f(ty == null ? x1 : x1 + Math.abs(y1 - y0) * 0.6)},${f(y1)} ${f(elbowX)},${f(y1)}" fill="none" stroke="${C.ink}" stroke-width="1"/>` +
    `<circle cx="${f(x1)}" cy="${f(y0)}" r="2.6" fill="${C.ink}" stroke="none"/>` +
    `<text x="${f(tx)}" y="${f(y1 - 4)}" text-anchor="${anchor}" font-size="13" fill="${C.ink}" stroke="none">${label}</text>` +
    (sub ? `<text x="${f(tx)}" y="${f(y1 + 14)}" text-anchor="${anchor}" font-size="12" fill="${C.soft}" stroke="none">${sub}</text>` : '') +
    `</g>`;
}

const wrap = (vb, label, body, cls = '') =>
  `<svg class="drawing ${cls}" viewBox="${vb}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet" font-family="${MONO}">` +
  `<g fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;

// ---------------------------------------------------------------- hero
function hero() {
  const s = 0.96;
  const P = iso(250, 420, s);
  const W = 300, D = 220;
  let g = '';
  // ground shadow plate
  g += quad(P, -12, -12, 0, W + 24, D + 72, `fill="${C.right}" stroke="none" opacity=".35"`);
  // data
  g += box(P, 0, 0, 0, W, D, 24);
  g += `<g data-layer="data">${[0, 1, 2].map((i) => {
    const [cx, cy] = P(70 + i * 80, 110, 24);
    const rx = 18 * 1.2247 * s, ry = 18 * 0.7071 * s, h = 30 * s;
    return `<path d="M${f(cx - rx)},${f(cy - h)} L${f(cx - rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(cy)} L${f(cx + rx)},${f(cy - h)}" fill="${C.left}"/><ellipse cx="${f(cx)}" cy="${f(cy - h)}" rx="${f(rx)}" ry="${f(ry)}" fill="${C.top}"/>`;
  }).join('')}</g>`;
  g += columns(P, W, D, 24, 90);
  // services
  g += box(P, 0, 0, 114, W, D, 20);
  [[40, 60], [130, 60], [220, 60], [85, 140], [175, 140]].forEach(([x, y]) => { g += box(P, x, y, 134, 44, 40, 22); });
  g += columns(P, W, D, 134, 90);
  // interface
  g += box(P, 0, 0, 224, W, D, 16);
  const Z = 240;
  g += quad(P, 16, 16, Z, W - 32, 26, `fill="${C.left}"`);
  g += quad(P, 16, 54, Z, 58, D - 70);
  [64, 88, 112, 136].forEach((y) => { g += `<line x1="${f(P(26, y, Z)[0])}" y1="${f(P(26, y, Z)[1])}" x2="${f(P(62, y, Z)[0])}" y2="${f(P(62, y, Z)[1])}" stroke-width="2"/>`; });
  g += quad(P, 86, 54, Z, W - 102, 70);
  g += quad(P, 86, 136, Z, (W - 114) / 2, D - 152);
  g += quad(P, 86 + (W - 114) / 2 + 12, 136, Z, (W - 114) / 2, D - 152);
  // landing + ramp at 1:12 (rise 24, run 288 scaled to fit 260)
  g += box(P, 0, D, 0, 44, 56, 24);
  const y0 = D + 12, y1 = D + 52, xr = 300;
  g += `<g data-layer="ramp"><polygon points="${pts([P(xr, y1, 0), P(44, y1, 24), P(44, y1, 0)])}" fill="${C.left}"/>` +
    `<polygon points="${pts([P(xr, y0, 0), P(44, y0, 24), P(44, y1, 24), P(xr, y1, 0)])}" fill="${C.accFill}"/>` +
    `<polyline points="${pts([P(xr, y1, 18), P(44, y1, 42), P(0, y1, 42)])}" stroke="${C.ink}" stroke-width="1.4"/>` +
    [xr, 210, 127, 44].map((x) => { const z = 24 * (xr - x) / (xr - 44); const a = P(x, y1, z), b = P(x, y1, z + 18); return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`; }).join('') +
    `</g>`;
  // labels
  const lx = 540;
  g += leader(P(W, D * 0.35, 232), lx, 'INTERFACE', 'React · Angular · TS');
  g += leader(P(W, D * 0.35, 124), lx, 'SERVICES', 'Spring Boot · APIs');
  g += leader(P(W, D * 0.35, 12), lx, 'DATA', 'PostgreSQL');
  const rp = P(200, y1, 8);
  g += leader(rp, lx, 'RAMP 1:12', 'Section 508 · WCAG', false, rp[1] + 70);
  // scale bar + north mark
  const sbY = 790;
  g += `<g stroke-width="1">${[0, 1, 2, 3].map((i) => `<rect x="${60 + i * 40}" y="${sbY}" width="40" height="6" fill="${i % 2 ? C.paper : C.ink}"/>`).join('')}` +
    `<text x="60" y="${sbY + 24}" font-size="12" fill="${C.soft}" stroke="none">0</text><text x="220" y="${sbY + 24}" font-size="12" fill="${C.soft}" stroke="none" text-anchor="end">4 m</text></g>`;
  g += `<g transform="translate(700 80)"><circle r="18"/><polygon points="0,-14 6,6 0,2 -6,6" fill="${C.ink}" stroke="none"/><text y="40" font-size="12" text-anchor="middle" fill="${C.ink}" stroke="none">N</text></g>`;
  return wrap('0 0 760 860', 'Axonometric drawing of a three-level structure: a data level with database cylinders, a services level with blocks, and an interface level laid out like a screen, with an accessible ramp at a 1 to 12 slope leading to the entrance.', g, 'drawing--hero');
}

// ---------------------------------------------------------------- thumbnail plan
function thumb() {
  let g = '';
  g += `<rect x="16" y="16" width="268" height="188" fill="${C.top}" stroke-width="5"/>`;
  g += `<line x1="16" y1="58" x2="284" y2="58" stroke-width="3"/><line x1="86" y1="58" x2="86" y2="204" stroke-width="3"/><line x1="214" y1="58" x2="214" y2="204" stroke-width="3"/>`;
  // door swings (links) as openings
  g += `<rect x="40" y="55" width="26" height="6" fill="${C.top}" stroke="none"/><path d="M40,58 A26,26 0 0 1 66,84" stroke-dasharray="3 3"/><line x1="40" y1="58" x2="40" y2="84"/>`;
  g += `<rect x="83" y="150" width="6" height="26" fill="${C.top}" stroke="none"/><path d="M86,150 A26,26 0 0 1 112,176" stroke-dasharray="3 3"/><line x1="86" y1="150" x2="112" y2="150"/>`;
  g += `<rect x="211" y="96" width="6" height="26" fill="${C.top}" stroke="none"/><path d="M214,122 A26,26 0 0 1 240,96" stroke-dasharray="3 3"/><line x1="214" y1="122" x2="240" y2="122"/>`;
  g += `<rect x="102" y="76" width="96" height="54" fill="${C.left}" stroke="none"/>`;
  [92, 104, 116].forEach((y) => { g += `<line x1="112" y1="${y}" x2="${y === 116 ? 160 : 188}" y2="${y}" stroke-width="2"/>`; });
  g += `<rect x="102" y="142" width="96" height="44" fill="none" stroke-dasharray="4 3"/>`;
  g += `<rect x="230" y="140" width="40" height="18" fill="${C.accFill}" stroke="none"/>`;
  g += `<text x="30" y="42" font-size="13" fill="${C.ink}" stroke="none">HEADER</text><text x="26" y="196" font-size="11" fill="${C.soft}" stroke="none">NAV</text><text x="224" y="196" font-size="11" fill="${C.soft}" stroke="none">ASIDE</text>`;
  return wrap('0 0 300 220', 'A screen layout drawn as a floor plan: header, navigation, content and aside as rooms, with links drawn as doors.', g, 'drawing--thumb');
}

// ---------------------------------------------------------------- case 1: portal progression
function screen(x, y, w, h, v) {
  const fill = v === 'wire' ? C.paper : v === 'mock' ? C.top : '#EEE8DF';
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke-width="1.6"/>`;
  g += `<line x1="${x}" y1="${y + 18}" x2="${x + w}" y2="${y + 18}"/>`;
  [0, 1, 2].forEach((i) => { g += `<circle cx="${x + 10 + i * 9}" cy="${y + 9}" r="2.4" ${v === 'final' ? `fill="${C.ink}"` : ''}/>`; });
  const nx = x, ny = y + 18, nw = 64, nh = h - 18;
  if (v === 'wire') g += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" stroke-dasharray="4 3"/>`;
  else g += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" fill="${v === 'final' ? C.dark : C.left}"/>`;
  [0, 1, 2, 3, 4].forEach((i) => {
    const ly = ny + 22 + i * 20;
    const col = v === 'final' ? (i === 1 ? C.accFill : C.paper) : C.ink;
    if (v === 'final' && i === 1) g += `<rect x="${nx + 6}" y="${ly - 7}" width="${nw - 12}" height="14" fill="${C.acc}" stroke="none"/>`;
    g += `<line x1="${nx + 12}" y1="${ly}" x2="${nx + nw - 16 - (i % 2) * 10}" y2="${ly}" stroke="${v === 'final' && i === 1 ? C.paper : col}" stroke-width="${v === 'wire' ? 1.2 : 2.4}"/>`;
  });
  const cx = x + nw + 14, cw = w - nw - 14 - 112, cy = ny + 14;
  // header
  g += `<line x1="${cx}" y1="${cy + 4}" x2="${cx + 90}" y2="${cy + 4}" stroke-width="${v === 'wire' ? 1.2 : 3.2}"/>`;
  if (v === 'wire') g += `<rect x="${cx + cw - 46}" y="${cy - 4}" width="46" height="16"/><line x1="${cx + cw - 46}" y1="${cy - 4}" x2="${cx + cw}" y2="${cy + 12}"/><line x1="${cx + cw}" y1="${cy - 4}" x2="${cx + cw - 46}" y2="${cy + 12}"/>`;
  else g += `<rect x="${cx + cw - 46}" y="${cy - 4}" width="46" height="16" fill="${v === 'final' ? C.acc : C.right}" stroke="${v === 'final' ? C.acc : C.ink}"/>`;
  // table rows
  const ty = cy + 26;
  for (let i = 0; i < 7; i++) {
    const ry = ty + i * 22;
    if (v === 'wire') {
      g += `<line x1="${cx}" y1="${ry + 18}" x2="${cx + cw}" y2="${ry + 18}" stroke-dasharray="2 3"/>`;
      g += `<line x1="${cx + 4}" y1="${ry + 9}" x2="${cx + 50 + (i * 13) % 40}" y2="${ry + 9}"/>`;
    } else {
      if (i === 0) g += `<rect x="${cx}" y="${ry}" width="${cw}" height="18" fill="${C.left}" stroke="none"/>`;
      g += `<line x1="${cx + 6}" y1="${ry + 9}" x2="${cx + 50 + (i * 13) % 40}" y2="${ry + 9}" stroke-width="2.4"/>`;
      g += `<line x1="${cx + 110}" y1="${ry + 9}" x2="${cx + 140}" y2="${ry + 9}" stroke-width="2.4" stroke="${C.soft}"/>`;
      if (i > 0) g += `<rect x="${cx + cw - 34}" y="${ry + 3}" width="28" height="12" rx="6" fill="${v === 'final' ? (i % 3 === 1 ? C.accFill : C.right) : C.right}" stroke="none"/>`;
    }
  }
  if (v === 'final') g += `<rect x="${cx - 3}" y="${ty + 22 * 2 - 3}" width="${cw + 6}" height="24" stroke="${C.acc}" stroke-width="2" stroke-dasharray="5 3"/>`;
  // detail panel
  const px = x + w - 104, pw = 94, py = ny + 10, ph = h - 36;
  if (v === 'wire') {
    g += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}"/>`;
    g += `<rect x="${px + 8}" y="${py + 8}" width="${pw - 16}" height="44"/><line x1="${px + 8}" y1="${py + 8}" x2="${px + pw - 8}" y2="${py + 52}"/><line x1="${px + pw - 8}" y1="${py + 8}" x2="${px + 8}" y2="${py + 52}"/>`;
    [70, 96, 122].forEach((o) => { g += `<rect x="${px + 8}" y="${py + o}" width="${pw - 16}" height="14" stroke-dasharray="3 3"/>`; });
  } else {
    g += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${v === 'final' ? C.paper : C.left}"/>`;
    g += `<line x1="${px + 8}" y1="${py + 16}" x2="${px + 60}" y2="${py + 16}" stroke-width="3"/>`;
    [34, 64, 94, 124].forEach((o) => { g += `<rect x="${px + 8}" y="${py + o}" width="${pw - 16}" height="18" fill="${C.top}"/>`; });
    g += `<rect x="${px + 8}" y="${py + ph - 28}" width="${pw - 16}" height="18" fill="${v === 'final' ? C.ink : C.right}"/>`;
  }
  return g;
}

function marines() {
  const W = 340, H = 236, top = 130, gap = 50, x0 = 40;
  const xs = [x0, x0 + W + gap, x0 + (W + gap) * 2];
  let g = '';
  // site: the lifecycle as a dimension string
  const sy = 56;
  const nodes = [[x0, 'RAISED'], [600, 'IN PROGRESS'], [1160, 'RESOLVED']];
  g += `<g data-part="site"><line x1="${x0}" y1="${sy}" x2="1160" y2="${sy}" stroke-width="1.4"/>` +
    nodes.map(([nx, t], i) => `<line x1="${nx}" y1="${sy - 10}" x2="${nx}" y2="${sy + 10}" stroke-width="1.6"/><text x="${nx + (i === 2 ? -8 : 8)}" y="${sy - 14}" text-anchor="${i === 2 ? 'end' : 'start'}" font-size="13" fill="${C.ink}" stroke="none">${t}</text>`).join('') +
    `<text x="${x0}" y="${sy + 30}" font-size="12" fill="${C.soft}" stroke="none">A SUPPORT REQUEST, FROM RAISED TO RESOLVED</text>` +
    [320, 880].map((ax) => `<polygon points="${ax - 6},${sy - 5} ${ax + 6},${sy} ${ax - 6},${sy + 5}" fill="${C.ink}" stroke="none"/>`).join('') + `</g>`;
  g += `<g data-part="plan">${screen(xs[0], top, W, H, 'wire')}</g>`;
  // structure: mockup + redlines
  let red = '';
  const mx = xs[1], my = top;
  red += `<g stroke="${C.acc}" stroke-width="1.2"><line x1="${mx}" y1="${my + H + 16}" x2="${mx + 64}" y2="${my + H + 16}"/><line x1="${mx}" y1="${my + H + 10}" x2="${mx}" y2="${my + H + 22}"/><line x1="${mx + 64}" y1="${my + H + 10}" x2="${mx + 64}" y2="${my + H + 22}"/>` +
    `<text x="${mx + 32}" y="${my + H + 34}" font-size="12" text-anchor="middle" fill="${C.acc}" stroke="none">64</text>` +
    `<rect x="${mx + 74}" y="${my + 54}" width="${W - 64 - 14 - 112 + 8}" height="${7 * 22 + 4}" stroke-dasharray="5 4" fill="none"/>` +
    `<line x1="${mx + W + 8}" y1="${my + 82}" x2="${mx + W + 8}" y2="${my + 104}"/><line x1="${mx + W + 2}" y1="${my + 82}" x2="${mx + W + 14}" y2="${my + 82}"/><line x1="${mx + W + 2}" y1="${my + 104}" x2="${mx + W + 14}" y2="${my + 104}"/>` +
    `<text x="${mx + W + 18}" y="${my + 97}" font-size="12" fill="${C.acc}" stroke="none">22</text></g>`;
  g += `<g data-part="structure">${screen(xs[1], top, W, H, 'mock')}${red}</g>`;
  g += `<g data-part="form">${screen(xs[2], top, W, H, 'final')}</g>`;
  const cap = ['1A  PLAN · WIREFRAME', '1B  ELEVATION · MOCKUP + REDLINES', '1C  FINISH · SHIPPED UI'];
  const parts = ['plan', 'structure', 'form'];
  xs.forEach((x, i) => { g += `<text data-part="${parts[i]}" x="${x}" y="${top + H + 58}" font-size="13" fill="${C.ink}" stroke="none">${cap[i]}</text>`; });
  return wrap('0 0 1200 440', 'Three drawings of a support request portal side by side: a wireframe, a high-fidelity mockup marked up with redline measurements for developers, and the shipped interface with a visible focus ring and status labels. Above them, a line traces a request from raised to resolved.', g, 'drawing--wide');
}

// ---------------------------------------------------------------- case 2: nexgen layers
function nexgen() {
  const s = 0.86;
  const P = iso(300, 210, s);
  const W = 320, D = 200;
  let g = '';
  g += `<g data-part="site">${quad(P, -30, -30, 0, W + 60, D + 60, `fill="${C.right}" stroke="${C.ink}" stroke-dasharray="6 5" opacity=".55"`)}</g>`;
  let st = box(P, 0, 0, 0, W, D, 22);
  [[60, 100], [160, 100], [260, 100]].forEach(([x, y]) => {
    const [cx, cy] = P(x, y, 22); const rx = 20 * 1.2247 * s, ry = 20 * 0.7071 * s, h = 34 * s;
    st += `<path d="M${f(cx - rx)},${f(cy - h)} L${f(cx - rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(cy)} L${f(cx + rx)},${f(cy - h)}" fill="${C.left}"/><ellipse cx="${f(cx)}" cy="${f(cy - h)}" rx="${f(rx)}" ry="${f(ry)}" fill="${C.top}"/>`;
  });
  st += columns(P, W, D, 22, 84);
  st += box(P, 0, 0, 106, W, D, 18);
  [[30, 40, 120, 50], [170, 40, 120, 50], [30, 110, 260, 50]].forEach(([x, y, w, d]) => { st += box(P, x, y, 124, w, d, 18); });
  st += columns(P, W, D, 124, 84);
  g += `<g data-part="structure">${st}</g>`;
  let fe = box(P, 0, 0, 208, W, D, 14);
  [[20, 20, 280, 30, 8], [20, 62, 80, 118, 8], [116, 62, 84, 54, 20], [216, 62, 84, 54, 20], [116, 128, 184, 52, 12]].forEach(([x, y, w, d, h]) => {
    fe += box(P, x, y, 222, w, d, h, { top: x === 216 ? C.accFill : C.top });
  });
  g += `<g data-part="form">${fe}</g>`;
  const lx = 640;
  g += `<g data-part="form">${leader(P(W, D * 0.3, 215), lx, 'FRONTEND · REACT', 'components · hooks · features')}</g>`;
  g += `<g data-part="structure">${leader(P(W, D * 0.3, 115), lx, 'BACKEND · SPRING BOOT', 'API integration · business logic')}${leader(P(W, D * 0.3, 10), lx, 'DATA · POSTGRESQL', 'queries')}</g>`;
  // plan: collaboration loop drawn on the ground plane
  const cx = 1010, cy = 360, r = 118;
  const rx = r * 1.2247 * 0.78, ry = r * 0.7071 * 0.78;
  const ang = [-90, 30, 150];
  const names = [['DESIGN REVIEW', 'end', 0], ['UX FEEDBACK', 'middle', 1], ['SPRINT PLANNING', 'middle', 2]];
  let pl = `<ellipse cx="${cx}" cy="${cy}" rx="${f(rx)}" ry="${f(ry)}" stroke-width="1.4"/>`;
  ang.forEach((a, i) => {
    const t = (a * Math.PI) / 180; const x = cx + rx * Math.cos(t), y = cy + ry * Math.sin(t);
    pl += `<circle cx="${f(x)}" cy="${f(y)}" r="7" fill="${i === 0 ? C.accFill : C.top}"/>`;
    const ty = i === 0 ? y - 18 : y + 30; const tx = i === 0 ? x : (i === 1 ? x + 6 : x - 6);
    pl += `<text x="${f(tx)}" y="${f(ty)}" font-size="13" text-anchor="${i === 0 ? 'middle' : (i === 1 ? 'start' : 'end')}" fill="${C.ink}" stroke="none">${names[i][0]}</text>`;
    const m = ((a + 60) * Math.PI) / 180; const mx = cx + rx * Math.cos(m), my = cy + ry * Math.sin(m);
    const dx = -rx * Math.sin(m), dy = ry * Math.cos(m); const L = Math.hypot(dx, dy); const ux = dx / L, uy = dy / L;
    pl += `<polygon points="${f(mx + ux * 7)},${f(my + uy * 7)} ${f(mx - ux * 5 - uy * 5)},${f(my - uy * 5 + ux * 5)} ${f(mx - ux * 5 + uy * 5)},${f(my - uy * 5 - ux * 5)}" fill="${C.ink}" stroke="none"/>`;
  });
  pl += `<text x="${cx}" y="${cy + 4}" font-size="12" text-anchor="middle" fill="${C.soft}" stroke="none">EACH SPRINT</text>`;
  g += `<g data-part="plan">${pl}</g>`;
  return wrap('0 0 1200 540', 'Exploded axonometric of a web application in three levels: a React frontend with interface components on top, a Spring Boot backend with service blocks in the middle, and PostgreSQL databases at the base. Beside it, a loop links design review, UX feedback and sprint planning.', g, 'drawing--wide');
}

// ---------------------------------------------------------------- about: ramp section detail
function ramp() {
  let g = '';
  const gy = 330;
  g += `<line x1="30" y1="${gy}" x2="870" y2="${gy}" stroke-width="2"/>`;
  for (let x = 40; x < 870; x += 18) g += `<line x1="${x}" y1="${gy + 2}" x2="${x - 12}" y2="${gy + 14}" stroke="${C.soft}" stroke-width="1"/>`;
  const x0 = 110, x1 = 650, rise = 45; // 540 run / 45 rise = 1:12
  g += `<polygon points="${x0},${gy} ${x1},${gy - rise} ${x1},${gy}" fill="${C.accFill}" stroke-width="1.6"/>`;
  g += `<rect x="${x1}" y="${gy - rise}" width="130" height="${rise}" fill="${C.left}" stroke-width="1.6"/>`;
  g += `<rect x="780" y="70" width="36" height="${gy - 70}" fill="${C.right}" stroke-width="1.6"/>`;
  g += `<rect x="784" y="${gy - rise - 160}" width="28" height="160" fill="${C.top}"/>`;
  const hr = 64;
  g += `<polyline points="${x0 - 30},${gy - hr} ${x0},${gy - hr} ${x1},${gy - rise - hr} ${x1 + 120},${gy - rise - hr}" stroke-width="2"/>`;
  [x0, 290, 470, x1].forEach((x) => { const y = gy - rise * (x - x0) / (x1 - x0); g += `<line x1="${x}" y1="${f(y)}" x2="${x}" y2="${f(y - hr)}"/>`; });
  g += `<g stroke="${C.acc}"><line x1="${x0}" y1="${gy + 40}" x2="${x1}" y2="${gy + 40}"/><line x1="${x0}" y1="${gy + 32}" x2="${x0}" y2="${gy + 48}"/><line x1="${x1}" y1="${gy + 32}" x2="${x1}" y2="${gy + 48}"/>` +
    `<line x1="${x1 + 28}" y1="${gy}" x2="${x1 + 28}" y2="${gy - rise}" stroke="${C.acc}"/></g>`;
  g += `<text x="${(x0 + x1) / 2}" y="${gy + 64}" font-size="14" text-anchor="middle" fill="${C.ink}" stroke="none">12</text>`;
  g += `<text x="${x1 + 36}" y="${gy - 18}" font-size="14" fill="${C.ink}" stroke="none">1</text>`;
  g += `<text x="${x0 + 150}" y="${gy - 46}" font-size="14" fill="${C.ink}" stroke="none" transform="rotate(-4.8 ${x0 + 150} ${gy - 46})">SLOPE 1:12</text>`;
  g += `<text x="30" y="40" font-size="13" fill="${C.ink}" stroke="none">DETAIL 01 · RAMP, IN SECTION</text>`;
  g += `<text x="30" y="58" font-size="12" fill="${C.soft}" stroke="none">POURED WITH THE FOUNDATION</text>`;
  return wrap('0 0 900 420', 'Section drawing of an accessible ramp rising at a slope of 1 to 12 to a level landing and a doorway, with a continuous handrail.', g, 'drawing--ramp');
}

const figs = { hero: hero(), thumb: thumb(), marines: marines(), nexgen: nexgen(), ramp: ramp() };
for (const page of ['index.html', 'work.html', 'about.html', 'contact.html']) {
  const p = join(root, page);
  let html;
  try { html = readFileSync(p, 'utf8'); } catch { continue; }
  const out = html.replace(/<!--fig:(\w+)-->[\s\S]*?<!--\/fig:\1-->/g, (m, name) => (figs[name] ? `<!--fig:${name}-->${figs[name]}<!--/fig:${name}-->` : m));
  if (out !== html) { writeFileSync(p, out); console.log('figures ->', page); }
}
