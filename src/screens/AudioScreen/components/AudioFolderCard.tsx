import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
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
} from 'react-native-reanimated';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

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

  // Animations
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const selectedScale = useSharedValue(1);

  // Styles animés
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const selectedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectedScale.value }],
  }));

  // Gestion des animations
  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleLongPress = () => {
    selectedScale.value = withSpring(0.95, {}, () => {
      runOnJS(onLongPress)();
      selectedScale.value = withSpring(1);
    });
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
    Alert.alert(
      t('audio.deleteFolder.title', 'Supprimer le dossier'),
      t(
        'audio.deleteFolder.message',
        `Êtes-vous sûr de vouloir supprimer "${folder.name}" ? Tous les enregistrements seront perdus.`,
      ),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.delete', 'Supprimer'),
          style: 'destructive',
          onPress: onDelete,
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
      <TouchableOpacity
        testID="folder-card"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        activeOpacity={1}
        style={tw`flex-1`}
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
          style={tw`p-4 h-48 justify-between rounded-2xl`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* En-tête avec icône et favori */}
          <View style={tw`flex-row items-center justify-between`}>
            <View testID="folder-icon" style={tw`bg-white/20 rounded-full p-2`}>
              <MaterialIcon
                name={(folder.icon as any) || 'folder'}
                size={20}
                color="white"
              />
            </View>

            {folder.isFavorite && <Icon testID="favorite-icon" name="heart" size={16} color="white" />}
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
              tw`absolute top-2 right-2 bg-white rounded-full p-1`,
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
          <TouchableOpacity
            testID="delete-button"
            onPress={handleDelete}
            style={tw`absolute top-2 right-2 bg-black/20 rounded-full p-1`}
            activeOpacity={0.7}
          >
            <Icon name="trash" size={16} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
