
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return json({
      error: "Secret GEMINI_API_KEY belum dipasang di Cloudflare Pages."
    }, 503);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Body JSON tidak valid." }, 400);
  }

  const description = String(body.description || "").trim();
  const contentType = String(body.contentType || "Illustration").slice(0, 60);

  if (description.length < 8) {
    return json({ error: "Deskripsi minimal 8 karakter." }, 400);
  }

  if (description.length > 1800) {
    return json({
      error: "Deskripsi terlalu panjang (maksimal 1800 karakter)."
    }, 413);
  }

  const prompt = `
You are a professional Adobe Stock metadata assistant.

Based only on the image description, create accurate commercial stock metadata.
Do not invent visual details.

Return valid JSON only:
{
  "title": "Concise English title, maximum 70 characters",
  "keywords": ["20 to 35 English keywords"]
}

Rules:
- Most important keywords first.
- No duplicate keywords.
- No brands or trademarks.
- No unsupported concepts.
- Use natural, searchable English keywords.
- Content type: ${contentType}
- Image description: ${description}
`;

  const model = env.GEMINI_MODEL || "gemini-3.8-flash";

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let upstream;
  let raw = {};

  // Retry otomatis jika layanan Gemini sedang sibuk.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      upstream = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
            maxOutputTokens: 900
          }
        })
      });

      raw = await upstream.json().catch(() => ({}));

      if (upstream.ok) break;

      if (![429, 500, 502, 503, 504].includes(upstream.status)) {
        return json({
          error: raw.error?.message || `Gemini error ${upstream.status}`
        }, 502);
      }
    } catch {
      if (attempt === 2) {
        return json({
          error: "Tidak dapat menghubungi layanan Gemini."
        }, 502);
      }
    }

    if (attempt < 2) {
      await new Promise(resolve =>
        setTimeout(resolve, 1000 * (2 ** attempt))
      );
    }
  }

  if (!upstream?.ok) {
    return json({
      error: raw.error?.message || "Gemini sedang sibuk. Coba lagi nanti."
    }, 503);
  }

  const candidate = raw.candidates?.[0];

  const text = candidate?.content?.parts
    ?.filter(part => part.text && !part.thought)
    .map(part => part.text)
    .join("")
    .trim() || "";

  if (!text) {
    return json({
      error: "Gemini tidak menghasilkan teks.",
      reason: candidate?.finishReason || "UNKNOWN"
    }, 502);
  }

  let result;

  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("JSON tidak ditemukan");
    }

    result = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return json({
      error: "Format jawaban Gemini tidak valid.",
      preview: text.slice(0, 300)
    }, 502);
  }

  const title = String(result.title || "").trim().slice(0, 70);

  const keywords = Array.isArray(result.keywords)
    ? [...new Set(
        result.keywords
          .map(item => String(item).trim().toLowerCase())
          .filter(Boolean)
      )].slice(0, 35)
    : [];

  if (!title || keywords.length < 1) {
    return json({
      error: "Hasil AI kosong atau tidak lengkap."
    }, 502);
  }

  return json({
    success: true,
    title,
    keywords,
    model
  });
}



