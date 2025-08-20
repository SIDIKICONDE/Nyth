import * as functions from "firebase-functions";
import fetch from "node-fetch";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const openaiProxy = functions.https.onRequest(async (req, res) => {
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
    // Vérifier le token Firebase côté client (Authorization: Bearer <idToken>)
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
    } catch (e) {
      res.status(401).send({ error: "Invalid Firebase ID token" });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).send({ error: "API key not configured" });
      return;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
});
