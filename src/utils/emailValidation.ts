/**
 * Validation avancée d'email pour détecter les faux emails
 */

// Liste des domaines temporaires/jetables connus
const DISPOSABLE_DOMAINS = [
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.org",
  "yopmail.com",
  "temp-mail.org",
  "throwaway.email",
  "getnada.com",
  "maildrop.cc",
  "sharklasers.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.de",
  "grr.la",
  "guerrillamail.net",
  "guerrillamail.org",
  "spam4.me",
  "dispostable.com",
  "trashmail.com",
  "mytrashmail.com",
  "0-mail.com",
  "emailondeck.com",
  "tempail.com",
  "temp-mail.io",
  "mohmal.com",
  "fakeinbox.com",
  "mailnesia.com",
  "tempinbox.com",
];

// Liste des domaines légitimes populaires
const LEGITIMATE_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "protonmail.com",
  "orange.fr",
  "free.fr",
  "laposte.net",
  "sfr.fr",
  "wanadoo.fr",
  "bbox.fr",
  "live.com",
  "msn.com",
  "aol.com",
];

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  suggestions?: string[];
}

/**
 * Validation basique du format email
 */
const isValidEmailFormat = (email: string): boolean => {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Vérifie si le domaine est dans la liste des domaines jetables
 */
const isDisposableDomain = (domain: string): boolean => {
  return DISPOSABLE_DOMAINS.includes(domain.toLowerCase());
};

/**
 * Vérifie si le domaine est légitime
 */
const isLegitmateDomain = (domain: string): boolean => {
  return LEGITIMATE_DOMAINS.includes(domain.toLowerCase());
};

/**
 * Détecte les patterns suspects dans l'email
 */
const hasSuspiciousPatterns = (
  email: string
): { suspicious: boolean; reasons: string[] } => {
  const reasons: string[] = [];

  // Trop de chiffres consécutifs
  if (/\d{8,}/.test(email)) {
    reasons.push("Trop de chiffres consécutifs");
  }

  // Caractères répétitifs
  if (/(.)\1{4,}/.test(email)) {
    reasons.push("Caractères répétitifs suspects");
  }

  // Patterns de spam typiques
  const spamPatterns = [
    /test\d+@/i,
    /fake\d*@/i,
    /spam\d*@/i,
    /temp\d*@/i,
    /dummy\d*@/i,
    /noreply\d*@/i,
    /nomail\d*@/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(email)) {
      reasons.push("Pattern d'email suspect détecté");
      break;
    }
  }

  // Domaine trop court ou suspect
  const domain = email.split("@")[1];
  if (domain && domain.length < 4) {
    reasons.push("Domaine trop court");
  }

  // Extension de domaine suspecte
  const suspiciousExtensions = [".tk", ".ml", ".ga", ".cf"];
  if (domain && suspiciousExtensions.some((ext) => domain.endsWith(ext))) {
    reasons.push("Extension de domaine suspecte");
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
};

/**
 * Suggère des corrections pour les fautes de frappe communes
 */
const getSuggestions = (email: string): string[] => {
  const suggestions: string[] = [];
  const [localPart, domain] = email.split("@");

  if (!domain) return suggestions;

  // Corrections communes pour les domaines populaires
  const corrections: { [key: string]: string } = {
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gmail.co": "gmail.com",
    "yahooo.com": "yahoo.com",
    "yahoo.co": "yahoo.com",
    "outlok.com": "outlook.com",
    "hotmial.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
  };

  const correctedDomain = corrections[domain.toLowerCase()];
  if (correctedDomain) {
    suggestions.push(`${localPart}@${correctedDomain}`);
  }

  return suggestions;
};

/**
 * Validation complète d'un email
 */
export const validateEmail = (email: string): EmailValidationResult => {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: "L'adresse email est requise",
    };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Vérification du format basique
  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      isValid: false,
      error: "Format d'email invalide",
      suggestions: getSuggestions(trimmedEmail),
    };
  }

  const domain = trimmedEmail.split("@")[1];

  // Vérification des domaines jetables
  if (isDisposableDomain(domain)) {
    return {
      isValid: false,
      error: "Les adresses email temporaires ne sont pas autorisées",
    };
  }

  // Vérification des patterns suspects
  const suspiciousCheck = hasSuspiciousPatterns(trimmedEmail);
  if (suspiciousCheck.suspicious) {
    return {
      isValid: false,
      error: `Email suspect détecté: ${suspiciousCheck.reasons.join(", ")}`,
    };
  }

  // Email valide avec avertissement si domaine peu commun
  if (!isLegitmateDomain(domain)) {
    return {
      isValid: true,
      warning: "Domaine email peu commun. Vérifiez l'orthographe.",
      suggestions: getSuggestions(trimmedEmail),
    };
  }

  return {
    isValid: true,
  };
};

/**
 * Validation rapide pour les cas simples
 */
export const isValidEmail = (email: string): boolean => {
  const result = validateEmail(email);
  return result.isValid;
};

/**
 * Obtient uniquement les suggestions de correction
 */
export const getEmailSuggestions = (email: string): string[] => {
  return getSuggestions(email);
};
