const express = require("express");
const admin = require("firebase-admin");
const { authenticateRequest } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const { config } = require("../config/env");
const { providers } = require("../services/providers");

const router = express.Router();

router.post(
  "/api/ai/chat",
  authenticateRequest,
  [
    body("provider").isString().withMessage("provider requis"),
    body("messages").isArray({ min: 1 }).withMessage("messages requis"),
    body("messages.*.role").isString().withMessage("role requis"),
    body("messages.*.content").isString().withMessage("content requis"),
    body("model").optional().isString(),
    body("options").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res
          .status(400)
          .json({ error: "Validation error", details: errors.array() });
      const { provider, messages, model, options } = req.body;

      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(req.user.uid)
        .get();
      const userPlan = userDoc.data()?.subscription?.plan || "free";

      const limits = {
        free: { requestsPerDay: 5, providers: ["gemini"] },
        starter: { requestsPerDay: 100, providers: ["gemini", "mistral"] },
        pro: { requestsPerDay: -1, providers: ["all"] },
        enterprise: { requestsPerDay: -1, providers: ["all"] },
      };
      const userLimits = limits[userPlan];
      if (
        userLimits.providers[0] !== "all" &&
        !userLimits.providers.includes(provider)
      ) {
        return res.status(403).json({
          error: "Provider non autorisé pour votre plan",
          allowedProviders: userLimits.providers,
        });
      }

      if (userLimits.requestsPerDay > 0) {
        const today = new Date().toISOString().split("T")[0];
        const usageDoc = await admin
          .firestore()
          .collection("usage")
          .doc(`${req.user.uid}_${today}`)
          .get();
        const currentUsage = usageDoc.data()?.aiRequests || 0;
        if (currentUsage >= userLimits.requestsPerDay) {
          return res.status(429).json({
            error: "Limite quotidienne atteinte",
            limit: userLimits.requestsPerDay,
            resetAt: new Date(new Date().setHours(24, 0, 0, 0)),
          });
        }
        await admin
          .firestore()
          .collection("usage")
          .doc(`${req.user.uid}_${today}`)
          .set(
            {
              aiRequests: admin.firestore.FieldValue.increment(1),
              lastRequest: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      }

      const apiKey = config.API_KEYS[provider];
      if (!apiKey)
        return res.status(500).json({ error: "Provider non configuré" });

      const fn = providers[provider];
      if (!fn) throw new Error("Provider non supporté");
      const response = await fn(apiKey, messages, model, options);

      await admin
        .firestore()
        .collection("analytics")
        .add({
          userId: req.user.uid,
          provider,
          model,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          tokensUsed: response.usage?.total_tokens || 0,
        });

      res.json({
        success: true,
        response: response.content,
        usage: response.usage,
      });
    } catch (error) {
      console.error("Erreur appel IA:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de l'appel IA", message: error.message });
    }
  },
);

// Routes proxy pour compatibilité avec l'ancien système
router.post("/openaiProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Erreur proxy OpenAI:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/geminiProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const { model = "gemini-2.0-flash", messages, ...options } = req.body;
    
    // Convertir le format des messages pour Gemini
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }],
    }));

    const fetch = (await import("node-fetch")).default;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...options,
        }),
      },
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Erreur proxy Gemini:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/mistralProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const {
      prompt,
      model = "mistral-small-latest",
      temperature = 0.1,
      max_tokens = 500,
      response_format,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const payload = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: Math.max(0.1, Math.min(1.0, temperature)),
      max_tokens: Math.max(50, Math.min(2000, max_tokens)),
    };

    if (response_format?.type === "json_object") {
      payload.response_format = response_format;
    }

    const fetch = (await import("node-fetch")).default;
    const { AbortController } = globalThis;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Mistral API error: ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();
    
    // Validation et nettoyage pour les réponses JSON
    if (response_format?.type === "json_object" && data.choices?.[0]?.message?.content) {
      let content = data.choices[0].message.content;
      
      // Nettoyer le JSON si nécessaire (enlever les blocs markdown)
      const sanitized = content.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/, "$1");
      
      try {
        const parsed = JSON.parse(sanitized);
        // Valider et corriger la structure si nécessaire
        if (!parsed.type || !parsed.importance || !parsed.reformulated) {
          parsed.type = parsed.type || "context";
          parsed.importance = parsed.importance || "medium";
          parsed.reformulated = parsed.reformulated || prompt;
          parsed.confidence = parsed.confidence || 0.8;
          parsed.language = parsed.language || "fr";
        }
        content = JSON.stringify(parsed);
      } catch (jsonError) {
        // Fallback JSON valide
        content = JSON.stringify({
          type: "context",
          importance: "medium",
          reformulated: `Analyse du message: ${prompt.substring(0, 100)}...`,
          confidence: 0.8,
          language: "fr",
        });
      }
      
      data.choices[0].message.content = content;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Erreur proxy Mistral:", error);
    
    // Fallback pour les requêtes JSON
    if (req.body.response_format?.type === "json_object") {
      res.status(200).json({
        choices: [{
          message: {
            content: JSON.stringify({
              type: "context",
              importance: "medium",
              reformulated: "Analyse du message utilisateur",
              confidence: 0.8,
              language: "fr",
            }),
          },
        }],
      });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.post("/claudeProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const { messages, model = "claude-3-sonnet-20240229", ...options } = req.body;

    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.max_tokens || 1000,
        ...options,
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Erreur proxy Claude:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cohereProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const { model = "command", prompt, temperature = 0.7 } = req.body;

    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        temperature,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Erreur proxy Cohere:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/perplexityProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Erreur proxy Perplexity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/togetherProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Erreur proxy Together:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groqProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Erreur proxy Groq:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/fireworksProxy", authenticateRequest, async (req, res) => {
  try {
    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const fetch = (await import("node-fetch")).default;
    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Erreur proxy Fireworks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route proxy générique pour tous les providers
router.post("/api/ai/proxy/:provider", authenticateRequest, async (req, res) => {
  try {
    const { provider } = req.params;
    const providerFunc = providers[provider.toLowerCase()];
    
    if (!providerFunc) {
      return res.status(400).json({ error: `Provider ${provider} not supported` });
    }

    // Récupérer la clé API appropriée
    const apiKeyMap = {
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      claude: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
      cohere: process.env.COHERE_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY,
      together: process.env.TOGETHER_API_KEY,
      groq: process.env.GROQ_API_KEY,
      fireworks: process.env.FIREWORKS_API_KEY,
      azureopenai: process.env.AZURE_OPENAI_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      deepinfra: process.env.DEEPINFRA_API_KEY,
      xai: process.env.XAI_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
    };

    const apiKey = apiKeyMap[provider.toLowerCase()];
    if (!apiKey) {
      return res.status(500).json({ error: `API key not configured for ${provider}` });
    }

    const { messages, model, options } = req.body;
    const response = await providerFunc(apiKey, messages, model, options);
    
    res.json({
      success: true,
      response: response.content,
      usage: response.usage,
      provider,
    });
  } catch (error) {
    console.error(`Erreur proxy ${req.params.provider}:`, error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message,
      provider: req.params.provider,
    });
  }
});

module.exports = router;
