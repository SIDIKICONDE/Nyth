type Provider =
  | "openai"
  | "gemini"
  | "mistral"
  | "cohere"
  | "claude"
  | "perplexity"
  | "together"
  | "groq"
  | "fireworks"
  // Nouveaux providers
  | "azureopenai"
  | "openrouter"
  | "deepinfra"
  | "xai"
  | "deepseek";

type HttpRequest = { url: string; headers: Record<string, string> };

function buildRequest(provider: Provider, key: string): HttpRequest | null {
  switch (provider) {
    case "openai":
      return {
        url: "https://api.openai.com/v1/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "mistral":
      return {
        url: "https://api.mistral.ai/v1/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "cohere":
      return {
        url: "https://api.cohere.ai/v1/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "gemini": {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
        key
      )}`;
      return { url, headers: {} };
    }
    case "claude":
      return {
        url: "https://api.anthropic.com/v1/models",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
      };
    case "perplexity":
      return {
        url: "https://api.perplexity.ai/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "together":
      return {
        url: "https://api.together.xyz/v1/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "groq":
      return {
        url: "https://api.groq.com/openai/v1/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "fireworks":
      return {
        url: "https://api.fireworks.ai/inference/v1/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "openrouter":
      return {
        url: "https://openrouter.ai/api/v1/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "deepinfra":
      return {
        url: "https://api.deepinfra.com/v1/openai/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "xai":
      return {
        url: "https://api.x.ai/v1/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "deepseek":
      return {
        url: "https://api.deepseek.com/models",
        headers: { Authorization: `Bearer ${key}` },
      };
    case "azureopenai":
      // Vérification en ligne non fiable sans endpoint/déploiement Azure.
      // On laisse la vérification se faire via fallback (longueur clé) dans verify().
      return null;
    default:
      return null;
  }
}

async function fetchWithTimeout(
  url: string,
  options: { headers: Record<string, string> },
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: options.headers,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export class KeyVerifierService {
  static async verify(
    provider: Provider,
    key: string,
    timeoutMs: number = 6000
  ): Promise<boolean> {
    // Fallback rapide pour Azure OpenAI (pas d'endpoint global pour vérifier)
    if (provider === "azureopenai") {
      return (key || "").trim().length >= 10;
    }

    const req = buildRequest(provider, key);
    if (!req) {
      // Fallback générique: valider une clé non vide
      return (key || "").trim().length >= 10;
    }
    try {
      const res = await fetchWithTimeout(
        req.url,
        { headers: req.headers },
        timeoutMs
      );
      if (res.ok) return true;
      if (res.status === 401 || res.status === 403) return false;
      return false;
    } catch {
      return false;
    }
  }
}
