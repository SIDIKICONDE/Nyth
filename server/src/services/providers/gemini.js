module.exports = async function callGemini(
  apiKey,
  messages,
  model = "gemini-pro",
  options = {},
) {
  const fetch = (await import("node-fetch")).default;
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 2048,
        },
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Erreur Gemini");
  return {
    content: data.candidates[0].content.parts[0].text,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount,
      completion_tokens: data.usageMetadata?.candidatesTokenCount,
      total_tokens: data.usageMetadata?.totalTokenCount,
    },
  };
};
