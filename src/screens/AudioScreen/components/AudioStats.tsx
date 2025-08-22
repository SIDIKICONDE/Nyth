import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

// Types
import { AudioFolder } from '../types';

interface AudioStatsProps {
  folders: AudioFolder[];
  globalStats: {
    totalFolders: number;
    totalRecordings: number;
    totalDuration: number;
    favoriteFolders: number;
    averageRecordingsPerFolder: number;
    averageDurationPerFolder: number;
  };
  onClose: () => void;
}

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  gradient: [string, string];
  iconType?: 'ionicon' | 'material';
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  gradient,
  iconType = 'ionicon',
}: StatCardProps) {
  const { currentTheme } = useTheme();

  const IconComponent = iconType === 'material' ? MaterialIcon : Icon;

  return (
    <LinearGradient
      colors={gradient}
      style={tw`p-4 rounded-xl mb-4`}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={tw`flex-row items-center mb-2`}>
        <View
          style={tw`w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-3`}
        >
          <IconComponent name={icon as any} size={16} color="white" />
        </View>
        <View style={tw`flex-1`}>
          <Text style={tw`text-white font-bold text-lg`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          <Text style={tw`text-white/80 text-sm`}>{title}</Text>
        </View>
      </View>
      {subtitle && (
        <Text style={tw`text-white/70 text-xs mt-2`}>{subtitle}</Text>
      )}
    </LinearGradient>
  );
}

export default function AudioStats({
  folders,
  globalStats,
  onClose,
}: AudioStatsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Calculer des statistiques supplémentaires
  const totalSize = folders.reduce((sum, folder) => {
    return sum + folder.recordingCount * 1024 * 1024; // Estimation 1MB par enregistrement
  }, 0);

  const mostActiveFolder = folders.reduce(
    (max, folder) =>
      folder.recordingCount > max.recordingCount ? folder : max,
    folders[0] || null,
  );

  const oldestFolder = folders.reduce(
    (oldest, folder) => (folder.createdAt < oldest.createdAt ? folder : oldest),
    folders[0] || null,
  );

  const newestFolder = folders.reduce(
    (newest, folder) => (folder.createdAt > newest.createdAt ? folder : newest),
    folders[0] || null,
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            {t('audio.stats.title', 'Statistiques')}
          </Text>
          <View style={tw`w-10`} />
        </View>

        <View style={tw`items-center`}>
          <View
            style={tw`w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-3`}
          >
            <Icon name="stats-chart" size={24} color="white" />
          </View>
          <Text style={tw`text-white/90 text-center text-sm`}>
            {t('audio.stats.subtitle', 'Aperçu de votre activité audio')}
          </Text>
        </View>
      </LinearGradient>

      {/* Contenu scrollable */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`p-4 pb-8`}
      >
        {/* Statistiques principales */}
        <View style={tw`mb-6`}>
          <Text
            style={[
              tw`text-lg font-bold mb-4`,
              { color: currentTheme.colors.text },
            ]}
          >
            {t('audio.stats.overview', 'Aperçu général')}
          </Text>

          <StatCard
            icon="folder"
            title={t('audio.stats.totalFolders', 'Dossiers totaux')}
            value={globalStats.totalFolders}
            subtitle={t('audio.stats.foldersDesc', 'Organisés et étiquetés')}
            gradient={['#4CAF50', '#45A049']}
          />

          <StatCard
            icon="mic"
            title={t('audio.stats.totalRecordings', 'Enregistrements')}
            value={globalStats.totalRecordings}
            subtitle={t(
              'audio.stats.recordingsDesc',
              'Capturés et sauvegardés',
            )}
            gradient={['#2196F3', '#1976D2']}
          />

          <StatCard
            icon="time"
            title={t('audio.stats.totalDuration', 'Durée totale')}
            value={formatDuration(globalStats.totalDuration)}
            subtitle={t('audio.stats.durationDesc', 'De contenu audio')}
            gradient={['#FF9800', '#F57C00']}
          />

          <StatCard
            icon="heart"
            title={t('audio.stats.favorites', 'Favoris')}
            value={globalStats.favoriteFolders}
            subtitle={t('audio.stats.favoritesDesc', 'Dossiers favoris')}
            gradient={['#E91E63', '#C2185B']}
          />
        </View>

        {/* Statistiques détaillées */}
        <View style={tw`mb-6`}>
          <Text
            style={[
              tw`text-lg font-bold mb-4`,
              { color: currentTheme.colors.text },
            ]}
          >
            {t('audio.stats.details', 'Détails')}
          </Text>

          <View
            style={[
              tw`p-4 rounded-lg mb-4`,
              {
                backgroundColor: currentTheme.colors.background,
                borderWidth: 1,
                borderColor: currentTheme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                tw`text-sm font-semibold mb-3`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t('audio.stats.averages', 'Moyennes')}
            </Text>

            <View style={tw`space-y-3`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={{ color: currentTheme.colors.textSecondary }}>
                  {t(
                    'audio.stats.avgRecordings',
                    'Enregistrements par dossier',
                  )}
                  :
                </Text>
                <Text style={{ color: currentTheme.colors.text }}>
                  {globalStats.averageRecordingsPerFolder.toFixed(1)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between items-center`}>
                <Text style={{ color: currentTheme.colors.textSecondary }}>
                  {t('audio.stats.avgDuration', 'Durée par dossier')}:
                </Text>
                <Text style={{ color: currentTheme.colors.text }}>
                  {formatDuration(globalStats.averageDurationPerFolder)}
                </Text>
              </View>

              <View style={tw`flex-row justify-between items-center`}>
                <Text style={{ color: currentTheme.colors.textSecondary }}>
                  {t('audio.stats.totalSize', 'Taille totale')}:
                </Text>
                <Text style={{ color: currentTheme.colors.text }}>
                  {formatSize(totalSize)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dossiers spéciaux */}
        {folders.length > 0 && (
          <View style={tw`mb-6`}>
            <Text
              style={[
                tw`text-lg font-bold mb-4`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t('audio.stats.special', 'Dossiers spéciaux')}
            </Text>

            {mostActiveFolder && (
              <View
                style={[
                  tw`p-4 rounded-lg mb-3`,
                  {
                    backgroundColor: currentTheme.colors.background,
                    borderWidth: 1,
                    borderColor: currentTheme.colors.border,
                  },
                ]}
              >
                <View style={tw`flex-row items-center mb-2`}>
                  <Icon
                    name="trophy"
                    size={16}
                    color="#FFD700"
                    style={tw`mr-2`}
                  />
                  <Text
                    style={[
                      tw`font-semibold`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {t('audio.stats.mostActive', 'Plus actif')}
                  </Text>
                </View>
                <Text style={{ color: currentTheme.colors.text }}>
                  {mostActiveFolder.name}
                </Text>
                <Text style={{ color: currentTheme.colors.textSecondary }}>
                  {mostActiveFolder.recordingCount} enregistrements
                </Text>
              </View>
            )}

            {newestFolder && (
              <View
                style={[
                  tw`p-4 rounded-lg mb-3`,
                  {
                    backgroundColor: currentTheme.colors.background,
                    borderWidth: 1,
                    borderColor: currentTheme.colors.border,
                  },
                ]}
              >
                <View style={tw`flex-row items-center mb-2`}>
                  <Icon
                    name="sparkles"
                    size={16}
                    color="#10B981"
                    style={tw`mr-2`}
                  />
                  <Text
                    style={[
                      tw`font-semibold`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {t('audio.stats.newest', 'Plus récent')}
                  </Text>
                </View>
                <Text style={{ color: currentTheme.colors.text }}>
                  {newestFolder.name}
                </Text>
                <Text style={{ color: currentTheme.colors.textSecondary }}>
                  {formatDate(newestFolder.createdAt)}
                </Text>
              </View>
            )}

            {oldestFolder && oldestFolder !== newestFolder && (
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
                <View style={tw`flex-row items-center mb-2`}>
                  <Icon
                    name="time"
                    size={16}
                    color="#6B7280"
                    style={tw`mr-2`}
                  />
                  <Text
                    style={[
                      tw`font-semibold`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {t('audio.stats.oldest', 'Plus ancien')}
                  </Text>
                </View>
                <Text style={{ color: currentTheme.colors.text }}>
                  {oldestFolder.name}
                </Text>
                <Text style={{ color: currentTheme.colors.textSecondary }}>
                  {formatDate(oldestFolder.createdAt)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Résumé et conseils */}
        <View
          style={[
            tw`p-4 rounded-lg`,
            {
              backgroundColor: currentTheme.colors.accent + '10',
              borderWidth: 1,
              borderColor: currentTheme.colors.accent + '30',
            },
          ]}
        >
          <Text
            style={[
              tw`text-sm font-semibold mb-2`,
              { color: currentTheme.colors.accent },
            ]}
          >
            💡 {t('audio.stats.tips', 'Conseils')}
          </Text>
          <Text
            style={[
              tw`text-sm leading-5`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {globalStats.totalRecordings === 0
              ? t(
                  'audio.stats.emptyTips',
                  'Commencez par créer votre premier enregistrement !',
                )
              : t(
                  'audio.stats.usageTips',
                  "Continuez à enregistrer pour voir l'évolution de vos statistiques.",
                )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
