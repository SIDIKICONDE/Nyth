import { useState } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { validateEmail as advancedValidateEmail } from "../../../utils/emailValidation";

export function useLoginValidation() {
  const { t } = useTranslation();
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestionAlert, setShowSuggestionAlert] = useState(false);

  // Effacer l'erreur email pendant la frappe
  const clearEmailError = () => {
    if (emailError) {
      setEmailError("");
    }
    if (emailWarning) {
      setEmailWarning("");
    }
    if (emailSuggestions.length > 0) {
      setEmailSuggestions([]);
    }
    if (showSuggestionAlert) {
      setShowSuggestionAlert(false);
    }
  };

  // Effacer l'erreur password pendant la frappe
  const clearPasswordError = () => {
    if (passwordError) {
      setPasswordError("");
    }
  };

  // Email validation avancée
  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError(t("login.errors.emailRequired"));
      setEmailWarning("");
      setEmailSuggestions([]);
      return false;
    }

    const validationResult = advancedValidateEmail(email);

    if (!validationResult.isValid) {
      setEmailError(validationResult.error || t("login.errors.emailInvalid"));
      setEmailWarning("");

      // Afficher l'alerte si il y a des suggestions
      if (
        validationResult.suggestions &&
        validationResult.suggestions.length > 0
      ) {
        setEmailSuggestions(validationResult.suggestions);
        setShowSuggestionAlert(true);
      } else {
        setEmailSuggestions([]);
        setShowSuggestionAlert(false);
      }
      return false;
    }

    // Email valide mais avec avertissement
    if (validationResult.warning) {
      setEmailWarning(validationResult.warning);
      // Afficher l'alerte pour les avertissements aussi si il y a des suggestions
      if (
        validationResult.suggestions &&
        validationResult.suggestions.length > 0
      ) {
        setEmailSuggestions(validationResult.suggestions);
        setShowSuggestionAlert(true);
      } else {
        setEmailSuggestions([]);
        setShowSuggestionAlert(false);
      }
    } else {
      setEmailWarning("");
      setEmailSuggestions([]);
      setShowSuggestionAlert(false);
    }

    setEmailError("");
    return true;
  };

  // Password validation
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError(t("login.errors.passwordRequired"));
      return false;
    } else if (password.length < 6) {
      setPasswordError(t("login.errors.passwordLength"));
      return false;
    }
    setPasswordError("");
    return true;
  };

  const dismissSuggestionAlert = () => {
    setShowSuggestionAlert(false);
  };

  return {
    emailError,
    passwordError,
    emailWarning,
    emailSuggestions,
    showSuggestionAlert,
    validateEmail,
    validatePassword,
    clearEmailError,
    clearPasswordError,
    dismissSuggestionAlert,
  };
}
