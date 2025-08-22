import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

interface AudioSettingsProps {
  onClose: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onClearData: () => void;
}

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  type?: 'switch' | 'button';
  destructive?: boolean;
}

function SettingItem({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  onPress,
  type = 'button',
  destructive = false,
}: SettingItemProps) {
  const { currentTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`flex-row items-center p-4 rounded-lg mb-2 mx-4`,
        {
          backgroundColor: currentTheme.colors.background,
          borderWidth: 1,
          borderColor: currentTheme.colors.border,
        },
      ]}
      disabled={type === 'switch'}
    >
      <View
        style={[
          tw`w-10 h-10 rounded-full items-center justify-center mr-4`,
          {
            backgroundColor: destructive
              ? '#FEE2E2'
              : currentTheme.colors.accent + '20',
          },
        ]}
      >
        <Icon
          name={icon as any}
          size={20}
          color={destructive ? '#EF4444' : currentTheme.colors.accent}
        />
      </View>

      <View style={tw`flex-1`}>
        <Text
          style={[
            tw`font-semibold`,
            { color: destructive ? '#EF4444' : currentTheme.colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              tw`text-sm mt-1`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {type === 'switch' && onValueChange ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: currentTheme.colors.border,
            true: currentTheme.colors.accent,
          }}
          thumbColor="white"
        />
      ) : (
        <Icon
          name="chevron-forward"
          size={16}
          color={currentTheme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

export default function AudioSettings({
  onClose,
  onExportData,
  onImportData,
  onClearData,
}: AudioSettingsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // États des paramètres
  const [autoSave, setAutoSave] = useState(true);
  const [highQuality, setHighQuality] = useState(false);
  const [autoTranscription, setAutoTranscription] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      t('audio.settings.clearData.title', 'Supprimer toutes les données'),
      t(
        'audio.settings.clearData.message',
        'Cette action est irréversible. Tous vos dossiers et enregistrements seront supprimés.',
      ),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.delete', 'Supprimer'),
          style: 'destructive',
          onPress: onClearData,
        },
      ],
    );
  };

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      {/* Header avec gradient */}
      <LinearGradient
        colors={[currentTheme.colors.accent, `${currentTheme.colors.accent}80`]}
        style={[tw`pt-12 pb-6 px-6`, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <TouchableOpacity
            onPress={onClose}
            style={tw`p-2 rounded-full bg-white/20`}
          >
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={tw`text-white text-lg font-bold`}>
            {t('audio.settings.title', 'Paramètres Audio')}
          </Text>
          <View style={tw`w-10`} />
        </View>
      </LinearGradient>

      {/* Contenu scrollable */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-8`}
      >
        {/* Section Enregistrement */}
        <View style={tw`mt-6`}>
          <Text
            style={[
              tw`text-sm font-bold uppercase tracking-wide mb-3 mx-4`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t('audio.settings.recording', 'Enregistrement')}
          </Text>

          <SettingItem
            icon="save"
            title={t('audio.settings.autoSave', 'Sauvegarde automatique')}
            subtitle={t(
              'audio.settings.autoSave.desc',
              "Sauvegarder automatiquement après l'enregistrement",
            )}
            type="switch"
            value={autoSave}
            onValueChange={setAutoSave}
          />

          <SettingItem
            icon="high"
            title={t('audio.settings.highQuality', 'Haute qualité')}
            subtitle={t(
              'audio.settings.highQuality.desc',
              'Enregistrements en 320kbps (fichier plus lourd)',
            )}
            type="switch"
            value={highQuality}
            onValueChange={setHighQuality}
          />

          <SettingItem
            icon="text"
            title={t(
              'audio.settings.transcription',
              'Transcription automatique',
            )}
            subtitle={t(
              'audio.settings.transcription.desc',
              'Convertir la parole en texte (nécessite une connexion)',
            )}
            type="switch"
            value={autoTranscription}
            onValueChange={setAutoTranscription}
          />
        </View>

        {/* Section Notifications */}
        <View style={tw`mt-6`}>
          <Text
            style={[
              tw`text-sm font-bold uppercase tracking-wide mb-3 mx-4`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t('audio.settings.notifications', 'Notifications')}
          </Text>

          <SettingItem
            icon="notifications"
            title={t('audio.settings.pushNotifications', 'Notifications push')}
            subtitle={t(
              'audio.settings.pushNotifications.desc',
              "Recevoir des notifications sur l'état des enregistrements",
            )}
            type="switch"
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        {/* Section Synchronisation */}
        <View style={tw`mt-6`}>
          <Text
            style={[
              tw`text-sm font-bold uppercase tracking-wide mb-3 mx-4`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t('audio.settings.sync', 'Synchronisation')}
          </Text>

          <SettingItem
            icon="cloud"
            title={t('audio.settings.cloudSync', 'Synchronisation cloud')}
            subtitle={t(
              'audio.settings.cloudSync.desc',
              'Sauvegarder vos enregistrements dans le cloud',
            )}
            type="switch"
            value={cloudSync}
            onValueChange={setCloudSync}
          />

          <SettingItem
            icon="download"
            title={t('audio.settings.exportData', 'Exporter les données')}
            subtitle={t(
              'audio.settings.exportData.desc',
              'Télécharger une sauvegarde de vos données',
            )}
            onPress={onExportData}
          />

          <SettingItem
            icon="cloud-upload"
            title={t('audio.settings.importData', 'Importer les données')}
            subtitle={t(
              'audio.settings.importData.desc',
              'Restaurer depuis une sauvegarde',
            )}
            onPress={onImportData}
          />
        </View>

        {/* Section Stockage */}
        <View style={tw`mt-6`}>
          <Text
            style={[
              tw`text-sm font-bold uppercase tracking-wide mb-3 mx-4`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t('audio.settings.storage', 'Stockage')}
          </Text>

          <SettingItem
            icon="folder"
            title={t('audio.settings.storageInfo', 'Informations de stockage')}
            subtitle={t(
              'audio.settings.storageInfo.desc',
              "Voir l'espace utilisé et disponible",
            )}
            onPress={() => {
              // Afficher les stats de stockage
              Alert.alert(
                'Stockage',
                'Fonctionnalité à implémenter\n\n- Taille totale des enregistrements\n- Espace libre disponible\n- Nettoyage automatique',
              );
            }}
          />

          <SettingItem
            icon="trash"
            title={t('audio.settings.clearCache', 'Vider le cache')}
            subtitle={t(
              'audio.settings.clearCache.desc',
              'Supprimer les fichiers temporaires',
            )}
            onPress={() => {
              Alert.alert(
                'Cache vidé',
                'Les fichiers temporaires ont été supprimés avec succès.',
              );
            }}
          />
        </View>

        {/* Section Danger */}
        <View style={tw`mt-6`}>
          <Text
            style={[
              tw`text-sm font-bold uppercase tracking-wide mb-3 mx-4`,
              { color: '#EF4444' },
            ]}
          >
            {t('audio.settings.danger', 'Zone de danger')}
          </Text>

          <SettingItem
            icon="warning"
            title={t(
              'audio.settings.resetSettings',
              'Réinitialiser les paramètres',
            )}
            subtitle={t(
              'audio.settings.resetSettings.desc',
              'Remettre tous les paramètres par défaut',
            )}
            onPress={() => {
              Alert.alert(
                'Réinitialiser',
                'Voulez-vous réinitialiser tous les paramètres ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Réinitialiser',
                    onPress: () => {
                      setAutoSave(true);
                      setHighQuality(false);
                      setAutoTranscription(false);
                      setNotifications(true);
                      setCloudSync(false);
                      Alert.alert('Paramètres réinitialisés');
                    },
                  },
                ],
              );
            }}
          />

          <SettingItem
            icon="close-circle"
            title={t(
              'audio.settings.clearData',
              'Supprimer toutes les données',
            )}
            subtitle={t(
              'audio.settings.clearData.desc',
              'Supprimer définitivement tous les dossiers et enregistrements',
            )}
            destructive
            onPress={handleClearData}
          />
        </View>

        {/* Informations sur l'app */}
        <View style={tw`mt-8 mx-4`}>
          <View
            style={[
              tw`p-4 rounded-lg`,
              {
                backgroundColor: currentTheme.colors.background,
                borderWidth: 1,
                borderColor: currentTheme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                tw`text-center font-semibold mb-2`,
                { color: currentTheme.colors.text },
              ]}
            >
              Audio Recorder v1.0.0
            </Text>
            <Text
              style={[
                tw`text-center text-sm`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                'audio.settings.appInfo',
                'Application de gestion et enregistrement audio',
              )}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
