/**
 * Point d'entrée serveur (refactorisé par modules)
 */

const express = require("express");
const admin = require("firebase-admin");
const { config, assertRequiredEnv } = require("./src/config/env");
const { initFirebase } = require("./src/init/firebase");
const { applySecurity } = require("./src/middleware/security");

// Routes
const healthRoutes = require("./src/routes/health");
const authRoutes = require("./src/routes/auth");
const aiRoutes = require("./src/routes/ai");
const keysRoutes = require("./src/routes/keys");

// Vérifier la configuration d'environnement
try {
  assertRequiredEnv();
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
}

// Initialiser Firebase Admin
initFirebase();

const app = express();

// Sécurité, CORS, rate limiting, logs
applySecurity(app);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Monter les routes
app.use(healthRoutes);
app.use(authRoutes);
app.use(aiRoutes);
app.use(keysRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error("Erreur:", err);
  const isDev = config.NODE_ENV === "development";
  res.status(err.status || 500).json({
    error: "Erreur serveur",
    message: isDev ? err.message : "Une erreur est survenue",
    ...(isDev && { stack: err.stack }),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", message: "Route non trouvée" });
});

// Démarrer le serveur
app.listen(config.PORT, () => {
  console.log(
    `\n  🚀 Serveur Naya démarré avec succès!\n  📍 Port: ${config.PORT}\n  🔒 Mode: ${config.NODE_ENV}\n  ✅ Sécurité: Activée\n  🛡️ Rate Limiting: Activé\n  🔐 Authentification: Firebase Admin\n  `
  );
});

module.exports = app;
