import { Alert } from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import type { Asset } from "react-native-image-picker";
import { useUserProfile } from "../../../../contexts/UserProfileContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UserProfile } from "../../../../types/user";

export const useProfileImageManager = (profile: UserProfile) => {
  const { t } = useTranslation();
  const { updateProfile, refreshProfile } = useUserProfile();

  const deletePhotoFromStorageByUrl = async (
    photoUrl: string
  ): Promise<void> => {
    try {
      if (!photoUrl || !photoUrl.includes("firebasestorage")) return;
      const { getStorage } = await import("@react-native-firebase/storage");
      const { getApp } = await import("@react-native-firebase/app");

      const pathPart = photoUrl.split("/o/")[1]?.split("?")[0];
      if (!pathPart) return;
      const decodedPath = decodeURIComponent(pathPart);
      const photoRef = getStorage(getApp()).ref(decodedPath);
      await photoRef.delete();
    } catch (e) {}
  };

  const removeProfileImage = async () => {
    try {
      const { getStorage } = await import("@react-native-firebase/storage");
      const { getApp } = await import("@react-native-firebase/app");
      const { getAuth } = await import("@react-native-firebase/auth");

      const currentUser = getAuth(getApp()).currentUser;
      if (!currentUser) {
        Alert.alert(
          t("profile.imageSelector.error.title", "Erreur"),
          t(
            "profile.imageSelector.error.notAuthenticated",
            "Vous devez être connecté pour supprimer votre photo de profil."
          )
        );
        return;
      }

      if (profile.photoURL && profile.photoURL.includes("firebasestorage")) {
        try {
          const photoPath = profile.photoURL.split("/o/")[1]?.split("?")[0];
          if (photoPath) {
            const decodedPath = decodeURIComponent(photoPath);
            const photoRef = getStorage(getApp()).ref(decodedPath);
            await photoRef.delete();
          }
        } catch (storageError) {}
      }

      await updateProfile({ photoURL: null });
      await currentUser.updateProfile({ photoURL: null });

      Alert.alert(
        t("profile.imageSelector.removed.title", "Photo supprimée"),
        t(
          "profile.imageSelector.removed.message",
          "Votre photo de profil a été supprimée."
        )
      );
    } catch (error) {
      Alert.alert(
        t("profile.imageSelector.error.title", "Erreur"),
        t(
          "profile.imageSelector.error.removeMessage",
          "Une erreur est survenue lors de la suppression de l'image."
        )
      );
    }
  };

  const pickImage = async (source: "camera" | "gallery") => {
    try {
      let result: { assets?: Asset[]; canceled: boolean };

      if (source === "camera") {
        const { launchCamera } = await import("react-native-image-picker");

        result = await new Promise((resolve) => {
          launchCamera(
            {
              mediaType: "photo",
              quality: 0.5,
              includeBase64: false,
            },
            (response) => {
              if (response.assets && response.assets[0]) {
                resolve({
                  assets: response.assets as Asset[],
                  canceled: false,
                });
              } else {
                resolve({ canceled: true });
              }
            }
          );
        });
      } else {
        result = await new Promise((resolve) => {
          launchImageLibrary(
            {
              mediaType: "photo",
              quality: 0.5,
              includeBase64: false,
            },
            (response) => {
              if (response.assets && response.assets[0]) {
                resolve({
                  assets: response.assets as Asset[],
                  canceled: false,
                });
              } else {
                resolve({ canceled: true });
              }
            }
          );
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        try {
          const { width = 0, height = 0 } = result.assets[0];
          const megapixels = (width * height) / 1000000;

          if (megapixels > 50) {
            Alert.alert(
              t("profile.imageSelector.error.title", "Erreur"),
              t(
                "profile.imageSelector.error.imageTooLarge",
                "Cette image est trop grande. Veuillez choisir une image plus petite."
              ),
              [{ text: t("common.ok", "OK") }]
            );
            return;
          }

          if (megapixels > 20) {
            const continueUpload = await new Promise<boolean>((resolve) => {
              Alert.alert(
                t("profile.imageSelector.warning.title", "Image volumineuse"),
                t(
                  "profile.imageSelector.warning.largeImage",
                  "Cette image est très grande et sera fortement compressée. Voulez-vous continuer ?"
                ),
                [
                  {
                    text: t("common.cancel", "Annuler"),
                    onPress: () => resolve(false),
                  },
                  {
                    text: t("common.continue", "Continuer"),
                    onPress: () => resolve(true),
                  },
                ]
              );
            });

            if (!continueUpload) {
              return;
            }
          }

          const { default: unifiedStorageService } = await import(
            "../../../../services/firebase/unifiedStorageService"
          );
          const { getAuth } = await import("@react-native-firebase/auth");
          const { getApp } = await import("@react-native-firebase/app");

          const currentUser = getAuth(getApp()).currentUser;
          if (!currentUser) {
            Alert.alert(
              t("profile.imageSelector.error.title", "Erreur"),
              t(
                "profile.imageSelector.error.notAuthenticated",
                "Vous devez être connecté pour changer votre photo de profil."
              )
            );
            return;
          }

          if (currentUser.isAnonymous) {
            Alert.alert(
              t("profile.imageSelector.error.title", "Erreur"),
              t(
                "profile.imageSelector.error.guestUser",
                "Les invités ne peuvent pas changer leur photo de profil. Créez un compte pour accéder à cette fonctionnalité."
              )
            );
            return;
          }

          Alert.alert(
            t("profile.imageSelector.uploading.title", "Téléchargement"),
            t(
              "profile.imageSelector.uploading.message",
              "Votre photo est en cours de téléchargement..."
            ),
            [],
            { cancelable: false }
          );

          const previousPhotoURL = profile.photoURL || null;

          const photoURL = await unifiedStorageService.uploadProfilePhoto(
            currentUser,
            result.assets[0].uri as string
          );

          if (photoURL) {
            await updateProfile({ photoURL });
            await refreshProfile();
            await currentUser.updateProfile({ photoURL });

            if (previousPhotoURL && previousPhotoURL !== photoURL) {
              deletePhotoFromStorageByUrl(previousPhotoURL);
            }

            Alert.alert(
              t("profile.imageSelector.success.title", "Photo mise à jour"),
              t(
                "profile.imageSelector.success.message",
                "Votre photo de profil a été mise à jour avec succès."
              )
            );
          } else {
            throw new Error("URL de photo non reçue");
          }
        } catch (uploadError: unknown) {
          let errorMessage = t(
            "profile.imageSelector.error.uploadMessage",
            "Une erreur est survenue lors du téléchargement de votre photo."
          );

          const err = uploadError as { message?: string; code?: string };
          if (err.message && err.message.includes("Non autorisé")) {
            errorMessage = t(
              "profile.imageSelector.error.unauthorized",
              "Vous n'êtes pas autorisé à effectuer cette action. Reconnectez-vous et réessayez."
            );
          } else if (err.code === "storage/quota-exceeded") {
            errorMessage = t(
              "profile.imageSelector.error.quotaExceeded",
              "Le quota de stockage est dépassé."
            );
          } else if (err.code === "storage/unauthenticated") {
            errorMessage = t(
              "profile.imageSelector.error.unauthenticated",
              "Vous devez être connecté pour uploader une photo."
            );
          }

          Alert.alert(
            t("profile.imageSelector.error.title", "Erreur"),
            errorMessage
          );
        }
      }
    } catch (error) {
      Alert.alert(
        t("profile.imageSelector.error.title", "Erreur"),
        t(
          "profile.imageSelector.error.message",
          "Une erreur est survenue lors de la sélection de l'image."
        )
      );
    }
  };

  const handleImagePicker = () => {
    const options: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }> = [
      {
        text: t("profile.imageSelector.camera", "Appareil photo"),
        onPress: () => pickImage("camera"),
      },
      {
        text: t("profile.imageSelector.gallery", "Galerie"),
        onPress: () => pickImage("gallery"),
      },
    ];

    if (profile.photoURL) {
      options.push({
        text: t("profile.imageSelector.remove", "Supprimer la photo"),
        onPress: () => removeProfileImage(),
        style: "destructive",
      });
    }

    options.push({
      text: t("common.cancel", "Annuler"),
      style: "cancel",
    });

    Alert.alert(
      t("profile.imageSelector.title", "Changer la photo de profil"),
      t("profile.imageSelector.message", "Choisissez une option"),
      options
    );
  };

  return {
    handleImagePicker,
    pickImage,
    removeProfileImage,
  };
};
