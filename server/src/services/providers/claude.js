module.exports = async function callClaude(
  apiKey,
  messages,
  model = "claude-3-opus-20240229",
  options = {},
) {
  const fetch = (await import("node-fetch")).default;
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");
  const anthropicMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    }));
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemParts || undefined,
      messages: anthropicMessages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Erreur Claude");
  const content =
    Array.isArray(data.content) && data.content[0]?.text
      ? data.content[0].text
      : "";
  return { content, usage: data.usage };
};
