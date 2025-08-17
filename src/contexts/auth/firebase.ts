import { Platform } from "react-native";
import { getAuth, EmailAuthProvider } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { userActivityService } from "../../services/userActivityService";
import { User } from "./types";

/**
 * Connecte un utilisateur avec email et mot de passe
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User; success: boolean; error?: string }> => {
  try {
    const userCredential = await getAuth().signInWithEmailAndPassword(
      email,
      password
    );

    // Mettre à jour lastLoginAt dans Firestore
    try {
      await setDoc(
        doc(
          collection(getFirestore(getApp()), "users"),
          userCredential.user.uid
        ),
        {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (updateError) {}

    // Tracker la connexion utilisateur
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
      };
      await userActivityService.trackUserLogin(
        userCredential.user.uid,
        deviceInfo
      );
    } catch (trackError) {}

    // Récupérer les informations utilisateur depuis Firestore si disponibles
    let userData: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      name: userCredential.user.displayName,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      emailVerified: userCredential.user.emailVerified,
      isGuest: false,
    };

    try {
      const userDoc = await getDoc(
        doc(
          collection(getFirestore(getApp()), "users"),
          userCredential.user.uid
        )
      );
      if (userDoc.exists()) {
        const firestoreData = userDoc.data() as {
          name?: string;
          photoURL?: string;
        };
        userData = {
          ...userData,
          name: firestoreData?.name || userData.name,
          displayName: firestoreData?.name || userData.displayName,
          photoURL: firestoreData?.photoURL || userData.photoURL,
        };
      }
    } catch (firestoreError) {}

    return { user: userData, success: true };
  } catch (error: any) {
    let errorMessage = "Erreur lors de la connexion";
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "Adresse email invalide";
        break;
      case "auth/user-disabled":
        errorMessage = "Ce compte a été désactivé";
        break;
      case "auth/user-not-found":
        errorMessage = "Aucun compte trouvé avec cette adresse email";
        break;
      case "auth/wrong-password":
        errorMessage = "Mot de passe incorrect";
        break;
      case "auth/invalid-credential":
        errorMessage = "Email ou mot de passe incorrect";
        break;
      case "auth/network-request-failed":
        errorMessage =
          "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.";
        break;
    }

    return { user: {} as User, success: false, error: errorMessage };
  }
};

/**
 * Crée un nouveau compte utilisateur
 */
export const createAccount = async (
  email: string,
  password: string,
  name: string
): Promise<{ user: User; success: boolean; error?: string }> => {
  try {
    const userCredential = await getAuth().createUserWithEmailAndPassword(
      email,
      password
    );

    // Envoyer l'email de vérification
    try {
      await userCredential.user.sendEmailVerification();
    } catch (emailErr) {}

    // Mettre à jour le nom d'affichage
    await userCredential.user.updateProfile({
      displayName: name,
    });

    const userData: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      name: name,
      displayName: name,
      photoURL: null,
      emailVerified: userCredential.user.emailVerified,
      isGuest: false,
    };

    return { user: userData, success: true };
  } catch (error: any) {
    let errorMessage = "Erreur lors de l'inscription";
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "Cette adresse email est déjà utilisée";
        break;
      case "auth/invalid-email":
        errorMessage = "Adresse email invalide";
        break;
      case "auth/weak-password":
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
        break;
      case "auth/network-request-failed":
        errorMessage =
          "Problème de connexion réseau. Vérifiez votre connexion internet et réessayez.";
        break;
    }

    return { user: {} as User, success: false, error: errorMessage };
  }
};

/**
 * Déconnecte l'utilisateur Firebase
 */
export const signOutFirebase = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await getAuth().signOut();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Erreur lors de la déconnexion" };
  }
};

/**
 * Met à jour le profil utilisateur
 */
export const updateUserProfileFirebase = async (updates: {
  name?: string;
  photoURL?: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    // Mettre à jour Firebase Auth
    await currentUser.updateProfile({
      displayName: updates.name || currentUser.displayName,
      photoURL:
        updates.photoURL !== undefined
          ? updates.photoURL
          : currentUser.photoURL,
    });

    // Mettre à jour Firestore
    const userRef = doc(
      collection(getFirestore(getApp()), "users"),
      currentUser.uid
    );
    const firestoreUpdates: any = {
      updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) {
      firestoreUpdates.name = updates.name;
    }
    if (updates.photoURL !== undefined) {
      firestoreUpdates.photoURL = updates.photoURL;
    }

    await setDoc(userRef, firestoreUpdates, { merge: true });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Erreur lors de la mise à jour du profil" };
  }
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export const sendPasswordReset = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await getAuth().sendPasswordResetEmail(email);
    return { success: true };
  } catch (error: any) {
    let errorMessage = "Erreur lors de l'envoi de l'email";
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "Adresse email invalide";
        break;
      case "auth/user-not-found":
        errorMessage = "Aucun compte trouvé avec cette adresse email";
        break;
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Change l'email de l'utilisateur
 */
export const changeUserEmail = async (
  newEmail: string,
  currentPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = getAuth().currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    // Réauthentifier l'utilisateur
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    await currentUser.reauthenticateWithCredential(credential);

    // Changer l'email
    await currentUser.updateEmail(newEmail);

    // Mettre à jour Firestore
    const userRef = doc(
      collection(getFirestore(getApp()), "users"),
      currentUser.uid
    );
    await setDoc(
      userRef,
      {
        email: newEmail,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (error: any) {
    let errorMessage = "Erreur lors du changement d'email";
    switch (error.code) {
      case "auth/invalid-email":
        errorMessage = "Nouvelle adresse email invalide";
        break;
      case "auth/email-already-in-use":
        errorMessage = "Cette adresse email est déjà utilisée";
        break;
      case "auth/wrong-password":
        errorMessage = "Mot de passe incorrect";
        break;
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Change le mot de passe de l'utilisateur
 */
export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = getAuth().currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    // Réauthentifier l'utilisateur
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    await currentUser.reauthenticateWithCredential(credential);

    // Changer le mot de passe
    await currentUser.updatePassword(newPassword);

    return { success: true };
  } catch (error: any) {
    let errorMessage = "Erreur lors du changement de mot de passe";
    switch (error.code) {
      case "auth/weak-password":
        errorMessage =
          "Le nouveau mot de passe doit contenir au moins 6 caractères";
        break;
      case "auth/wrong-password":
        errorMessage = "Mot de passe actuel incorrect";
        break;
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Supprime le compte utilisateur
 */
export const deleteUserAccount = async (
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentUser = getAuth().currentUser;
    if (!currentUser || !currentUser.email) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    // Réauthentifier l'utilisateur
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      password
    );
    await currentUser.reauthenticateWithCredential(credential);

    // Supprimer le compte
    await currentUser.delete();

    return { success: true };
  } catch (error: any) {
    let errorMessage = "Erreur lors de la suppression du compte";
    if (error.code === "auth/wrong-password") {
      errorMessage = "Mot de passe incorrect";
    }

    return { success: false, error: errorMessage };
  }
};
