
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
    return json({ error: "Secret GEMINI_API_KEY belum dipasang." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body JSON tidak valid." }, 400);
  }

  const prompt = String(body.prompt || "").trim();
  const quantity = Math.min(15, Math.max(1, Number(body.quantity) || 1));

  if (prompt.length < 8) {
    return json({ error: "Tema minimal 8 karakter." }, 400);
  }

  return json({
    success: false,
    status: "provider_required",
    message:
      "Endpoint sudah siap menerima tema. Integrasi generator gambar native 4 MP belum dipasang."
  }, 501);
}
