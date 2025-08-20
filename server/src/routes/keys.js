const express = require("express");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { authenticateRequest } = require("../middleware/auth");
const { encrypt } = require("../services/crypto");
const { config } = require("../config/env");

const router = express.Router();

router.get("/api/keys/managed", authenticateRequest, async (req, res) => {
  try {
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();
    const userPlan = userDoc.data()?.subscription?.plan || "free";
    if (!["pro", "enterprise"].includes(userPlan)) {
      return res.status(403).json({
        error: "Accès refusé",
        message: "Fonctionnalité réservée aux plans Pro et Enterprise",
      });
    }
    const tokens = {};
    const allowedProviders =
      userPlan === "enterprise"
        ? Object.keys(config.API_KEYS)
        : [
          "openai",
          "gemini",
          "mistral",
          "claude",
          "cohere",
          "perplexity",
          "together",
          "groq",
          "fireworks",
        ];
    for (const provider of allowedProviders) {
      if (config.API_KEYS[provider]) {
        const token = crypto.randomBytes(32).toString("hex");
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
    res.json({ success: true, tokens, expiresIn: 3600 });
  } catch (error) {
    console.error("Erreur récupération clés:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
