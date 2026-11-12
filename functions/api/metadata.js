const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json; charset=utf-8", "cache-control":"no-store"}});

export async function onRequestPost({request, env}) {
  if (!env.GEMINI_API_KEY) return json({error:"Secret GEMINI_API_KEY belum dipasang di Cloudflare Pages."}, 503);
  let body;
  try { body = await request.json(); } catch { return json({error:"Body JSON tidak valid."}, 400); }
  const description = String(body.description || "").trim();
  const contentType = String(body.contentType || "Illustration").slice(0,60);
  if (description.length < 8) return json({error:"Deskripsi minimal 8 karakter."}, 400);
  if (description.length > 1800) return json({error:"Deskripsi terlalu panjang (maksimal 1800 karakter)."}, 413);

  const prompt = `You are a commercial stock metadata assistant. Based only on the image description below, create accurate Adobe Stock-style metadata. Do not invent visual details. Return JSON only with keys title and keywords. title: concise English title, maximum 70 characters. keywords: array of 20-35 concise English search terms, most important first, no duplicates, no brands, no unsupported concepts. Content type: ${contentType}. Description: ${description}`;
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  let upstream;
  try {
    upstream = await fetch(endpoint, {method:"POST", headers:{"content-type":"application/json", "x-goog-api-key":env.GEMINI_API_KEY}, body:JSON.stringify({contents:[{parts:[{text:prompt}]}], generationConfig:{responseMimeType:"application/json", temperature:0.3, maxOutputTokens:900}})});
  } catch { return json({error:"Tidak dapat menghubungi layanan AI. Coba lagi nanti."}, 502); }
  const raw = await upstream.json().catch(()=>({}));
  if (!upstream.ok) return json({error:raw.error?.message || `Layanan AI merespons ${upstream.status}.`}, 502);
  const text = raw.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("") || "";
  let result;
  try { result = JSON.parse(text); } catch { return json({error:"AI mengirim format yang tidak dapat dibaca. Coba ulangi."}, 502); }
  const title = String(result.title || "").trim().slice(0,70);
  const keywords = Array.isArray(result.keywords) ? [...new Set(result.keywords.map(x=>String(x).trim()).filter(Boolean).map(x=>x.toLowerCase()))].slice(0,49) : [];
  if (!title || !keywords.length) return json({error:"Hasil AI kosong atau tidak lengkap."}, 502);
  return json({title, keywords, model});
}

