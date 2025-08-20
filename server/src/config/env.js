const dotenv = require("dotenv");

dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 3000,
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  CLIENT_API_KEY: process.env.CLIENT_API_KEY,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  API_KEYS: {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    claude: process.env.CLAUDE_API_KEY,
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
  },
  AZURE_OPENAI: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
  },
};

function assertRequiredEnv() {
  const required = [
    "CLIENT_API_KEY",
    "FIREBASE_PROJECT_ID",
    "ENCRYPTION_KEY",
    ...(config.NODE_ENV === "development"
      ? []
      : ["FIREBASE_SERVICE_ACCOUNT_KEY_BASE64"]),
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      "Variables d'environnement manquantes: " + missing.join(", "),
    );
  }
}

module.exports = { config, assertRequiredEnv };
