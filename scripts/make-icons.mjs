// Генерирует иконки приложения: SVG-знак (терновое кольцо + крест) и PNG нужных размеров.
// Запуск: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const out = 'public/icons';
mkdirSync(out, { recursive: true });

const f = (n) => n.toFixed(2);

/** Кольцо с шипами наружу и внутрь, слегка закрученными — как терновый венец. */
function thornRing(cx, cy, r, count) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const outward = i % 2 === 0;
    const len = outward ? 9 : 5.5;
    const w = 0.09;
    const tip = r + (outward ? len : -len);
    const twist = outward ? 0.12 : -0.1;
    const p = (rad, ang) => `${f(cx + rad * Math.cos(ang))} ${f(cy + rad * Math.sin(ang))}`;
    d += `M${p(r, a - w)}L${p(tip, a + twist)}L${p(r, a + w)}Z`;
  }
  return d;
}

const cross = 'M50 18 53.2 29v10h9.8L72 43l-9 4h-9.8v22L50 82l-3.2-13V47H37l-9-4 9-4h9.8V29Z';

function mark({ bg, size = 100, pad = 0 }) {
  const s = (100 - pad * 2) / 100;
  const g = `
    <g transform="translate(${pad} ${pad}) scale(${s})">
      <circle cx="50" cy="50" r="31" fill="none" stroke="#e8e6e3" stroke-width="1.6" opacity=".85"/>
      <circle cx="50" cy="50" r="27.5" fill="none" stroke="#e8e6e3" stroke-width=".6" opacity=".4"/>
      <path d="${thornRing(50, 50, 31, 24)}" fill="#e8e6e3" opacity=".85"/>
      <path d="${cross}" fill="#e8e6e3" filter="url(#glow)"/>
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="light" cx="50%" cy="42%" r="60%">
      <stop offset="0" stop-color="#26262a"/>
      <stop offset="1" stop-color="#0b0b0c"/>
    </radialGradient>
  </defs>
  ${bg ? '<rect width="100" height="100" fill="url(#light)"/>' : ''}
  ${g}
</svg>`;
}

const icon = mark({ bg: true, pad: 6 });
const maskable = mark({ bg: true, pad: 16 }); // безопасная зона для Android
writeFileSync(`${out}/icon.svg`, icon);
writeFileSync(`${out}/icon-mark.svg`, mark({ bg: false }));

const png = (svg, size, name) => sharp(Buffer.from(svg), { density: 72 * (size / 100) }).resize(size, size).png().toFile(`${out}/${name}`);
await png(icon, 192, 'icon-192.png');
await png(icon, 512, 'icon-512.png');
await png(maskable, 512, 'icon-maskable-512.png');
await png(mark({ bg: true, pad: 10 }), 180, 'apple-touch-icon.png');
console.log('icons ok');
