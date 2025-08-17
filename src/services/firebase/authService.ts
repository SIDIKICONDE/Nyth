/**
 * Service d'authentification Firebase
 * Utilise l'API modulaire de @react-native-firebase v22
 */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  AppleAuthProvider,
  EmailAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  deleteUser,
  onAuthStateChanged,
  reload,
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { createLogger } from "../../utils/optimizedLogger";
import {
  googleSignInConfig,
  appleSignInConfig,
  socialAuthErrors,
} from "../../config/socialAuth.config";

const logger = createLogger("FirebaseAuthService");

// Types pour une meilleure type-safety
interface UserProfile {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}

interface AuthServiceConfig {
  enablePersistence: boolean;
  emailVerificationRequired: boolean;
  minPasswordLength: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // en minutes
}

// Codes d'erreur personnalisés
export enum AuthErrorCode {
  EMAIL_ALREADY_IN_USE = "auth/email-already-in-use",
  INVALID_EMAIL = "auth/invalid-email",
  WEAK_PASSWORD = "auth/weak-password",
  USER_NOT_FOUND = "auth/user-not-found",
  WRONG_PASSWORD = "auth/wrong-password",
  USER_DISABLED = "auth/user-disabled",
  TOO_MANY_REQUESTS = "auth/too-many-requests",
  NETWORK_ERROR = "auth/network-request-failed",
  EMAIL_NOT_VERIFIED = "auth/email-not-verified",
  INVALID_CREDENTIAL = "auth/invalid-credential",
  REQUIRES_RECENT_LOGIN = "auth/requires-recent-login",
  OPERATION_NOT_ALLOWED = "auth/operation-not-allowed",
}

// Messages d'erreur localisés
const ERROR_MESSAGES: Record<string, string> = {
  [AuthErrorCode.EMAIL_ALREADY_IN_USE]:
    "Cette adresse email est déjà utilisée par un autre compte.",
  [AuthErrorCode.INVALID_EMAIL]: "L'adresse email n'est pas valide.",
  [AuthErrorCode.WEAK_PASSWORD]:
    "Le mot de passe doit contenir au moins 8 caractères, incluant des majuscules, minuscules, chiffres et caractères spéciaux.",
  [AuthErrorCode.USER_NOT_FOUND]:
    "Aucun compte n'existe avec cette adresse email.",
  [AuthErrorCode.WRONG_PASSWORD]: "Le mot de passe est incorrect.",
  [AuthErrorCode.USER_DISABLED]:
    "Ce compte a été désactivé. Veuillez contacter le support.",
  [AuthErrorCode.TOO_MANY_REQUESTS]:
    "Trop de tentatives de connexion. Veuillez réessayer dans quelques minutes.",
  [AuthErrorCode.NETWORK_ERROR]:
    "Erreur de connexion réseau. Vérifiez votre connexion internet.",
  [AuthErrorCode.EMAIL_NOT_VERIFIED]:
    "Veuillez vérifier votre adresse email avant de vous connecter.",
  [AuthErrorCode.INVALID_CREDENTIAL]:
    "Les informations d'identification sont invalides ou ont expiré.",
  [AuthErrorCode.REQUIRES_RECENT_LOGIN]:
    "Cette opération nécessite une reconnexion récente.",
  [AuthErrorCode.OPERATION_NOT_ALLOWED]:
    "Cette méthode de connexion n'est pas activée.",
};

/**
 * Service d'authentification Firebase utilisant l'API modulaire v22
 */
class FirebaseAuthService {
  private auth;
  private firestore: FirebaseFirestoreTypes.Module;
  private config: AuthServiceConfig;
  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> =
    new Map();
  private unsubscribeAuthListener: (() => void) | null = null;

  constructor() {
    // Initialiser les services Firebase avec l'API modulaire
    this.auth = getAuth();
    this.firestore = getFirestore();

    this.config = {
      enablePersistence: true,
      emailVerificationRequired: true,
      minPasswordLength: 8,
      maxLoginAttempts: 5,
      lockoutDuration: 15, // minutes
    };

    // Initialiser la configuration Google Sign-In
    this.configureGoogleSignIn();
  }

  /**
   * Configure Google Sign-In
   */
  private configureGoogleSignIn(): void {
    try {
      GoogleSignin.configure({
        webClientId: googleSignInConfig.webClientId,
        iosClientId: googleSignInConfig.iosClientId,
        offlineAccess: googleSignInConfig.offlineAccess,
        hostedDomain: googleSignInConfig.hostedDomain,
        forceCodeForRefreshToken: googleSignInConfig.forceCodeForRefreshToken,
        scopes: googleSignInConfig.scopes,
      });
      logger.info(
        "✅ Google Sign-In configuré avec Web Client ID:",
        googleSignInConfig.webClientId.substring(0, 20) + "..."
      );
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la configuration de Google Sign-In:",
        error
      );
    }
  }

  /**
   * Valide le format de l'email
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.toLowerCase());
  }

  /**
   * Valide la force du mot de passe
   */
  private validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < this.config.minPasswordLength) {
      errors.push(
        `Le mot de passe doit contenir au moins ${this.config.minPasswordLength} caractères`
      );
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins une majuscule");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins une minuscule");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Le mot de passe doit contenir au moins un chiffre");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push(
        "Le mot de passe doit contenir au moins un caractère spécial"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Vérifie si un utilisateur est bloqué pour trop de tentatives
   */
  private isUserLocked(email: string): void {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
    const lockoutDurationMs = this.config.lockoutDuration * 60 * 1000;

    if (
      attempts.count >= this.config.maxLoginAttempts &&
      timeSinceLastAttempt < lockoutDurationMs
    ) {
      const remainingTime = Math.ceil(
        (lockoutDurationMs - timeSinceLastAttempt) / 60000
      );
      throw new Error(
        `Compte temporairement bloqué. Réessayez dans ${remainingTime} minutes.`
      );
    }

    // Réinitialiser si le délai est passé
    if (timeSinceLastAttempt >= lockoutDurationMs) {
      this.loginAttempts.delete(email);
    }
  }

  /**
   * Enregistre une tentative de connexion
   */
  private recordLoginAttempt(email: string, success: boolean): void {
    if (success) {
      this.loginAttempts.delete(email);
      return;
    }

    const attempts = this.loginAttempts.get(email) || {
      count: 0,
      lastAttempt: new Date(),
    };
    attempts.count++;
    attempts.lastAttempt = new Date();
    this.loginAttempts.set(email, attempts);

    if (attempts.count >= this.config.maxLoginAttempts) {
      logger.warn(
        `🔒 Compte ${email} bloqué après ${attempts.count} tentatives`
      );
    }
  }

  /**
   * Inscription avec email et mot de passe
   */
  async signUpWithEmail(
    email: string,
    password: string,
    profile?: UserProfile
  ): Promise<FirebaseAuthTypes.User> {
    try {
      logger.info("🔐 Tentative d'inscription pour:", email);

      // Validation des entrées
      if (!this.validateEmail(email)) {
        throw new Error(ERROR_MESSAGES[AuthErrorCode.INVALID_EMAIL]);
      }

      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join("\n"));
      }

      // Créer le compte avec l'API modulaire
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email.toLowerCase().trim(),
        password
      );

      const user = userCredential.user;

      // Mettre à jour le profil si fourni
      if (profile && (profile.displayName || profile.photoURL)) {
        await updateProfile(user, {
          displayName: profile.displayName || null,
          photoURL: profile.photoURL || null,
        });
      }

      // Créer le document utilisateur dans Firestore
      await this.createUserDocument(user, profile);

      // Envoyer l'email de vérification
      if (this.config.emailVerificationRequired) {
        await sendEmailVerification(user);
      }

      // Sauvegarder l'email pour faciliter la reconnexion
      await AsyncStorage.setItem("@last_email", email);

      logger.info("✅ Inscription réussie pour:", email);
      return user;
    } catch (error: any) {
      logger.error("❌ Erreur lors de l'inscription:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  async signInWithEmail(
    email: string,
    password: string
  ): Promise<FirebaseAuthTypes.User> {
    try {
      logger.info("🔐 Tentative de connexion pour:", email);

      // Vérifier le verrouillage du compte
      this.isUserLocked(email);

      // Validation des entrées
      if (!this.validateEmail(email)) {
        throw new Error(ERROR_MESSAGES[AuthErrorCode.INVALID_EMAIL]);
      }

      if (!password || password.length < 6) {
        throw new Error("Le mot de passe est requis");
      }

      // Tentative de connexion avec l'API modulaire
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email.toLowerCase().trim(),
        password
      );

      const user = userCredential.user;

      // Vérifier si l'email est vérifié (si requis)
      if (this.config.emailVerificationRequired && !user.emailVerified) {
        await signOut(this.auth);
        throw new Error(ERROR_MESSAGES[AuthErrorCode.EMAIL_NOT_VERIFIED]);
      }

      // Enregistrer la connexion réussie
      this.recordLoginAttempt(email, true);

      // Mettre à jour la dernière connexion dans Firestore
      await this.updateLastLogin(user.uid);

      // Sauvegarder l'email
      await AsyncStorage.setItem("@last_email", email);

      logger.info("✅ Connexion réussie pour:", email);
      return user;
    } catch (error: any) {
      // Enregistrer l'échec de connexion
      this.recordLoginAttempt(email, false);
      logger.error("❌ Erreur lors de la connexion:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Connexion avec Google
   */
  async signInWithGoogle(): Promise<FirebaseAuthTypes.User> {
    try {
      logger.info("🔐 Connexion avec Google");

      // Vérifier que Google Play Services est disponible (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Obtenir les informations de connexion Google
      const response = await GoogleSignin.signIn();

      // Gestion du cas annulation
      if ((response as unknown as { type?: string })?.type === "cancelled") {
        throw new Error("Connexion Google annulée");
      }

      const googleUser = (
        response as unknown as { data?: { idToken?: string | null } }
      )?.data;
      let idToken = googleUser?.idToken ?? null;

      if (!idToken) {
        // Récupérer via l'API tokens si non présent dans la réponse
        try {
          const tokens = await GoogleSignin.getTokens();
          idToken = tokens.idToken ?? null;
        } catch (tokenErr) {
          logger.warn("⚠️ Impossible de récupérer les tokens:", tokenErr);
        }
      }

      if (!idToken) {
        throw new Error("Impossible d'obtenir le token Google");
      }

      // Créer les credentials Firebase avec l'API modulaire
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Se connecter avec Firebase
      const userCredential = await signInWithCredential(
        this.auth,
        googleCredential
      );

      const user = userCredential.user;

      // Créer ou mettre à jour le document utilisateur
      await this.createOrUpdateUserDocument(user);

      logger.info("✅ Connexion Google réussie");
      return user;
    } catch (error: any) {
      logger.error("❌ Erreur lors de la connexion Google:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Connexion avec Apple (iOS uniquement)
   */
  async signInWithApple(): Promise<FirebaseAuthTypes.User> {
    try {
      logger.info("🔐 Connexion avec Apple");

      // Vérifier la disponibilité sur iOS
      if (Platform.OS !== "ios") {
        throw new Error("La connexion Apple n'est disponible que sur iOS");
      }

      // Vérifier si Apple Sign-In est disponible sur l'appareil
      const isSupported = appleAuth.isSupported;
      if (!isSupported) {
        throw new Error(
          "La connexion Apple n'est pas disponible sur cet appareil"
        );
      }

      // Effectuer la requête Apple Sign-In
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Vérifier que nous avons reçu un identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error("Impossible d'obtenir le token d'identité Apple");
      }

      // Créer les credentials Firebase
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      // Se connecter avec Firebase
      const userCredential = await signInWithCredential(
        this.auth,
        appleCredential
      );
      const user = userCredential.user;

      // Si c'est la première connexion, sauvegarder les informations utilisateur
      if (appleAuthRequestResponse.fullName) {
        const fullName = appleAuthRequestResponse.fullName;
        const displayName = `${fullName.givenName || ""} ${
          fullName.familyName || ""
        }`.trim();

        if (displayName) {
          await updateProfile(user, {
            displayName: displayName,
          });
        }
      }

      // Créer ou mettre à jour le document utilisateur
      await this.createOrUpdateUserDocument(user);

      logger.info("✅ Connexion Apple réussie");
      return user;
    } catch (error: any) {
      logger.error("❌ Erreur lors de la connexion Apple:", error);

      // Gestion des erreurs spécifiques Apple - simplifié
      throw this.handleAuthError(error);
    }
  }

  /**
   * Vérifie si Apple Sign-In est disponible
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    try {
      if (Platform.OS !== "ios") {
        return false;
      }
      return await appleAuth.isSupported;
    } catch (error) {
      logger.error(
        "Erreur lors de la vérification de la disponibilité d'Apple Sign-In:",
        error
      );
      return false;
    }
  }

  /**
   * Envoie un email de vérification
   */
  async sendVerificationEmail(user?: FirebaseAuthTypes.User): Promise<void> {
    try {
      const currentUser = user || this.auth.currentUser;

      if (!currentUser) {
        throw new Error("Aucun utilisateur connecté");
      }

      if (currentUser.emailVerified) {
        logger.info("✅ Email déjà vérifié");
        return;
      }

      await sendEmailVerification(currentUser);

      logger.info("✅ Email de vérification envoyé à:", currentUser.email);
    } catch (error: any) {
      logger.error(
        "❌ Erreur lors de l'envoi de l'email de vérification:",
        error
      );
      throw this.handleAuthError(error);
    }
  }

  /**
   * Vérifie si l'email de l'utilisateur est vérifié
   */
  async checkEmailVerification(): Promise<boolean> {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        return false;
      }

      // Recharger les données de l'utilisateur
      await reload(user);

      return user.emailVerified;
    } catch (error) {
      logger.error("❌ Erreur lors de la vérification de l'email:", error);
      return false;
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(email: string): Promise<void> {
    try {
      logger.info("📧 Envoi d'email de réinitialisation à:", email);

      if (!this.validateEmail(email)) {
        throw new Error(ERROR_MESSAGES[AuthErrorCode.INVALID_EMAIL]);
      }

      await sendPasswordResetEmail(this.auth, email.toLowerCase().trim());

      logger.info("✅ Email de réinitialisation envoyé");
    } catch (error: any) {
      logger.error(
        "❌ Erreur lors de l'envoi de l'email de réinitialisation:",
        error
      );
      throw this.handleAuthError(error);
    }
  }

  /**
   * Met à jour le profil de l'utilisateur
   */
  async updateUserProfile(profile: UserProfile): Promise<void> {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        throw new Error("Aucun utilisateur connecté");
      }

      await updateProfile(user, {
        displayName: profile.displayName || user.displayName,
        photoURL: profile.photoURL || user.photoURL,
      });

      // Mettre à jour dans Firestore avec l'API modulaire
      const userDocRef = doc(this.firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        updatedAt: serverTimestamp(),
      });

      logger.info("✅ Profil utilisateur mis à jour");
    } catch (error: any) {
      logger.error("❌ Erreur lors de la mise à jour du profil:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Change l'email de l'utilisateur
   */
  async changeEmail(newEmail: string, password: string): Promise<void> {
    try {
      const user = this.auth.currentUser;

      if (!user || !user.email) {
        throw new Error("Aucun utilisateur connecté");
      }

      if (!this.validateEmail(newEmail)) {
        throw new Error(ERROR_MESSAGES[AuthErrorCode.INVALID_EMAIL]);
      }

      // Ré-authentifier l'utilisateur avec l'API modulaire
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Changer l'email
      await updateEmail(user, newEmail.toLowerCase().trim());

      // Envoyer un email de vérification au nouveau mail
      await sendEmailVerification(user);

      // Mettre à jour dans Firestore
      const userDocRef = doc(this.firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        email: newEmail,
        emailVerified: false,
        updatedAt: serverTimestamp(),
      });

      logger.info("✅ Email mis à jour avec succès");
    } catch (error: any) {
      logger.error("❌ Erreur lors du changement d'email:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Change le mot de passe de l'utilisateur
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = this.auth.currentUser;

      if (!user || !user.email) {
        throw new Error("Aucun utilisateur connecté");
      }

      // Valider le nouveau mot de passe
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join("\n"));
      }

      // Ré-authentifier l'utilisateur
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Changer le mot de passe
      await updatePassword(user, newPassword);

      logger.info("✅ Mot de passe mis à jour avec succès");
    } catch (error: any) {
      logger.error("❌ Erreur lors du changement de mot de passe:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Déconnexion
   */
  async signOut(): Promise<void> {
    try {
      logger.info("🚪 Déconnexion en cours...");

      // Déconnexion de Google si connecté
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        logger.warn("⚠️ Erreur lors de la déconnexion Google:", error);
      }

      // Nettoyer les listeners
      if (this.unsubscribeAuthListener) {
        this.unsubscribeAuthListener();
        this.unsubscribeAuthListener = null;
      }

      // Déconnexion Firebase avec l'API modulaire
      await signOut(this.auth);

      logger.info("✅ Déconnexion réussie");
    } catch (error: any) {
      logger.error("❌ Erreur lors de la déconnexion:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Supprime le compte de l'utilisateur
   */
  async deleteAccount(password: string): Promise<void> {
    try {
      const user = this.auth.currentUser;

      if (!user || !user.email) {
        throw new Error("Aucun utilisateur connecté");
      }

      // Ré-authentifier l'utilisateur avant la suppression
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Supprimer les données de Firestore
      const userDocRef = doc(this.firestore, "users", user.uid);
      await deleteDoc(userDocRef);

      // Supprimer le compte Firebase
      await deleteUser(user);

      // Nettoyer le stockage local
      await AsyncStorage.multiRemove(["@last_email", "@user_data"]);

      logger.info("✅ Compte supprimé avec succès");
    } catch (error: any) {
      logger.error("❌ Erreur lors de la suppression du compte:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Écoute les changements d'état d'authentification
   */
  onAuthStateChanged(
    callback: (user: FirebaseAuthTypes.User | null) => void
  ): () => void {
    // Utiliser l'API modulaire pour écouter les changements
    this.unsubscribeAuthListener = onAuthStateChanged(
      this.auth,
      async (user) => {
        if (user) {
          // Recharger les données de l'utilisateur pour avoir les dernières infos
          try {
            await reload(user);
          } catch (error) {
            logger.warn(
              "⚠️ Impossible de recharger les données utilisateur:",
              error
            );
          }
        }
        callback(user);
      }
    );

    return () => {
      if (this.unsubscribeAuthListener) {
        this.unsubscribeAuthListener();
        this.unsubscribeAuthListener = null;
      }
    };
  }

  /**
   * Obtient l'utilisateur actuel
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return this.auth.currentUser;
  }

  /**
   * Obtient le token ID de l'utilisateur actuel
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      const user = this.auth.currentUser;

      if (!user) {
        return null;
      }

      return await user.getIdToken(forceRefresh);
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération du token:", error);
      return null;
    }
  }

  /**
   * Crée le document utilisateur dans Firestore
   */
  private async createUserDocument(
    user: FirebaseAuthTypes.User,
    profile?: UserProfile
  ): Promise<void> {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: profile?.displayName || user.displayName || "",
        photoURL: profile?.photoURL || user.photoURL || "",
        phoneNumber: profile?.phoneNumber || user.phoneNumber || "",
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true,
        role: "user",
        preferences: {
          language: "fr",
          theme: "system",
          notifications: true,
        },
      };

      // Utiliser l'API modulaire Firestore
      const userDocRef = doc(this.firestore, "users", user.uid);
      await setDoc(userDocRef, userData);

      logger.info("✅ Document utilisateur créé dans Firestore");
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la création du document utilisateur:",
        error
      );
      // Ne pas bloquer l'inscription si Firestore échoue
    }
  }

  /**
   * Crée ou met à jour le document utilisateur
   */
  private async createOrUpdateUserDocument(
    user: FirebaseAuthTypes.User
  ): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Mettre à jour le document existant
        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Créer un nouveau document
        await this.createUserDocument(user);
      }
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la mise à jour du document utilisateur:",
        error
      );
    }
  }

  /**
   * Met à jour la dernière connexion
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, "users", uid);
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à jour de lastLogin:", error);
    }
  }

  /**
   * Gestion centralisée des erreurs d'authentification
   */
  private handleAuthError(error: any): Error {
    const errorCode = error.code || error.message;
    const errorMessage =
      ERROR_MESSAGES[errorCode] ||
      error.message ||
      "Une erreur inattendue s'est produite";

    logger.error("🔴 Erreur d'authentification:", {
      code: errorCode,
      message: errorMessage,
      originalError: error,
    });

    return new Error(errorMessage);
  }

  /**
   * Configure les paramètres du service
   */
  setConfig(config: Partial<AuthServiceConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info("⚙️ Configuration mise à jour:", this.config);
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): AuthServiceConfig {
    return { ...this.config };
  }
}

// Export d'une instance unique (Singleton)
const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;

// Export des types pour utilisation externe
export type { UserProfile, AuthServiceConfig };
export type User = FirebaseAuthTypes.User;
