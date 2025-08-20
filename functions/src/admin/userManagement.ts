import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserRole } from '../../src/types/user';

const db = admin.firestore();

interface UpdateUserRoleRequest {
  userId: string;
  newRole: UserRole;
  adminId: string;
}

/**
 * Cloud Function sécurisée pour mettre à jour le rôle d'un utilisateur
 * Remplace la logique côté client pour plus de sécurité
 */
export const updateUserRole = functions.https.onCall(
  async (data: UpdateUserRoleRequest, context) => {
    // Vérification de l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    // Vérification des permissions admin
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Utilisateur admin non trouvé'
      );
    }

    const adminData = adminDoc.data();
    if (adminData?.role !== UserRole.SUPER_ADMIN) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Seuls les super admins peuvent modifier les rôles'
      );
    }

    const { userId, newRole } = data;

    // Validation des données
    if (!userId || !newRole) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId et newRole requis'
      );
    }

    // Empêcher la modification des super admins
    if (newRole === UserRole.SUPER_ADMIN) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Impossible de créer de nouveaux super admins'
      );
    }

    try {
      // Mise à jour du rôle
      await db.collection('users').doc(userId).update({
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid
      });

      // Log de l'action
      await db.collection('adminLogs').add({
        action: 'role_update',
        targetUserId: userId,
        newRole,
        adminId: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: context.rawRequest.ip
      });

      return { success: true, message: 'Rôle mis à jour avec succès' };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour du rôle'
      );
    }
  }
);

/**
 * Cloud Function pour récupérer les statistiques administratives
 */
export const getAdminStats = functions.https.onCall(
  async (data, context) => {
    // Vérification de l'authentification et des permissions
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non authentifié');
    }

    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== UserRole.SUPER_ADMIN) {
      throw new functions.https.HttpsError('permission-denied', 'Accès refusé');
    }

    try {
      // Calcul des statistiques côté serveur pour plus de sécurité
      const [usersSnapshot, scriptsSnapshot, recordingsSnapshot] = await Promise.all([
        db.collection('users').get(),
        db.collection('scripts').get(),
        db.collection('recordings').get()
      ]);

      const stats = {
        totalUsers: usersSnapshot.size,
        totalScripts: scriptsSnapshot.size,
        totalRecordings: recordingsSnapshot.size,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      // Cache des statistiques
      await db.collection('adminStats').doc('global').set(stats);

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des stats:', error);
      throw new functions.https.HttpsError('internal', 'Erreur serveur');
    }
  }
);
