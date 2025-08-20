/**
 * Utilitaire pour vérifier la configuration Firebase
 */

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from "@env";

interface FirebaseConfigCheck {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
  values: Record<string, string | undefined>;
}

export const verifyFirebaseConfig = (): FirebaseConfigCheck => {
  const values: Record<string, string | undefined> = {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
  };

  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Vérifier chaque variable
  Object.entries(values).forEach(([varName, value]) => {
    if (!value || value === "") {
      missingVars.push(varName);
    }
  });

  // Vérifications spécifiques
  if (FIREBASE_STORAGE_BUCKET === "undefined") {
    warnings.push(
      'FIREBASE_STORAGE_BUCKET est "undefined" (string) au lieu d\'être undefined'
    );
  }

  if (
    FIREBASE_STORAGE_BUCKET &&
    !FIREBASE_STORAGE_BUCKET.includes(".firebasestorage.app")
  ) {
    warnings.push(
      "FIREBASE_STORAGE_BUCKET ne semble pas être un bucket Firebase valide"
    );
  }

  const isValid = missingVars.length === 0;

  return {
    isValid,
    missingVars,
    warnings,
    values,
  };
};

export const logFirebaseConfigStatus = () => {
  const check = verifyFirebaseConfig();

  if (check.isValid) {} else {}

  if (check.warnings.length > 0) {
    check.warnings.forEach((warning) => void 0);
  }

  Object.entries(check.values).forEach(([key, value]) => {
    const displayValue = value
      ? value.length > 20
        ? `${value.substring(0, 20)}...`
        : value
      : "MANQUANT";
  });

  // Instructions si configuration incomplète
  if (!check.isValid) {}

  return check;
};

// Diagnostic spécifique pour Firebase Storage
export const diagnoseStorageIssue = () => {
  const storageBucket = FIREBASE_STORAGE_BUCKET;

  if (!storageBucket) {
    return false;
  } else if (storageBucket === "undefined") {
    return false;
  } else {
    return true;
  }
};

export default verifyFirebaseConfig;
