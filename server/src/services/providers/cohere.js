module.exports = async function callCohere(
  apiKey,
  messages,
  model = "command-r-plus",
  options = {}
) {
  const fetch = (await import("node-fetch")).default;
  const response = await fetch("https://api.cohere.com/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      message: messages[messages.length - 1]?.content || "",
      chat_history: messages
        .filter((m) => m.role !== "system")
        .slice(0, -1)
        .map((m) => ({
          role: m.role === "assistant" ? "CHATBOT" : "USER",
          message: m.content,
        })),
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Erreur Cohere");
  return { content: data.text, usage: data.meta?.tokens };
};
