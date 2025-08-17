module.exports = async function callPerplexity(
  apiKey,
  messages,
  model = "llama-3-70b-instruct",
  options = {}
) {
  const fetch = (await import("node-fetch")).default;
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
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
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Erreur Perplexity");
  return { content: data.choices?.[0]?.message?.content, usage: data.usage };
};
