import { notifyAuthStateChange } from "./storage";
import { AuthStateNotification, User } from "./types";

/**
 * Vérifie si un utilisateur est un invité
 */
export const isUserGuest = (user: User | null): boolean => {
  return user?.isGuest === true;
};

/**
 * Vérifie si un utilisateur est connecté via Firebase
 */
export const isUserFirebase = (user: User | null): boolean => {
  return user !== null && user.isGuest !== true;
};

/**
 * Compare deux utilisateurs pour détecter les changements
 */
export const hasUserChanged = (
  prevUser: User | null,
  newUser: User | null
): boolean => {
  if (prevUser === null && newUser === null) return false;
  if (prevUser === null || newUser === null) return true;

  return (
    prevUser.uid !== newUser.uid ||
    prevUser.isGuest !== newUser.isGuest ||
    prevUser.email !== newUser.email ||
    prevUser.name !== newUser.name
  );
};

/**
 * Génère une clé d'état pour éviter les notifications redondantes
 */
export const generateUserStateKey = (user: User | null): string => {
  if (!user) return "null";
  return `${user.uid}_${user.isGuest ? "guest" : "firebase"}`;
};

/**
 * Notifie un changement d'état d'authentification
 */
export const notifyStateChange = async (
  newUser: User | null,
  reason: string,
  lastUserStateRef: React.MutableRefObject<string>
): Promise<void> => {
  const userStateKey = generateUserStateKey(newUser);

  // Éviter les notifications redondantes
  if (lastUserStateRef.current === userStateKey) {
    return;
  }

  lastUserStateRef.current = userStateKey;

  // Déclencher un événement personnalisé pour informer l'app
  if (typeof window !== "undefined" && window.dispatchEvent) {
    const detail: AuthStateNotification = { user: newUser, reason };
    window.dispatchEvent(new CustomEvent("authStateChanged", { detail }));
  }

  // Notifier via AsyncStorage
  await notifyAuthStateChange();
};

/**
 * Attendre un délai spécifique (utile pour les timeouts)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Vérifie si l'environnement supporte les événements window
 */
export const supportsWindowEvents = (): boolean => {
  return (
    typeof window !== "undefined" && typeof window.dispatchEvent === "function"
  );
};

/**
 * Nettoie une référence de fonction pour éviter les fuites mémoire
 */
export const cleanupRef = (
  ref: React.MutableRefObject<(() => void) | null>
): void => {
  if (ref.current) {
    ref.current();
    ref.current = null;
  }
};

/**
 * Vérifie si un composant est toujours monté
 */
export const isMounted = (ref: React.MutableRefObject<boolean>): boolean => {
  return ref.current === true;
};

/**
 * Gère les erreurs d'authentification de manière sécurisée
 */
export const handleAuthError = (
  error: any,
  setError: (error: string | null) => void,
  defaultMessage: string = "Une erreur s'est produite"
): void => {
  if (typeof error === "string") {
    setError(error);
  } else if (error?.message) {
    setError(error.message);
  } else {
    setError(defaultMessage);
  }
};
