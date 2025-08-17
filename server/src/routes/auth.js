const express = require("express");
const crypto = require("crypto");
const admin = require("firebase-admin");
const { authenticateRequest } = require("../middleware/auth");

const router = express.Router();

router.post("/api/auth/session", authenticateRequest, async (req, res) => {
  try {
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await admin.firestore().collection("sessions").doc(sessionToken).set({
      userId: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
    res.json({ success: true, sessionToken, expiresAt });
  } catch (error) {
    console.error("Erreur création session:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
