import { createWriteStream, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'ejercicios');
mkdirSync(OUT, { recursive: true });

const W = 'https://wger.de/media/exercise-images';

// Todos los URLs únicos del mapping EJERCICIO_IMG
const URLS = [
  `${W}/192/Bench-press-1.png`,
  `${W}/1277/9f3c7817-3e3d-417d-8b08-2c0a1aa5fe03.jpg`,
  `${W}/41/Incline-bench-press-1.png`,
  `${W}/238/2fc242d3-5bdd-4f97-99bd-678adb8c96fc.png`,
  `${W}/98/Butterfly-machine-2.png`,
  `${W}/97/Dumbbell-bench-press-1.png`,
  `${W}/194/34600351-8b0b-4cb0-8daa-583537be15b0.png`,
  `${W}/50/695ced5c-9961-4076-add2-cb250d01089e.png`,
  `${W}/1185/c5ca283d-8958-4fd8-9d59-a3f52a3ac66b.jpg`,
  `${W}/659/a60452f1-e2ea-43fe-baa6-c1a2208d060c.png`,
  `${W}/1519/fab7f641-27d4-40b5-8edd-1a0a137bfd94.gif`,
  `${W}/83/Bench-dips-1.png`,
  `${W}/475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg`,
  `${W}/181/Chin-ups-2.png`,
  `${W}/109/Barbell-rear-delt-row-1.png`,
  `${W}/106/T-bar-row-1.png`,
  `${W}/1637/a1fbe83a-a3e5-49f6-a2c2-5d5b533c2be8.png`,
  `${W}/158/02e8a7c3-dc67-434e-a4bc-77fdecf84b49.webp`,
  `${W}/1117/e74255c0-67a0-4309-b78d-2d79e6ff8c11.png`,
  `${W}/1639/8927346e-f5ca-4795-bdf1-5ac9309401e7.webp`,
  `${W}/128/Hyperextensions-1.png`,
  `${W}/74/Bicep-curls-1.png`,
  `${W}/1012/8270fdb8-28f1-4eff-b410-af8642085b3f.png`,
  `${W}/86/Bicep-hammer-curl-1.png`,
  `${W}/1109/00b0a0bf-c14a-4f13-bb14-62c09030a1aa.png`,
  `${W}/129/Standing-biceps-curl-1.png`,
  `${W}/1893/7dbad19e-0616-41fd-9d7d-3e21649c0eea.png`,
  `${W}/119/seated-barbell-shoulder-press-large-1.png`,
  `${W}/123/dumbbell-shoulder-press-large-1.png`,
  `${W}/148/lateral-dumbbell-raises-large-2.png`,
  `${W}/256/b7def5bc-2352-499b-b9e5-fff741003831.png`,
  `${W}/829/ad724e5c-b1ed-49e8-9279-a17545b0dd0b.png`,
  `${W}/151/Dumbbell-shrugs-2.png`,
  `${W}/1801/60043328-1cfb-4289-9865-aaf64d5aaa28.jpg`,
  `${W}/1088/9f66b288-ce8f-4154-ba80-78fee267263c.jpg`,
  `${W}/203/1c052351-2af0-4227-aeb0-244008e4b0a8.jpeg`,
  `${W}/988/6283b258-a4d7-4833-84f7-a38987022d3d.png`,
  `${W}/977/3124c091-6395-4377-96c5-56048b627ceb.png`,
  `${W}/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp`,
  `${W}/1652/0306c8c0-70cc-45d4-92de-6fa72ceaa834.webp`,
  `${W}/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg`,
  `${W}/851/4d621b17-f6cb-4107-97c0-9f44e9a2dbc6.webp`,
  `${W}/154/lying-leg-curl-machine-large-1.png`,
  `${W}/984/5c7ffe68-e7b2-47f3-a22a-f9cc28640432.png`,
  `${W}/113/Walking-lunges-1.png`,
  `${W}/999/d0931eb3-8db0-4049-bb08-aa4036072056.jfif`,
  `${W}/622/9a429bd0-afd3-4ad0-8043-e9beec901c81.jpeg`,
  `${W}/1620/edd40e39-e337-4460-a8dd-6127d40ddd16.jpeg`,
  `${W}/981/f9377a7e-eb58-4cca-b805-2d36863aeb03.png`,
  `${W}/1642/a81ad922-caf5-47f8-99b4-640cb0717436.webp`,
  `${W}/1613/a851fe9d-771f-44da-82f0-799e02ae3fd1.jpg`,
  `${W}/990/de20457c-914a-45c9-8cf9-0ad9739759a1.png`,
  `${W}/1748/923a3ff7-c269-49bd-9f03-697151a40f06.jpg`,
  `${W}/91/Crunches-1.png`,
  `${W}/93/Decline-crunch-1.png`,
  `${W}/176/Cross-body-crunch-1.png`,
  `${W}/458/b7bd9c28-9f1d-4647-bd17-ab6a3adf5770.png`,
  `${W}/1091/50c8912d-54ef-46c9-99d1-633b6196aa1e.jpg`,
  `${W}/979/27097a3a-5749-428d-b94c-6082afe390f6.png`,
  `${W}/125/Leg-raises-2.png`,
  `${W}/1193/70ca5d80-3847-4a8c-8882-c6e9e485e29e.png`,
  `${W}/1572/3d14e761-a73d-49da-8804-f3016a7573ff.png`,
  `${W}/983/16245344-9957-4a24-8d61-f9939ed5f964.png`,
  `${W}/1725/f0ebd44e-b8e1-400c-b598-ca371f3a07af.png`,
  `${W}/978/d3ffe51f-7eb8-4cc9-9eae-105847af3005.png`,
  `${W}/1868/446e7065-215d-4a91-9da7-9416101442bb.png`,
  `${W}/1874/66fca8a5-41e8-42d1-8776-5e46a4902650.png`,
  `${W}/1604/7695428e-bfed-4021-b987-498d93153995.png`,
];

function urlToFilename(url) {
  const parts = url.split('/');
  const id = parts[parts.length - 2];
  const file = parts[parts.length - 1];
  return `${id}_${file}`;
}

async function descargar(url) {
  const filename = urlToFilename(url);
  const dest = join(OUT, filename);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { console.error(`  ✗ ${filename} (HTTP ${res.status})`); return; }
    await pipeline(res.body, createWriteStream(dest));
    console.log(`  ✓ ${filename}`);
  } catch (e) {
    console.error(`  ✗ ${filename}: ${e.message}`);
  }
}

console.log(`Descargando ${URLS.length} imágenes a public/ejercicios/...\n`);
for (const url of URLS) await descargar(url);
console.log('\nListo.');
