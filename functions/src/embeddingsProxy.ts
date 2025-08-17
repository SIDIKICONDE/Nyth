import * as functions from "firebase-functions";
import fetch from "node-fetch";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

type Provider =
  | "openai"
  | "mistral"
  | "cohere"
  | "gemini"
  | "together"
  | "fireworks"
  | "groq"
  | "claude"
  | "perplexity";

type EmbeddingsRequest = {
  input: string | string[];
  model?: string;
  provider?: Provider;
};

type OpenAIEmbeddingsResponse = {
  data: { embedding: number[]; index: number }[];
};

export const embeddingsProxy = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Firebase-AppCheck, X-Firebase-Auth"
  );

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : undefined;
    if (!token) {
      res.status(401).send({ error: "Missing Firebase ID token" });
      return;
    }
    try {
      await admin.auth().verifyIdToken(token);
    } catch {
      res.status(401).send({ error: "Invalid Firebase ID token" });
      return;
    }

    const body: EmbeddingsRequest = req.body || {};
    const input = body.input;
    if (!input || (Array.isArray(input) && input.length === 0)) {
      res.status(400).send({ error: "input is required" });
      return;
    }

    const provider = body.provider || selectProvider();
    if (!provider) {
      res.status(500).send({ error: "No provider configured" });
      return;
    }

    if (provider === "openai") {
      const model = body.model || "text-embedding-3-small";
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        res.status(500).send({ error: "Missing OPENAI_API_KEY" });
        return;
      }
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, input }),
      });
      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).send({ error: text });
        return;
      }
      const data: OpenAIEmbeddingsResponse =
        (await response.json()) as OpenAIEmbeddingsResponse;
      const embeddings = data.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
      res.status(200).send({ embeddings, model, provider });
      return;
    }

    if (provider === "cohere") {
      const model = body.model || "embed-english-v3.0";
      const apiKey = process.env.COHERE_API_KEY;
      if (!apiKey) {
        res.status(500).send({ error: "Missing COHERE_API_KEY" });
        return;
      }
      const response = await fetch("https://api.cohere.ai/v1/embed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          texts: Array.isArray(input) ? input : [input],
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).send({ error: text });
        return;
      }
      const data = (await response.json()) as { embeddings: number[][] };
      res.status(200).send({ embeddings: data.embeddings, model, provider });
      return;
    }

    if (provider === "gemini") {
      const model = body.model || "models/text-embedding-004";
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).send({ error: "Missing GEMINI_API_KEY" });
        return;
      }
      const texts = Array.isArray(input) ? input : [input];
      const out: number[][] = [];
      for (const text of texts) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${model}:embedContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              content: { parts: [{ text }] },
            }),
          }
        );
        if (!response.ok) {
          const msg = await response.text();
          res.status(response.status).send({ error: msg });
          return;
        }
        const data = (await response.json()) as {
          embedding?: { values?: number[] };
        };
        out.push(data.embedding?.values || []);
      }
      res.status(200).send({ embeddings: out, model, provider });
      return;
    }

    if (provider === "mistral") {
      const model = body.model || "mistral-embed";
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) {
        res.status(500).send({ error: "Missing MISTRAL_API_KEY" });
        return;
      }
      const response = await fetch("https://api.mistral.ai/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, input }),
      });
      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).send({ error: text });
        return;
      }
      const data: OpenAIEmbeddingsResponse =
        (await response.json()) as OpenAIEmbeddingsResponse;
      const embeddings = data.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
      res.status(200).send({ embeddings, model, provider });
      return;
    }

    if (provider === "together") {
      const model = body.model || "togethercomputer/m2-bert-80M-8k-retrieval";
      const apiKey = process.env.TOGETHER_API_KEY;
      if (!apiKey) {
        res.status(500).send({ error: "Missing TOGETHER_API_KEY" });
        return;
      }
      const response = await fetch("https://api.together.xyz/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, input }),
      });
      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).send({ error: text });
        return;
      }
      const data: OpenAIEmbeddingsResponse =
        (await response.json()) as OpenAIEmbeddingsResponse;
      const embeddings = data.data
        ? data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
        : (data as unknown as { embeddings: number[][] }).embeddings;
      res.status(200).send({ embeddings, model, provider });
      return;
    }

    if (provider === "fireworks") {
      const model = body.model || "nomic-ai/nomic-embed-text-v1.5";
      const apiKey = process.env.FIREWORKS_API_KEY;
      if (!apiKey) {
        res.status(500).send({ error: "Missing FIREWORKS_API_KEY" });
        return;
      }
      const response = await fetch(
        "https://api.fireworks.ai/inference/v1/embeddings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, input }),
        }
      );
      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).send({ error: text });
        return;
      }
      const data: OpenAIEmbeddingsResponse =
        (await response.json()) as OpenAIEmbeddingsResponse;
      const embeddings = data.data
        ? data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
        : (data as unknown as { embeddings: number[][] }).embeddings;
      res.status(200).send({ embeddings, model, provider });
      return;
    }

    if (provider === "groq") {
      const model = body.model || "text-embedding-3-small";
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        res.status(500).send({ error: "Missing GROQ_API_KEY" });
        return;
      }
      const response = await fetch(
        "https://api.groq.com/openai/v1/embeddings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, input }),
        }
      );
      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).send({ error: text });
        return;
      }
      const data: OpenAIEmbeddingsResponse =
        (await response.json()) as OpenAIEmbeddingsResponse;
      const embeddings = data.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
      res.status(200).send({ embeddings, model, provider });
      return;
    }

    // Claude & Perplexity n'ont pas d'endpoint d'embeddings public.
    if (provider === "claude") {
      res.status(404).send({ error: "Claude n'expose pas d'API d'embeddings" });
      return;
    }

    if (provider === "perplexity") {
      res
        .status(404)
        .send({ error: "Perplexity n'expose pas d'API d'embeddings" });
      return;
    }

    res.status(400).send({ error: "Unsupported provider" });
  } catch (e) {
    res.status(500).send({ error: "Unhandled error" });
  }
});

function selectProvider(): Provider | null {
  const order: Provider[] = [
    "openai",
    "gemini",
    "mistral",
    "together",
    "cohere",
    "fireworks",
    "groq",
    "claude",
    "perplexity",
  ];
  for (const p of order) {
    if (
      (p === "openai" && !!process.env.OPENAI_API_KEY) ||
      (p === "mistral" && !!process.env.MISTRAL_API_KEY) ||
      (p === "cohere" && !!process.env.COHERE_API_KEY) ||
      (p === "gemini" && !!process.env.GEMINI_API_KEY) ||
      (p === "together" && !!process.env.TOGETHER_API_KEY) ||
      (p === "fireworks" && !!process.env.FIREWORKS_API_KEY) ||
      (p === "groq" && !!process.env.GROQ_API_KEY) ||
      (p === "claude" && !!process.env.CLAUDE_API_KEY) ||
      (p === "perplexity" && !!process.env.PERPLEXITY_API_KEY)
    ) {
      return p;
    }
  }
  return null;
}
