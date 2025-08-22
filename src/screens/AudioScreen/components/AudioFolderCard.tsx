import React from 'react';
import { View, Text, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

// Composants personnalisés
import RippleButton, { useMicroInteractions } from './RippleButton';

// Types
import { AudioFolder } from '../types';

interface AudioFolderCardProps {
  folder: AudioFolder;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}

export default function AudioFolderCard({
  folder,
  isSelected,
  isSelectionMode,
  onPress,
  onLongPress,
  onDelete,
}: AudioFolderCardProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Hook pour les micro-interactions
  const { triggerImpact, triggerError } = useMicroInteractions();

  // Animations améliorées
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const selectedScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const bounceScale = useSharedValue(1);

  // Styles animés améliorés
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { scale: bounceScale.value }],
    opacity: opacity.value,
  }));

  const selectedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectedScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1.05 }],
  }));

  // Gestion des animations avec micro-interactions
  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0.3, { duration: 150 });
    triggerImpact('light');
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    glowOpacity.value = withTiming(0, { duration: 200 });
  };

  const handlePress = () => {
    // Animation de bounce pour feedback visuel
    bounceScale.value = withSequence(
      withTiming(1.02, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );

    triggerImpact('light');
    onPress();
  };

  const handleLongPress = () => {
    selectedScale.value = withSpring(
      0.95,
      { damping: 15, stiffness: 300 },
      () => {
        runOnJS(onLongPress)();
        selectedScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      },
    );

    triggerImpact('medium');
  };

  // Formater la durée
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  // Formater la taille
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDelete = () => {
    triggerError();
    Alert.alert(
      t('audio.deleteFolder.title', 'Supprimer le dossier'),
      t(
        'audio.deleteFolder.message',
        `Êtes-vous sûr de vouloir supprimer "${folder.name}" ? Tous les enregistrements seront perdus.`,
      ),
      [
        {
          text: t('common.cancel', 'Annuler'),
          style: 'cancel',
          onPress: () => triggerImpact('light'),
        },
        {
          text: t('common.delete', 'Supprimer'),
          style: 'destructive',
          onPress: () => {
            triggerError();
            onDelete();
          },
        },
      ],
    );
  };

  return (
    <Animated.View
      testID="folder-card-container"
      style={[
        tw`m-2 rounded-2xl overflow-hidden`,
        { width: '45%' },
        animatedStyle,
      ]}
    >
      <RippleButton
        testID="folder-card"
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        style={tw`flex-1`}
        rippleColor="rgba(255,255,255,0.3)"
        hapticType="light"
        borderRadius={16}
        accessibilityRole="button"
        accessibilityLabel={`Dossier ${folder.name} avec ${folder.recordingCount} enregistrements`}
      >
        {/* Gradient de fond */}
        <LinearGradient
          testID="folder-gradient"
          colors={[
            folder.color || currentTheme.colors.accent,
            `${folder.color || currentTheme.colors.accent}80`,
          ]}
          style={tw`p-4 h-48 justify-between rounded-2xl relative overflow-hidden`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Effet de glow */}
          <Animated.View
            style={[
              tw`absolute inset-0 rounded-2xl`,
              {
                backgroundColor: folder.color || currentTheme.colors.accent,
              },
              glowStyle,
            ]}
          />
          {/* En-tête avec icône et favori */}
          <View style={tw`flex-row items-center justify-between`}>
            <View testID="folder-icon" style={tw`bg-white/20 rounded-full p-2`}>
              <MaterialIcon
                name={(folder.icon as any) || 'folder'}
                size={20}
                color="white"
              />
            </View>

            {folder.isFavorite && (
              <Icon
                testID="favorite-icon"
                name="heart"
                size={16}
                color="white"
              />
            )}
          </View>

          {/* Contenu principal */}
          <View style={tw`flex-1 justify-center`}>
            <Text
              style={tw`text-white font-bold text-lg mb-2`}
              numberOfLines={2}
            >
              {folder.name}
            </Text>

            {folder.description && (
              <Text style={tw`text-white/80 text-sm mb-2`} numberOfLines={2}>
                {folder.description}
              </Text>
            )}
          </View>

          {/* Statistiques */}
          <View style={tw`bg-white/10 rounded-lg p-2`}>
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={tw`text-white/90 text-xs`}>
                {folder.recordingCount} enregistrement
                {folder.recordingCount > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={tw`text-white/80 text-xs`}>
              {formatDuration(folder.totalDuration)}
            </Text>
          </View>
        </LinearGradient>

        {/* Overlay de sélection */}
        {isSelectionMode && (
          <Animated.View
            testID="selection-indicator"
            style={[
              tw`absolute top-2 right-2 bg-white rounded-full p-1 z-10`,
              selectedAnimatedStyle,
            ]}
          >
            <Icon
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={
                isSelected
                  ? currentTheme.colors.accent
                  : currentTheme.colors.textSecondary
              }
            />
          </Animated.View>
        )}

        {/* Bouton de suppression (visible en mode normal) */}
        {!isSelectionMode && (
          <RippleButton
            testID="delete-button"
            onPress={handleDelete}
            style={tw`absolute top-2 right-2 bg-black/20 rounded-full p-1 z-10`}
            rippleColor="rgba(239,68,68,0.3)"
            hapticType="error"
            borderRadius={12}
          >
            <Icon name="trash" size={16} color="white" />
          </RippleButton>
        )}
      </RippleButton>
    </Animated.View>
  );
}
