const { config } = require("../../config/env");

module.exports = async function callAzureOpenAI(
  apiKey,
  messages,
  modelIgnored,
  options = {},
) {
  const fetch = (await import("node-fetch")).default;
  const { endpoint, deployment, apiVersion } = config.AZURE_OPENAI;
  if (!endpoint || !deployment) throw new Error("Azure OpenAI mal configuré");

  const response = await fetch(
    `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        ...options,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || "Erreur Azure OpenAI");
  return { content: data.choices?.[0]?.message?.content, usage: data.usage };
};
