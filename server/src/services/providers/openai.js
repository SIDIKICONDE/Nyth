module.exports = async function callOpenAI(
  apiKey,
  messages,
  model = "gpt-4-turbo-preview",
  options = {}
) {
  const fetch = (await import("node-fetch")).default;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
  if (!response.ok) throw new Error(data.error?.message || "Erreur OpenAI");
  return { content: data.choices[0].message.content, usage: data.usage };
};
