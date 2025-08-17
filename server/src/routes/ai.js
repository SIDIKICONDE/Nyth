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
            { merge: true }
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
  }
);

module.exports = router;
