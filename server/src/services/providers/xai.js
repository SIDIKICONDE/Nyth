module.exports = async function callXAI(
  apiKey,
  messages,
  model = "grok-beta",
  options = {}
) {
  const fetch = (await import("node-fetch")).default;
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2048,
      ...options,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Erreur xAI");
  return { content: data.choices?.[0]?.message?.content, usage: data.usage };
};
