module.exports = async function callDeepInfra(
  apiKey,
  messages,
  model = "meta-llama/Meta-Llama-3-70B-Instruct",
  options = {},
) {
  const fetch = (await import("node-fetch")).default;
  const response = await fetch(
    "https://api.deepinfra.com/v1/openai/chat/completions",
    {
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
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Erreur DeepInfra");
  return { content: data.choices?.[0]?.message?.content, usage: data.usage };
};
