const admin = require("firebase-admin");
const { config } = require("../config/env");

function initFirebase() {
  if (!config.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    console.error("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 non configuré");
    return;
  }
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(
        config.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
        "base64",
      ).toString(),
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${config.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
    console.log("✅ Firebase Admin initialisé avec succès");
  } catch (e) {
    console.error("❌ Erreur d'initialisation Firebase:", e.message);
    throw e;
  }
}

module.exports = { initFirebase };
