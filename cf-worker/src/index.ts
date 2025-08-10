export interface Env {
  GEMINI_API_KEY: string;
}

interface InBody {
  h: { code: string; name: string; flag: string };
  f: { code: string; name: string; flag: string };
  distanceKm: number;
  score: number;
  nameA: string;
  nameB: string;
  lang?: string;
}

function composeFallback(b: InBody) {
  const formatKm = (km: number) => new Intl.NumberFormat('fr-FR').format(Math.round(km)) + ' km';
  const hearts = ['💞','💖','💗','💘','💝'];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const extra = '';
  const fr = `${b.nameA}${extra} (${b.h.flag} ${b.h.name}) et ${b.nameB}${extra} (${b.f.flag} ${b.f.name}) sont séparés par ${formatKm(b.distanceKm)}, mais leurs cœurs n’ont pas de frontières. Compatibilité: ${b.score}/100 ${pick(hearts)}`;
  const dj_lat = `${b.nameA}${extra} w ${b.nameB}${extra} b3id bainathom ${formatKm(b.distanceKm)}, walakin l9loub ma 3and-homch hdoud. N9ta: ${b.score}/100 ${pick(hearts)}`;
  const dj_ar = `${b.nameA}${extra} و ${b.nameB}${extra} بعيد بيناتهم ${formatKm(b.distanceKm)}، ولكن القلوب ما عندهاش حدود. النقطة: ${b.score}/100 ${pick(hearts)}`;
  return { fr, darija_lat: dj_lat, darija_ar: dj_ar };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST' || !url.pathname.endsWith('/api/gemini/generate-romance')) {
      return new Response('Not found', { status: 404 });
    }

    let body: InBody | null = null;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    if (!body) {
      return new Response(JSON.stringify({ error: 'missing_body' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    const key = env.GEMINI_API_KEY;
    if (!key) {
      const messages = composeFallback(body);
      return new Response(JSON.stringify({ messages, mode: 'fallback' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    const sys = 'Tu es un assistant qui écrit des messages romantiques courts, mignons et variés. Garde un ton chaleureux, pas trop long.';
    const promptFr = `Crée un court message romantique en français pour ${body.nameA} (${body.h.flag} ${body.h.name}) et ${body.nameB} (${body.f.flag} ${body.f.name}). Distance: ${Math.round(body.distanceKm)} km. Score: ${body.score}/100.`;
    const promptDjLat = `En darija (latin), une variante courte et mignonne pour ${body.nameA} (${body.h.flag}) et ${body.nameB} (${body.f.flag}).`;
    const promptDjAr = `بالدارجة المغربية (العربية)، رسالة قصيرة وجميلة لـ ${body.nameA} (${body.h.flag}) و ${body.nameB} (${body.f.flag}).`;
    const contents = [
      { role: 'user', parts: [{ text: sys + '\n' + promptFr }] },
      { role: 'user', parts: [{ text: promptDjLat }] },
      { role: 'user', parts: [{ text: promptDjAr }] },
    ];

    try {
      const apiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents })
        }
      );
      if (!apiRes.ok) throw new Error('gemini_error');
      const data = await apiRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const lines = String(text).split(/\n+/).filter(Boolean);
      const fallback = composeFallback(body);
      const messages = {
        fr: lines[0] || fallback.fr,
        darija_lat: lines[1] || fallback.darija_lat,
        darija_ar: lines[2] || fallback.darija_ar,
      };
      return new Response(JSON.stringify({ messages, mode: 'gemini' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (e) {
      const messages = composeFallback(body);
      return new Response(JSON.stringify({ messages, mode: 'fallback_error' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
  },
};