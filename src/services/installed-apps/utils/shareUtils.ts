import { Linking } from 'react-native';
import { SocialApp, ShareContent } from '../types';

/**
 * Utilitaires pour le partage vers les applications sociales
 */
export class ShareUtils {
  /**
   * Génère l'URL de partage selon l'application
   */
  public static generateShareUrl(app: SocialApp, content: ShareContent): string {
    switch (app.id) {
      case 'instagram':
        if (content.videoPath) {
          return 'instagram://camera';
        } else {
          return `instagram://share?text=${encodeURIComponent(content.text || '')}`;
        }

      case 'facebook':
        let fbUrl = `fb://share?text=${encodeURIComponent(content.text || '')}`;
        if (content.url) {
          fbUrl += `&url=${encodeURIComponent(content.url)}`;
        }
        return fbUrl;

      case 'twitter':
        let twitterUrl = `twitter://post?message=${encodeURIComponent(content.text || '')}`;
        if (content.url) {
          twitterUrl += `&url=${encodeURIComponent(content.url)}`;
        }
        return twitterUrl;

      case 'whatsapp':
        return `whatsapp://send?text=${encodeURIComponent(
          (content.text || '') + (content.url ? ` ${content.url}` : '')
        )}`;

      case 'telegram':
        return `tg://msg?text=${encodeURIComponent(
          (content.text || '') + (content.url ? ` ${content.url}` : '')
        )}`;

      default:
        return '';
    }
  }

  /**
   * Vérifie si le partage est possible pour une application
   */
  public static async canShare(app: SocialApp, content: ShareContent): Promise<boolean> {
    if (!app.shareSupported) {
      return false;
    }

    // TikTok nécessite un traitement spécial
    if (app.id === 'tiktok') {
      return true; // On peut toujours ouvrir TikTok
    }

    const shareUrl = this.generateShareUrl(app, content);
    if (!shareUrl) {
      return false;
    }

    try {
      return await Linking.canOpenURL(shareUrl);
    } catch (error) {
      return false;
    }
  }

  /**
   * Exécute le partage vers une application
   */
  public static async executeShare(app: SocialApp, content: ShareContent): Promise<boolean> {
    try {
      // TikTok: ouverture simple de l'app
      if (app.id === 'tiktok') {
        return true; // Le service principal gère l'ouverture
      }

      const shareUrl = this.generateShareUrl(app, content);
      if (!shareUrl) {
        return false;
      }

      const canOpen = await Linking.canOpenURL(shareUrl);
      if (canOpen) {
        await Linking.openURL(shareUrl);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
} 