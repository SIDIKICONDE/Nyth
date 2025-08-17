import { Platform, Linking, Alert } from "react-native";
import { SocialPlatform, ShareOptions } from "../types";
import { FileManager } from "../utils/fileManager";

/**
 * Gestionnaire de partage natif vers les applications
 */
export class NativeSharer {
  /**
   * Partage vers l'app native installée
   */
  public static async shareToNativeApp(
    videoUri: string,
    platform: SocialPlatform,
    options?: ShareOptions
  ): Promise<void> {
    try {
      // Sauvegarder d'abord dans la galerie
      await FileManager.saveToGallery(videoUri);

      // Construire le message de partage
      const message = this.buildShareMessage(options);

      // Partage spécifique selon la plateforme
      switch (platform.id) {
        case "tiktok":
          await this.shareToTikTok(message);
          break;
        case "instagram":
          await this.shareToInstagram(message);
          break;
        case "youtube":
          await this.shareToYouTube(message);
          break;
        case "facebook":
          await this.shareToFacebook(message);
          break;
        case "twitter":
          await this.shareToTwitter(message);
          break;
        default:
          throw new Error(`Partage non supporté pour ${platform.name}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Construit le message de partage
   */
  private static buildShareMessage(options?: ShareOptions): string {
    let message = options?.title || "Vidéo créée avec Visions";

    if (options?.description) {
      message += `\n\n${options.description}`;
    }

    if (options?.hashtags && options.hashtags.length > 0) {
      message += `\n\n${options.hashtags.map((tag) => `#${tag}`).join(" ")}`;
    }

    return message;
  }

  /**
   * Partage spécifique pour TikTok
   */
  private static async shareToTikTok(message: string): Promise<void> {
    try {
      // TikTok utilise un intent spécial sur Android
      if (Platform.OS === "android") {
        const tiktokUrl = `tiktok://share?text=${encodeURIComponent(message)}`;
        await Linking.openURL(tiktokUrl);
      } else {
        // Sur iOS, ouvrir TikTok et laisser l'utilisateur importer
        await Linking.openURL("tiktok://");
      }

      Alert.alert(
        "🎵 TikTok ouvert",
        'Votre vidéo a été sauvegardée dans votre galerie.\n\nDans TikTok :\n1. Appuyez sur "+" pour créer\n2. Sélectionnez votre vidéo dans la galerie\n3. Ajoutez votre description et publiez !',
        [{ text: "Compris" }]
      );
    } catch (error) {
      throw new Error("Impossible d'ouvrir TikTok");
    }
  }

  /**
   * Partage spécifique pour Instagram
   */
  private static async shareToInstagram(message: string): Promise<void> {
    try {
      // Instagram Stories peut accepter des vidéos directement
      if (Platform.OS === "android") {
        const instagramUrl = `instagram://share?text=${encodeURIComponent(
          message
        )}`;
        await Linking.openURL(instagramUrl);
      } else {
        await Linking.openURL("instagram://camera");
      }

      Alert.alert(
        "📸 Instagram ouvert",
        "Votre vidéo a été sauvegardée dans votre galerie.\n\nDans Instagram :\n1. Créez un nouveau Reel ou Story\n2. Sélectionnez votre vidéo\n3. Ajoutez votre description et publiez !",
        [{ text: "Compris" }]
      );
    } catch (error) {
      throw new Error("Impossible d'ouvrir Instagram");
    }
  }

  /**
   * Partage spécifique pour YouTube
   */
  private static async shareToYouTube(message: string): Promise<void> {
    try {
      // YouTube nécessite généralement l'app YouTube Studio
      await Linking.openURL("youtube://");

      Alert.alert(
        "📺 YouTube ouvert",
        'Votre vidéo a été sauvegardée dans votre galerie.\n\nPour publier sur YouTube :\n1. Ouvrez YouTube Studio\n2. Appuyez sur "+" puis "Importer une vidéo"\n3. Sélectionnez votre vidéo\n4. Ajoutez titre, description et publiez !',
        [
          {
            text: "Ouvrir YouTube Studio",
            onPress: () => Linking.openURL("https://studio.youtube.com"),
          },
          { text: "Plus tard" },
        ]
      );
    } catch (error) {
      throw new Error("Impossible d'ouvrir YouTube");
    }
  }

  /**
   * Partage spécifique pour Facebook
   */
  private static async shareToFacebook(message: string): Promise<void> {
    try {
      const facebookUrl = `fb://share?text=${encodeURIComponent(message)}`;
      await Linking.openURL(facebookUrl);

      Alert.alert(
        "📘 Facebook ouvert",
        "Votre vidéo a été sauvegardée dans votre galerie.\n\nDans Facebook :\n1. Créez une nouvelle publication\n2. Ajoutez votre vidéo\n3. Ajoutez votre description et publiez !",
        [{ text: "Compris" }]
      );
    } catch (error) {
      throw new Error("Impossible d'ouvrir Facebook");
    }
  }

  /**
   * Partage spécifique pour Twitter
   */
  private static async shareToTwitter(message: string): Promise<void> {
    try {
      const twitterUrl = `twitter://post?message=${encodeURIComponent(
        message
      )}`;
      await Linking.openURL(twitterUrl);

      Alert.alert(
        "🐦 Twitter ouvert",
        "Votre vidéo a été sauvegardée dans votre galerie.\n\nDans Twitter :\n1. Créez un nouveau tweet\n2. Ajoutez votre vidéo\n3. Ajoutez votre texte et publiez !",
        [{ text: "Compris" }]
      );
    } catch (error) {
      throw new Error("Impossible d'ouvrir Twitter");
    }
  }
}
