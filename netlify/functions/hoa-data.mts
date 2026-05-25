export default async (req: Request) => {
  const scriptUrl = Netlify.env.get("GOOGLE_APPS_SCRIPT_URL");
  const token = Netlify.env.get("BWC_API_TOKEN");

  if (!scriptUrl || !token) {
    return Response.json({ ok: false, error: "Google Sheets backend is not configured." }, { status: 503 });
  }

  const payload = req.method === "GET"
    ? { action: "get" }
    : await req.json().catch(() => ({}));

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, token })
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") || "application/json" }
  });
};

export const config = {
  path: "/api/hoa-data"
};
