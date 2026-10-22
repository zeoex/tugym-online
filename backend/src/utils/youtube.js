// Normaliza links de YouTube a https://www.youtube.com/watch?v=ID.
// Acepta: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID,
// youtube.com/embed/ID — con o sin www./m., con parámetros extra.
//
//   extraerYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10') → 'dQw4w9WgXcQ'
//   extraerYoutubeId('https://youtu.be/dQw4w9WgXcQ?si=abc')              → 'dQw4w9WgXcQ'
//   extraerYoutubeId('https://m.youtube.com/shorts/dQw4w9WgXcQ')         → 'dQw4w9WgXcQ'
//   extraerYoutubeId('https://youtube.com/embed/dQw4w9WgXcQ')            → 'dQw4w9WgXcQ'
//   extraerYoutubeId('https://vimeo.com/123')                            → null

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

function extraerYoutubeId(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  let id = null;

  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const partes = url.pathname.split('/').filter(Boolean);
    if (partes[0] === 'watch') id = url.searchParams.get('v');
    else if (['shorts', 'embed', 'v', 'live'].includes(partes[0])) id = partes[1];
  } else {
    return null;
  }
  return id && ID_RE.test(id) ? id : null;
}

// Devuelve { ok: true, url, id } | { ok: true, url: null, id: null } (vacío)
// | { ok: false } (no es de YouTube).
function normalizarYoutube(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { ok: true, url: null, id: null };
  const id = extraerYoutubeId(raw);
  if (!id) return { ok: false };
  return { ok: true, url: `https://www.youtube.com/watch?v=${id}`, id };
}

module.exports = { extraerYoutubeId, normalizarYoutube };
