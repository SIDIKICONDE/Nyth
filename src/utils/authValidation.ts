/**
 * Utilitaires de validation pour l'authentification
 * Fournit des méthodes de validation robustes pour les emails et mots de passe
 */

import { createLogger } from "./optimizedLogger";

const logger = createLogger("AuthValidation");

// Configuration de validation
export interface ValidationConfig {
  minPasswordLength: number;
  maxPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  allowedEmailDomains?: string[];
  blockedEmailDomains?: string[];
}

// Configuration par défaut
const DEFAULT_CONFIG: ValidationConfig = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  allowedEmailDomains: undefined,
  blockedEmailDomains: [
    "tempmail.com",
    "throwaway.email",
    "guerrillamail.com",
    "mailinator.com",
    "10minutemail.com",
  ],
};

// Résultat de validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  suggestions?: string[];
  score?: number;
}

// Domaines email courants pour les suggestions
const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "protonmail.com",
  "yahoo.fr",
  "orange.fr",
  "wanadoo.fr",
  "free.fr",
  "sfr.fr",
  "laposte.net",
];

// Caractères spéciaux autorisés dans les mots de passe
const SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * Classe de validation pour l'authentification
 */
export class AuthValidator {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Valide une adresse email
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Vérification de base
    if (!email) {
      errors.push("L'adresse email est requise");
      return { isValid: false, errors };
    }

    // Normaliser l'email
    const normalizedEmail = email.toLowerCase().trim();

    // Regex pour validation email (RFC 5322 simplifiée)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(normalizedEmail)) {
      errors.push("Le format de l'adresse email n'est pas valide");

      // Suggestions pour les erreurs courantes
      if (!normalizedEmail.includes("@")) {
        suggestions.push("L'adresse email doit contenir le symbole @");
      } else {
        const [localPart, domain] = normalizedEmail.split("@");

        if (!domain || !domain.includes(".")) {
          suggestions.push("Le domaine de l'email doit contenir un point (.)");
        }

        // Vérifier les fautes de frappe courantes dans les domaines
        const similarDomains = this.findSimilarDomains(domain);
        if (similarDomains.length > 0) {
          suggestions.push(
            `Vouliez-vous dire : ${localPart}@${similarDomains[0]} ?`
          );
        }
      }
    }

    // Vérifier la longueur
    if (normalizedEmail.length > 254) {
      errors.push("L'adresse email est trop longue (maximum 254 caractères)");
    }

    // Vérifier les domaines bloqués
    if (this.config.blockedEmailDomains) {
      const domain = normalizedEmail.split("@")[1];
      if (domain && this.config.blockedEmailDomains.includes(domain)) {
        errors.push(
          "Ce domaine email n'est pas autorisé (email temporaire détecté)"
        );
      }
    }

    // Vérifier les domaines autorisés
    if (
      this.config.allowedEmailDomains &&
      this.config.allowedEmailDomains.length > 0
    ) {
      const domain = normalizedEmail.split("@")[1];
      if (domain && !this.config.allowedEmailDomains.includes(domain)) {
        errors.push(
          `Seuls les emails des domaines suivants sont autorisés : ${this.config.allowedEmailDomains.join(
            ", "
          )}`
        );
      }
    }

    // Vérifications supplémentaires
    const [localPart] = normalizedEmail.split("@");

    // Vérifier les points consécutifs
    if (localPart.includes("..")) {
      warnings.push("L'adresse email contient des points consécutifs");
    }

    // Vérifier si commence ou termine par un point
    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      warnings.push(
        "L'adresse email ne doit pas commencer ou terminer par un point"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * Valide un mot de passe
   */
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Vérification de base
    if (!password) {
      errors.push("Le mot de passe est requis");
      return { isValid: false, errors, score: 0 };
    }

    // Vérifier la longueur minimale
    if (password.length < this.config.minPasswordLength) {
      errors.push(
        `Le mot de passe doit contenir au moins ${this.config.minPasswordLength} caractères`
      );
    } else {
      score += 20;
    }

    // Vérifier la longueur maximale
    if (password.length > this.config.maxPasswordLength) {
      errors.push(
        `Le mot de passe ne doit pas dépasser ${this.config.maxPasswordLength} caractères`
      );
    }

    // Vérifier les majuscules
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push(
        "Le mot de passe doit contenir au moins une lettre majuscule"
      );
    } else if (/[A-Z]/.test(password)) {
      score += 20;
    }

    // Vérifier les minuscules
    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push(
        "Le mot de passe doit contenir au moins une lettre minuscule"
      );
    } else if (/[a-z]/.test(password)) {
      score += 20;
    }

    // Vérifier les chiffres
    if (this.config.requireNumbers && !/[0-9]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins un chiffre");
    } else if (/[0-9]/.test(password)) {
      score += 20;
    }

    // Vérifier les caractères spéciaux
    const specialCharsRegex = new RegExp(
      `[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}]`
    );
    if (this.config.requireSpecialChars && !specialCharsRegex.test(password)) {
      errors.push(
        "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)"
      );
    } else if (specialCharsRegex.test(password)) {
      score += 20;
    }

    // Vérifications de sécurité supplémentaires

    // Vérifier les séquences répétitives
    if (/(.)\1{2,}/.test(password)) {
      warnings.push("Le mot de passe contient des caractères répétitifs");
      score = Math.max(0, score - 10);
    }

    // Vérifier les séquences communes
    const commonSequences = [
      "123",
      "abc",
      "qwerty",
      "azerty",
      "password",
      "admin",
    ];
    const lowerPassword = password.toLowerCase();
    for (const sequence of commonSequences) {
      if (lowerPassword.includes(sequence)) {
        warnings.push(
          `Le mot de passe contient une séquence commune : "${sequence}"`
        );
        score = Math.max(0, score - 15);
        break;
      }
    }

    // Vérifier si le mot de passe est dans une liste de mots de passe courants
    const commonPasswords = [
      "password123",
      "123456789",
      "12345678",
      "qwerty123",
      "azerty123",
      "admin123",
      "letmein",
      "welcome123",
      "monkey123",
      "dragon123",
    ];

    if (commonPasswords.includes(lowerPassword)) {
      errors.push("Ce mot de passe est trop commun et facilement devinable");
      score = 0;
    }

    // Bonus pour la longueur
    if (password.length >= 12) {
      score = Math.min(100, score + 10);
    }
    if (password.length >= 16) {
      score = Math.min(100, score + 10);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      score: Math.min(100, Math.max(0, score)),
    };
  }

  /**
   * Valide la confirmation du mot de passe
   */
  validatePasswordConfirmation(
    password: string,
    confirmation: string
  ): ValidationResult {
    const errors: string[] = [];

    if (!confirmation) {
      errors.push("La confirmation du mot de passe est requise");
    } else if (password !== confirmation) {
      errors.push("Les mots de passe ne correspondent pas");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valide un nom d'utilisateur
   */
  validateUsername(username: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!username) {
      errors.push("Le nom d'utilisateur est requis");
      return { isValid: false, errors };
    }

    const trimmedUsername = username.trim();

    // Vérifier la longueur
    if (trimmedUsername.length < 3) {
      errors.push("Le nom d'utilisateur doit contenir au moins 3 caractères");
    }
    if (trimmedUsername.length > 30) {
      errors.push("Le nom d'utilisateur ne doit pas dépasser 30 caractères");
    }

    // Vérifier les caractères autorisés (lettres, chiffres, underscore, tiret)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      errors.push(
        "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"
      );
    }

    // Vérifier qu'il ne commence pas par un chiffre
    if (/^[0-9]/.test(trimmedUsername)) {
      warnings.push(
        "Le nom d'utilisateur ne devrait pas commencer par un chiffre"
      );
    }

    // Vérifier les noms réservés
    const reservedNames = [
      "admin",
      "root",
      "system",
      "moderator",
      "support",
      "help",
      "api",
      "test",
    ];
    if (reservedNames.includes(trimmedUsername.toLowerCase())) {
      errors.push("Ce nom d'utilisateur est réservé");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Valide un numéro de téléphone
   */
  validatePhoneNumber(phoneNumber: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!phoneNumber) {
      // Le téléphone est optionnel, donc pas d'erreur si vide
      return { isValid: true, errors };
    }

    // Nettoyer le numéro (enlever espaces, tirets, parenthèses)
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, "");

    // Vérifier le format international
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;

    if (!phoneRegex.test(cleanedNumber)) {
      errors.push("Le numéro de téléphone n'est pas valide");

      if (!cleanedNumber.startsWith("+")) {
        warnings.push(
          "Il est recommandé d'utiliser le format international (ex: +33612345678)"
        );
      }
    }

    // Vérifier la longueur
    if (cleanedNumber.length < 7) {
      errors.push("Le numéro de téléphone est trop court");
    }
    if (cleanedNumber.length > 15) {
      errors.push("Le numéro de téléphone est trop long");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Trouve des domaines similaires pour les suggestions
   */
  private findSimilarDomains(domain: string): string[] {
    if (!domain) return [];

    const suggestions: string[] = [];
    const lowerDomain = domain.toLowerCase();

    for (const commonDomain of COMMON_EMAIL_DOMAINS) {
      // Calcul simple de la distance de Levenshtein
      const distance = this.levenshteinDistance(lowerDomain, commonDomain);

      // Si la distance est faible (< 3), c'est probablement une faute de frappe
      if (distance > 0 && distance <= 2) {
        suggestions.push(commonDomain);
      }
    }

    return suggestions.slice(0, 3); // Retourner max 3 suggestions
  }

  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Génère un mot de passe sécurisé
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = SPECIAL_CHARS;

    let allChars = "";
    let password = "";

    // Assurer qu'au moins un caractère de chaque type requis est présent
    if (this.config.requireUppercase) {
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      allChars += uppercase;
    }
    if (this.config.requireLowercase) {
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      allChars += lowercase;
    }
    if (this.config.requireNumbers) {
      password += numbers[Math.floor(Math.random() * numbers.length)];
      allChars += numbers;
    }
    if (this.config.requireSpecialChars) {
      password += special[Math.floor(Math.random() * special.length)];
      allChars += special;
    }

    // Compléter le reste du mot de passe
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mélanger le mot de passe pour éviter un pattern prévisible
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  /**
   * Calcule la force d'un mot de passe (0-100)
   */
  calculatePasswordStrength(password: string): number {
    const result = this.validatePassword(password);
    return result.score || 0;
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info("Configuration de validation mise à jour", this.config);
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }
}

// Instance par défaut
export const authValidator = new AuthValidator();

// Export des fonctions utilitaires pour un accès direct
export const validateEmail = (email: string) =>
  authValidator.validateEmail(email);
export const validatePassword = (password: string) =>
  authValidator.validatePassword(password);
export const validatePasswordConfirmation = (
  password: string,
  confirmation: string
) => authValidator.validatePasswordConfirmation(password, confirmation);
export const validateUsername = (username: string) =>
  authValidator.validateUsername(username);
export const validatePhoneNumber = (phoneNumber: string) =>
  authValidator.validatePhoneNumber(phoneNumber);
export const generateSecurePassword = (length?: number) =>
  authValidator.generateSecurePassword(length);
export const calculatePasswordStrength = (password: string) =>
  authValidator.calculatePasswordStrength(password);
