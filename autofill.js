module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const need = process.env.AUTOFILL_CODE;
  if (need && req.headers["x-code"] !== need) return res.status(401).json({ error: "bad code" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "missing key" });
  const prompt = String((req.body && req.body.prompt) || "").slice(0, 14000);
  if (!prompt) return res.status(400).json({ error: "empty" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.AUTOFILL_MODEL || "claude-sonnet-5-5",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || "upstream error" });
    const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: "request failed" });
  }
};
