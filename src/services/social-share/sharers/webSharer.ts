import { Alert, Linking, Platform, Share } from "react-native";
import { APP_STORE_URLS } from "../config/platforms";
import { ShareOptions, SocialPlatform } from "../types";

/**
 * Gestionnaire de partage web et redirection vers les stores
 */
export class WebSharer {
  /**
   * Redirige vers le web ou le store si l'app n'est pas installée
   */
  public static async shareToWebOrStore(
    platform: SocialPlatform,
    options?: ShareOptions
  ): Promise<void> {
    const actions = [
      {
        text: `Installer ${platform.name}`,
        onPress: () => this.openAppStore(platform),
      },
      {
        text: "Ouvrir sur le web",
        onPress: () => platform.webUrl && Linking.openURL(platform.webUrl),
      },
      {
        text: "Partager autrement",
        onPress: () => this.shareGeneric(options),
      },
      {
        text: "Annuler",
        style: "cancel" as const,
      },
    ];

    Alert.alert(
      `${platform.icon} ${platform.name} non installé`,
      `L'application ${platform.name} n'est pas installée sur votre appareil.\n\nVotre vidéo a été sauvegardée dans votre galerie.`,
      actions
    );
  }

  /**
   * Ouvre le store pour installer l'app
   */
  public static async openAppStore(platform: SocialPlatform): Promise<void> {
    try {
      if (Platform.OS === "android" && platform.packageName) {
        // Essayer d'abord Google Play Store
        try {
          await Linking.openURL(`market://details?id=${platform.packageName}`);
        } catch (error) {
          // Fallback vers le navigateur
          await Linking.openURL(
            `https://play.google.com/store/apps/details?id=${platform.packageName}`
          );
        }
      } else if (Platform.OS === "ios") {
        const url = APP_STORE_URLS[platform.id];
        if (url) {
          await Linking.openURL(url);
        } else {
          // Fallback vers recherche App Store
          await Linking.openURL(
            `https://apps.apple.com/search?term=${encodeURIComponent(
              platform.name
            )}`
          );
        }
      } else {
        // Plateforme web ou autre
        if (platform.webUrl) {
          await Linking.openURL(platform.webUrl);
        }
      }
    } catch (error) {
      Alert.alert(
        "❌ Erreur",
        `Impossible d'ouvrir le store pour installer ${platform.name}`,
        [{ text: "OK" }]
      );
    }
  }

  /**
   * Partage générique via le système
   */
  public static async shareGeneric(options?: ShareOptions): Promise<void> {
    try {
      let message = options?.title || "Vidéo créée avec Visions";

      if (options?.description) {
        message += `\n\n${options.description}`;
      }

      if (options?.hashtags && options.hashtags.length > 0) {
        message += `\n\n${options.hashtags.map((tag) => `#${tag}`).join(" ")}`;
      }

      await Share.share({
        title: "Partager la vidéo",
        message: message,
      });
    } catch (error) {
      Alert.alert(
        "❌ Erreur de partage",
        "Impossible de partager via le système",
        [{ text: "OK" }]
      );
    }
  }

  /**
   * Ouvre une URL web spécifique pour une plateforme
   */
  public static async openWebPlatform(
    platform: SocialPlatform,
    options?: ShareOptions
  ): Promise<void> {
    try {
      if (!platform.webUrl) {
        throw new Error(`Aucune URL web disponible pour ${platform.name}`);
      }

      let url = platform.webUrl;

      // Ajouter des paramètres spécifiques selon la plateforme
      if (platform.id === "twitter" && options?.title) {
        url += `?text=${encodeURIComponent(options.title)}`;
        if (options.hashtags) {
          url += `&hashtags=${encodeURIComponent(options.hashtags.join(","))}`;
        }
      } else if (platform.id === "facebook" && options?.title) {
        url += `?text=${encodeURIComponent(options.title)}`;
      }

      await Linking.openURL(url);

      Alert.alert(
        `${platform.icon} ${platform.name} Web`,
        "Votre vidéo a été sauvegardée dans votre galerie.\n\nVous pouvez maintenant l'importer sur la plateforme web.",
        [{ text: "Compris" }]
      );
    } catch (error) {
      Alert.alert(
        "❌ Erreur",
        `Impossible d'ouvrir ${platform.name} sur le web`,
        [{ text: "OK" }]
      );
    }
  }

  /**
   * Génère des instructions de partage manuel
   */
  public static getManualShareInstructions(platform: SocialPlatform): string {
    const instructions: { [key: string]: string } = {
      tiktok:
        '1. Ouvrez TikTok\n2. Appuyez sur "+"\n3. Sélectionnez votre vidéo\n4. Ajoutez description et hashtags\n5. Publiez !',
      instagram:
        "1. Ouvrez Instagram\n2. Créez un Reel ou Story\n3. Sélectionnez votre vidéo\n4. Ajoutez description\n5. Publiez !",
      youtube:
        '1. Ouvrez YouTube Studio\n2. Appuyez sur "+"\n3. Importez votre vidéo\n4. Ajoutez titre et description\n5. Publiez !',
      facebook:
        "1. Ouvrez Facebook\n2. Créez une publication\n3. Ajoutez votre vidéo\n4. Ajoutez description\n5. Publiez !",
      twitter:
        "1. Ouvrez Twitter\n2. Créez un tweet\n3. Ajoutez votre vidéo\n4. Ajoutez votre texte\n5. Publiez !",
    };

    return (
      instructions[platform.id] || "Instructions de partage non disponibles"
    );
  }

  /**
   * Affiche les instructions de partage manuel
   */
  public static showManualInstructions(platform: SocialPlatform): void {
    const instructions = this.getManualShareInstructions(platform);

    Alert.alert(
      `📱 Comment partager sur ${platform.name}`,
      `Votre vidéo a été sauvegardée dans votre galerie.\n\n${instructions}`,
      [
        {
          text: `Ouvrir ${platform.name}`,
          onPress: () => this.openAppStore(platform),
        },
        { text: "Compris" },
      ]
    );
  }
}
