import { httpsCallable } from '@react-native-firebase/functions';
import { UserRole } from '../types/user';
import { createLogger } from '../utils/optimizedLogger';

const logger = createLogger('AdminCloudService');

interface UpdateUserRoleRequest {
  userId: string;
  newRole: UserRole;
  adminId: string;
}

interface AdminStats {
  totalUsers: number;
  totalScripts: number;
  totalRecordings: number;
  timestamp: any;
}

/**
 * Service client pour les Cloud Functions administratives
 * Remplace les appels directs à Firestore pour plus de sécurité
 */
class AdminCloudService {
  /**
   * Met à jour le rôle d'un utilisateur via Cloud Function
   */
  async updateUserRole(request: UpdateUserRoleRequest): Promise<{ success: boolean; message: string }> {
    try {
      const updateUserRoleFunction = httpsCallable('updateUserRole');
      const result = await updateUserRoleFunction(request);

      logger.info('Rôle utilisateur mis à jour avec succès', { userId: request.userId });
      return result.data as { success: boolean; message: string };
    } catch (error: any) {
      logger.error('Erreur lors de la mise à jour du rôle:', error);

      // Gestion des erreurs Firebase Functions
      if (error.code === 'permission-denied') {
        throw new Error('Permissions insuffisantes pour cette action');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Données invalides fournies');
      } else {
        throw new Error('Erreur lors de la mise à jour du rôle');
      }
    }
  }

  /**
   * Récupère les statistiques administratives via Cloud Function
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      const getAdminStatsFunction = httpsCallable('getAdminStats');
      const result = await getAdminStatsFunction();

      logger.info('Statistiques administratives récupérées');
      return result.data as AdminStats;
    } catch (error: any) {
      logger.error('Erreur lors de la récupération des stats:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Accès refusé aux statistiques');
      } else {
        throw new Error('Erreur lors de la récupération des statistiques');
      }
    }
  }

  /**
   * Synchronise les enregistrements via Cloud Function
   */
  async syncRecordings(): Promise<{ success: boolean; message: string }> {
    try {
      const syncRecordingsFunction = httpsCallable('syncRecordings');
      const result = await syncRecordingsFunction();

      logger.info('Synchronisation des enregistrements terminée');
      return result.data as { success: boolean; message: string };
    } catch (error: any) {
      logger.error('Erreur lors de la synchronisation:', error);
      throw new Error('Erreur lors de la synchronisation des enregistrements');
    }
  }
}

export const adminCloudService = new AdminCloudService();
