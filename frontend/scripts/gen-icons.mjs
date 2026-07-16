// Genera los íconos de la PWA desde un SVG de marca (lima + tinta).
// Uso: npm i --no-save sharp && node scripts/gen-icons.mjs
// Los PNG generados se commitean: este script no corre en el build.
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(raiz, { recursive: true });

// Mancuerna sobre fondo lima. `escala` achica el dibujo para la zona segura maskable.
const svgMarca = (tamano, { redondeado = true, escala = 1 } = {}) => {
  const s = 512;
  const g = (1 - escala) * s / 2;
  return Buffer.from(`
<svg width="${tamano}" height="${tamano}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" rx="${redondeado ? 112 : 0}" fill="#C8F13F"/>
  <g transform="translate(${g} ${g}) scale(${escala})" fill="#12160D">
    <rect x="140" y="242" width="232" height="28" rx="14"/>
    <rect x="96"  y="176" width="46"  height="160" rx="20"/>
    <rect x="152" y="200" width="38"  height="112" rx="16"/>
    <rect x="370" y="176" width="46"  height="160" rx="20"/>
    <rect x="322" y="200" width="38"  height="112" rx="16"/>
  </g>
</svg>`);
};

const salidas = [
  { archivo: 'icon-192.png',          svg: svgMarca(192), tamano: 192 },
  { archivo: 'icon-512.png',          svg: svgMarca(512), tamano: 512 },
  { archivo: 'icon-maskable-512.png', svg: svgMarca(512, { redondeado: false, escala: 0.72 }), tamano: 512 },
  { archivo: 'apple-touch-icon.png',  svg: svgMarca(180, { redondeado: false }), tamano: 180 },
];

for (const { archivo, svg, tamano } of salidas) {
  await sharp(svg).resize(tamano, tamano).png().toFile(join(raiz, archivo));
  console.log('OK', archivo);
}
