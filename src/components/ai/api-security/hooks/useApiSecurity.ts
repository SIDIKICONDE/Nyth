import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from '../../../../hooks/useTranslation';
import { SecureApiKeyService } from '../../../../services/secureApiKey';
import { ApiKey } from '../types';

export const useApiSecurity = () => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    try {
      setIsLoading(true);
      
      
      // Charger les clés
      const keys = await SecureApiKeyService.listAvailableKeys();
      setApiKeys(keys);
      
      // Nettoyer les clés expirées
      await SecureApiKeyService.cleanupExpiredKeys();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    Alert.alert(
      t('security.delete.title', '🗑️ Supprimer la clé'),
      t('security.delete.message', `Êtes-vous sûr de vouloir supprimer la clé ${provider} ? Cette action est irréversible.`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('security.delete.confirm', 'Supprimer'),
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await SecureApiKeyService.deleteApiKey(provider, false);
              if (success) {
                await checkSecurityStatus();
                Alert.alert(
                  t('common.success'),
                  t('security.delete.success', `Clé ${provider} supprimée avec succès`)
                );
              } else {
                Alert.alert(
                  t('common.error'),
                  t('security.delete.error', 'Erreur lors de la suppression')
                );
              }
            } catch {
              Alert.alert(
                t('common.error'),
                t('security.delete.error', 'Erreur lors de la suppression')
              );
            }
          }
        }
      ]
    );
  };

  const handleMigrateKeys = async () => {
    Alert.alert(
      t('security.migrate.title', '🔐 Migration Sécurisée'),
      t('security.migrate.message', 'Voulez-vous migrer vos clés API vers le stockage sécurisé avec authentification biométrique ?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('security.migrate.confirm', 'Migrer'),
          onPress: async () => {
            try {
              const result = await SecureApiKeyService.migrateExistingKeys();
              await checkSecurityStatus();
              
              if (result.failed === 0 && result.success > 0) {
                Alert.alert(
                  t('common.success'),
                  t('security.migrate.success', 'Clés migrées avec succès !')
                );
              } else if (result.success > 0 && result.failed > 0) {
                Alert.alert(
                  t('security.migrate.partial', 'Migration Partielle'),
                  t('security.migrate.partialMessage', 
                    `${result.success} clé(s) migrée(s) avec succès.\n${result.failed} clé(s) ont échoué.\n\nErreurs:\n${result.errors.join('\n')}`
                  )
                );
              } else if (result.failed > 0) {
                Alert.alert(
                  t('common.error'),
                  t('security.migrate.error', 'Erreur lors de la migration') + '\n\n' + result.errors.join('\n')
                );
              } else {
                Alert.alert(
                  t('common.info'),
                  t('security.migrate.noKeys', 'Aucune clé à migrer')
                );
              }
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('security.migrate.error', 'Erreur lors de la migration') + '\n\n' + 
                (error instanceof Error ? error.message : 'Erreur inconnue')
              );
            }
          }
        }
      ]
    );
  };

  return {
    apiKeys,  
    isLoading,
    expandedKey,
    setExpandedKey,
    handleDeleteKey,
    handleMigrateKeys,
    checkSecurityStatus,
  };
}; 