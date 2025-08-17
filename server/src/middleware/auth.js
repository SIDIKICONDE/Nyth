const admin = require("firebase-admin");
const { config } = require("../config/env");

async function authenticateRequest(req, res, next) {
  try {
    const clientApiKey = req.headers["x-api-key"];
    if (!clientApiKey || clientApiKey !== config.CLIENT_API_KEY) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Clé API invalide" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Token manquant" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    if (userDoc.exists && userDoc.data().banned) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Compte suspendu" });
    }

    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Authentification échouée" });
  }
}

module.exports = { authenticateRequest };
