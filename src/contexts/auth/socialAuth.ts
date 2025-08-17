import { Platform } from "react-native";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  getAuth,
  GoogleAuthProvider,
  AppleAuthProvider,
} from "@react-native-firebase/auth";
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from "@env";
import { User } from "./types";

export interface SocialAuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

function isErrorWithCode(
  value: unknown
): value is { code: string; message?: string } {
  return typeof value === "object" && value !== null && "code" in value;
}

export const configureGoogleSignIn = (): boolean => {
  const webClientId = GOOGLE_WEB_CLIENT_ID;
  const iosClientId = GOOGLE_IOS_CLIENT_ID;

  if (!webClientId) {
    return false;
  }

  if (Platform.OS === "ios" && !iosClientId) {
    return false;
  }

  try {
    GoogleSignin.configure({
      webClientId,
      iosClientId,
      offlineAccess: false,
      hostedDomain: "",
      forceCodeForRefreshToken: false,
      accountName: "",
      profileImageSize: 120,
    });
    return true;
  } catch (error: unknown) {
    return false;
  }
};

export const signInWithGoogle = async (): Promise<SocialAuthResult> => {
  try {
    // Vérifier Google Play Services (Android)
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();

    // Gestion du cas annulation (nouvelle API retourne { type: 'cancelled' })
    // Certains wrappers retournent un discriminant `type`
    if ((response as unknown as { type?: string })?.type === "cancelled") {
      return { success: false, error: "Connexion Google annulée" };
    }

    const googleUser = (
      response as unknown as { data?: { idToken?: string | null } }
    )?.data;
    const idTokenFromResponse: string | null | undefined =
      googleUser?.idToken ?? null;

    let idToken: string | null = idTokenFromResponse ?? null;
    if (!idToken) {
      // Récupérer via l'API tokens si non présent dans la réponse
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken ?? null;
      } catch (tokenErr: unknown) {}
    }

    if (!idToken) {
      return { success: false, error: "Token ID Google manquant" };
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await getAuth().signInWithCredential(
      googleCredential
    );
    const firebaseUser = userCredential.user;

    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      isGuest: false,
      provider: "google",
    };

    return { success: true, user: userData };
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      if (
        error.code === "sign_in_cancelled" ||
        error.code === "SIGN_IN_CANCELLED"
      ) {
        return { success: false, error: "Connexion Google annulée" };
      }
      if (error.code === "sign_in_required") {
        return { success: false, error: "Connexion Google requise" };
      }
      if (
        error.code === "play_services_not_available" ||
        error.code === "PLAY_SERVICES_NOT_AVAILABLE"
      ) {
        return { success: false, error: "Google Play Services non disponible" };
      }
      return {
        success: false,
        error: error.message ?? "Erreur lors de la connexion Google",
      };
    }

    return { success: false, error: "Erreur lors de la connexion Google" };
  }
};

export const signInWithApple = async (): Promise<SocialAuthResult> => {
  try {
    if (Platform.OS !== "ios") {
      return {
        success: false,
        error: "Apple Sign-In est disponible uniquement sur iOS",
      };
    }

    if (!appleAuth.isSupported) {
      return {
        success: false,
        error: "Apple Authentication non supporté sur cet appareil",
      };
    }

    const result = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const identityToken = result.identityToken ?? null;
    if (!identityToken) {
      return { success: false, error: "Token Apple non reçu" };
    }

    const credential = AppleAuthProvider.credential(identityToken);
    const userCredential = await getAuth().signInWithCredential(credential);
    const firebaseUser = userCredential.user;

    let displayName: string | null | undefined = firebaseUser.displayName;
    if (!displayName && result.fullName) {
      const { givenName, familyName } = result.fullName;
      if (givenName || familyName) {
        displayName = `${givenName ?? ""} ${familyName ?? ""}`.trim();
      }
    }

    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? result.email ?? null,
      name: displayName ?? null,
      displayName: displayName ?? null,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      isGuest: false,
      provider: "apple",
    };

    return { success: true, user: userData };
  } catch (error: unknown) {
    if (isErrorWithCode(error)) {
      if (error.code === "1001") {
        return { success: false, error: "Connexion Apple annulée" };
      }
      if (error.code === "1000") {
        return { success: false, error: "Erreur inconnue Apple" };
      }
      if (error.code === "1002") {
        return { success: false, error: "Erreur de configuration Apple" };
      }
      if (error.code === "1003") {
        return { success: false, error: "Erreur de réseau Apple" };
      }
      if (error.code === "1004") {
        return { success: false, error: "Erreur de serveur Apple" };
      }
      if (error.code === "1005") {
        return { success: false, error: "Erreur de validation Apple" };
      }

      return {
        success: false,
        error: error.message ?? "Erreur lors de la connexion Apple",
      };
    }

    return { success: false, error: "Erreur lors de la connexion Apple" };
  }
};

export const signOutGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
  } catch (error: unknown) {}
};
