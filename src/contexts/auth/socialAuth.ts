import { Platform } from "react-native";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
	getAuth,
	GoogleAuthProvider,
	AppleAuthProvider,
	signInWithCredential,
} from "@react-native-firebase/auth";
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from "@env";
import { createOptimizedLogger } from "@/utils/optimizedLogger";
const logger = createOptimizedLogger("socialAuth");
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

	// Ne pas bloquer si .env manquant. Sur iOS, GIDClientID d'Info.plist suffit pour ouvrir l'UI.
	try {
		if (__DEV__) {
			const mask = (v?: string | null) =>
				!v ? "undefined" : `${String(v).slice(0, 8)}...${String(v).slice(-6)}`;
			logger.debug("[Google] Configuration de GoogleSignin.configure", {
				platform: Platform.OS,
				webClientId: mask(webClientId as unknown as string),
				iosClientId: mask(iosClientId as unknown as string),
			});
			if (!webClientId) {
				logger.warn("[Google] GOOGLE_WEB_CLIENT_ID manquant (.env). L'idToken Firebase peut être indisponible.");
			}
		}

		const config: Record<string, unknown> = {
			offlineAccess: false,
			hostedDomain: "",
			forceCodeForRefreshToken: false,
			accountName: "",
			profileImageSize: 120,
		};

		// Toujours privilégier le Web Client ID (requis pour Firebase)
		if (webClientId) {
			config.webClientId = webClientId;
		}

		// Fournir l'iOS Client ID uniquement s'il est défini
		if (Platform.OS === "ios" && iosClientId) {
			// @ts-ignore propriété supportée par la lib
			config.iosClientId = iosClientId;
		}

		GoogleSignin.configure(config as any);
		return true;
	} catch (error: unknown) {
		logger.error("[Google] Échec de GoogleSignin.configure", error as any);
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

		// Gestion annulation
		if ((response as unknown as { type?: string })?.type === "cancelled") {
			return { success: false, error: "Connexion Google annulée" };
		}

		// idToken se trouve directement sur la réponse quand un client_id est configuré
		const idToken = (response as unknown as { idToken?: string | null })?.idToken ?? null;

		let finalIdToken: string | null = idToken;
		if (!finalIdToken) {
			try {
				const tokens = await GoogleSignin.getTokens();
				finalIdToken = tokens.idToken ?? null;
			} catch {}
		}

		if (!finalIdToken) {
			logger.warn("[Google] idToken non reçu après signIn");
			return { success: false, error: "Token ID Google manquant" };
		}

		const googleCredential = GoogleAuthProvider.credential(finalIdToken);
		const userCredential = await signInWithCredential(getAuth(), googleCredential);
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
		const userCredential = await signInWithCredential(getAuth(), credential);
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
