/**
 * Serveur Backend Sécurisé pour Naya
 * Gère l'authentification, les clés API et la sécurité
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const admin = require("firebase-admin");
const crypto = require("crypto");
const compression = require("compression");
const morgan = require("morgan");
const { body, validationResult } = require("express-validator");

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Durcissement Express
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Compression & logs
app.use(compression());
app.use(morgan("combined"));

// ============================================
// CONFIGURATION DE SÉCURITÉ
// ============================================

// Helmet pour les headers de sécurité
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// RATE LIMITING
// ============================================

// Rate limiter global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max
  message: "Trop de requêtes, veuillez réessayer plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentatives max
  skipSuccessfulRequests: true,
});

// Rate limiter pour les API IA
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes par minute
  message: "Limite de requêtes IA atteinte. Veuillez patienter.",
});

app.use("/api/", globalLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/ai/", aiLimiter);

// ============================================
// INITIALISATION FIREBASE ADMIN
// ============================================

// Initialiser Firebase Admin avec un compte de service
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
  const serviceAccount = JSON.parse(
    Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
      "base64"
    ).toString()
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${
      process.env.FIREBASE_PROJECT_ID || "com-naya"
    }.firebaseio.com`,
  });
  console.log("✅ Firebase Admin initialisé avec succès");
} else {
  console.error("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 non configuré");
}

// ============================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================

/**
 * Vérifie le token Firebase et la clé API client
 */
async function authenticateRequest(req, res, next) {
  try {
    // Vérifier la clé API client
    const clientApiKey = req.headers["x-api-key"];
    if (!clientApiKey || clientApiKey !== process.env.CLIENT_API_KEY) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Clé API invalide",
      });
    }

    // Vérifier le token Firebase
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token manquant",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    // Vérifier si l'utilisateur n'est pas banni
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (userDoc.exists && userDoc.data().banned) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Compte suspendu",
      });
    }

    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentification échouée",
    });
  }
}

// ============================================
// GESTION SÉCURISÉE DES CLÉS API
// ============================================

// Stocker les clés API en mémoire (jamais loggées)
const API_KEYS = {
  openai: process.env.OPENAI_API_KEY,
  gemini: process.env.GEMINI_API_KEY,
  mistral: process.env.MISTRAL_API_KEY,
  claude: process.env.CLAUDE_API_KEY,
  cohere: process.env.COHERE_API_KEY,
  perplexity: process.env.PERPLEXITY_API_KEY,
  together: process.env.TOGETHER_API_KEY,
  groq: process.env.GROQ_API_KEY,
  fireworks: process.env.FIREWORKS_API_KEY,
};

/**
 * Chiffre une donnée sensible
 */
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error("ENCRYPTION_KEY manquante");
  }
  const isHex = /^[0-9a-fA-F]{64}$/.test(envKey);
  const keyBuffer = isHex
    ? Buffer.from(envKey, "hex")
    : Buffer.from(envKey, "utf8");
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY invalide: attendez 32 octets (64 hex)");
  }
  return keyBuffer;
}

function encrypt(text) {
  const algorithm = "aes-256-gcm";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    authTag: authTag.toString("hex"),
    iv: iv.toString("hex"),
  };
}

/**
 * Déchiffre une donnée sensible
 */
function decrypt(encryptedData) {
  const algorithm = "aes-256-gcm";
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));

  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// ============================================
// ROUTES API
// ============================================

/**
 * Route de santé
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
 * Route d'authentification - Génère un token de session
 */
app.post("/api/auth/session", authenticateRequest, async (req, res) => {
  try {
    // Créer un token de session personnalisé
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Stocker la session dans Firestore
    await admin.firestore().collection("sessions").doc(sessionToken).set({
      userId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.json({
      success: true,
      sessionToken,
      expiresAt,
    });
  } catch (error) {
    console.error("Erreur création session:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * Route proxy sécurisée pour les appels API IA
 */
app.post(
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
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Validation error", details: errors.array() });
      }
      const { provider, messages, model, options } = req.body;

      // Vérifier le plan de l'utilisateur
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(req.user.uid)
        .get();

      const userPlan = userDoc.data()?.subscription?.plan || "free";

      // Vérifier les limites selon le plan
      const limits = {
        free: { requestsPerDay: 5, providers: ["gemini"] },
        starter: { requestsPerDay: 100, providers: ["gemini", "mistral"] },
        pro: { requestsPerDay: -1, providers: ["all"] },
        enterprise: { requestsPerDay: -1, providers: ["all"] },
      };

      const userLimits = limits[userPlan];

      // Vérifier le provider
      if (
        userLimits.providers[0] !== "all" &&
        !userLimits.providers.includes(provider)
      ) {
        return res.status(403).json({
          error: "Provider non autorisé pour votre plan",
          allowedProviders: userLimits.providers,
        });
      }

      // Vérifier les limites quotidiennes
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

        // Incrémenter l'usage
        await admin
          .firestore()
          .collection("usage")
          .doc(`${req.user.uid}_${today}`)
          .set(
            {
              aiRequests: admin.firestore.FieldValue.increment(1),
              lastRequest: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      }

      // Récupérer la clé API pour le provider
      const apiKey = API_KEYS[provider];
      if (!apiKey) {
        return res.status(500).json({
          error: "Provider non configuré",
        });
      }

      // Faire l'appel à l'API IA (exemple avec OpenAI)
      let response;

      switch (provider) {
        case "openai":
          response = await callOpenAI(apiKey, messages, model, options);
          break;
        case "gemini":
          response = await callGemini(apiKey, messages, model, options);
          break;
        case "mistral":
          response = await callMistral(apiKey, messages, model, options);
          break;
        case "claude":
          response = await callClaude(apiKey, messages, model, options);
          break;
        case "cohere":
          response = await callCohere(apiKey, messages, model, options);
          break;
        case "perplexity":
          response = await callPerplexity(apiKey, messages, model, options);
          break;
        case "together":
          response = await callTogether(apiKey, messages, model, options);
          break;
        case "groq":
          response = await callGroq(apiKey, messages, model, options);
          break;
        case "fireworks":
          response = await callFireworks(apiKey, messages, model, options);
          break;
        default:
          throw new Error("Provider non supporté");
      }

      // Logger l'usage pour analytics
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
      res.status(500).json({
        error: "Erreur lors de l'appel IA",
        message: error.message,
      });
    }
  }
);

/**
 * Route pour récupérer les clés API chiffrées (pour les utilisateurs Pro/Enterprise)
 */
app.get("/api/keys/managed", authenticateRequest, async (req, res) => {
  try {
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();

    const userPlan = userDoc.data()?.subscription?.plan || "free";

    // Seuls les plans Pro et Enterprise ont accès aux clés managées
    if (!["pro", "enterprise"].includes(userPlan)) {
      return res.status(403).json({
        error: "Accès refusé",
        message: "Fonctionnalité réservée aux plans Pro et Enterprise",
      });
    }

    // Retourner des tokens temporaires au lieu des vraies clés
    const tokens = {};
    const allowedProviders =
      userPlan === "enterprise"
        ? Object.keys(API_KEYS)
        : ["openai", "gemini", "mistral", "claude"];

    for (const provider of allowedProviders) {
      if (API_KEYS[provider]) {
        // Créer un token temporaire pour ce provider
        const token = crypto.randomBytes(32).toString("hex");

        // Stocker le token avec expiration (1h)
        await admin
          .firestore()
          .collection("api_tokens")
          .doc(token)
          .set({
            userId: req.user.uid,
            provider,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          });

        tokens[provider] = encrypt(token);
      }
    }

    res.json({
      success: true,
      tokens,
      expiresIn: 3600, // 1 heure
    });
  } catch (error) {
    console.error("Erreur récupération clés:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// FONCTIONS HELPER POUR LES APIS IA
// ============================================

async function callOpenAI(
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

  if (!response.ok) {
    throw new Error(data.error?.message || "Erreur OpenAI");
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}

async function callGemini(
  apiKey,
  messages,
  model = "gemini-pro",
  options = {}
) {
  const fetch = (await import("node-fetch")).default;

  // Convertir les messages au format Gemini
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
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
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Erreur Gemini");
  }

  return {
    content: data.candidates[0].content.parts[0].text,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount,
      completion_tokens: data.usageMetadata?.candidatesTokenCount,
      total_tokens: data.usageMetadata?.totalTokenCount,
    },
  };
}

async function callMistral(
  apiKey,
  messages,
  model = "mistral-medium",
  options = {}
) {
  const fetch = (await import("node-fetch")).default;

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
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

  if (!response.ok) {
    throw new Error(data.error?.message || "Erreur Mistral");
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}

// ============================================
// GESTION DES ERREURS
// ============================================

// Middleware de gestion d'erreur global
app.use((err, req, res, next) => {
  console.error("Erreur:", err);

  // Ne pas exposer les détails des erreurs en production
  const isDev = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: "Erreur serveur",
    message: isDev ? err.message : "Une erreur est survenue",
    ...(isDev && { stack: err.stack }),
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Route non trouvée",
  });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

// Vérifier les variables d'environnement critiques
const requiredEnvVars = [
  "CLIENT_API_KEY",
  "FIREBASE_PROJECT_ID",
  "ENCRYPTION_KEY",
  ...(process.env.NODE_ENV === "development"
    ? []
    : ["FIREBASE_SERVICE_ACCOUNT_KEY_BASE64"]),
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error("❌ Variables d'environnement manquantes:", missingVars);
  process.exit(1);
}

// ENCRYPTION_KEY est obligatoire et validée par getEncryptionKey()

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`
  🚀 Serveur Naya démarré avec succès!
  📍 Port: ${PORT}
  🔒 Mode: ${process.env.NODE_ENV || "development"}
  ✅ Sécurité: Activée
  🛡️ Rate Limiting: Activé
  🔐 Authentification: Firebase Admin
  `);
});

module.exports = app;
