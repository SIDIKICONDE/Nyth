import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

// Types
import { AudioFolder, AudioRecording } from '../types';

interface AudioFolderDetailProps {
  folder: AudioFolder;
  recordings: AudioRecording[];
  onClose: () => void;
  onPlayRecording: (recording: AudioRecording) => void;
  onDeleteRecording: (recordingId: string) => void;
  onShareRecording: (recording: AudioRecording) => void;
  onEditRecording: (recording: AudioRecording) => void;
  onCreateRecording: () => void;
}

export default function AudioFolderDetail({
  folder,
  recordings,
  onClose,
  onPlayRecording,
  onDeleteRecording,
  onShareRecording,
  onEditRecording,
  onCreateRecording,
}: AudioFolderDetailProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Animations
  const headerScale = useSharedValue(1);
  const pulseAnimation = useSharedValue(1);

  const handleRecordingPress = (recording: AudioRecording) => {
    if (isSelectionMode) {
      toggleRecordingSelection(recording.id);
    } else {
      onPlayRecording(recording);
      setPlayingId(recording.id);
    }
  };

  const handleRecordingLongPress = (recording: AudioRecording) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      toggleRecordingSelection(recording.id);
    }
  };

  const toggleRecordingSelection = (recordingId: string) => {
    setSelectedRecordings(prev =>
      prev.includes(recordingId)
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId],
    );
  };

  const clearSelection = () => {
    setSelectedRecordings([]);
    setIsSelectionMode(false);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      t('audio.deleteRecordings.title', 'Supprimer les enregistrements'),
      t(
        'audio.deleteRecordings.message',
        `Supprimer ${selectedRecordings.length} enregistrement(s) ?`,
      ),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.delete', 'Supprimer'),
          style: 'destructive',
          onPress: () => {
            selectedRecordings.forEach(id => onDeleteRecording(id));
            clearSelection();
          },
        },
      ],
    );
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  const renderRecording = ({ item }: { item: AudioRecording }) => {
    const isSelected = selectedRecordings.includes(item.id);
    const isPlaying = playingId === item.id;

    return (
      <TouchableOpacity
        onPress={() => handleRecordingPress(item)}
        onLongPress={() => handleRecordingLongPress(item)}
        style={[
          tw`flex-row items-center p-4 rounded-lg mb-2 mx-4`,
          {
            backgroundColor: isSelected
              ? currentTheme.colors.accent + '20'
              : currentTheme.colors.background,
            borderWidth: 1,
            borderColor: isSelected
              ? currentTheme.colors.accent
              : currentTheme.colors.border,
          },
        ]}
      >
        {/* Icône de lecture avec animation */}
        <View style={tw`mr-3`}>
          <LinearGradient
            colors={
              isPlaying
                ? ['#10B981', '#059669'] // Vert pour lecture
                : ['#6B7280', '#4B5563'] // Gris pour pause
            }
            style={tw`w-10 h-10 rounded-full items-center justify-center`}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={isPlaying ? 'pause' : 'play'} size={16} color="white" />
          </LinearGradient>
        </View>

        {/* Informations de l'enregistrement */}
        <View style={tw`flex-1`}>
          <Text
            style={[
              tw`font-semibold text-base`,
              { color: currentTheme.colors.text },
            ]}
            numberOfLines={1}
          >
            {item.title || `Enregistrement ${item.id.slice(-4)}`}
          </Text>
          <Text
            style={[
              tw`text-sm mt-1`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {formatDuration(item.duration)} • {formatDate(item.createdAt)}
          </Text>
          {item.transcription && (
            <Text
              style={[
                tw`text-xs mt-1`,
                { color: currentTheme.colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {item.transcription}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={tw`flex-row items-center`}>
          {isSelectionMode ? (
            <Icon
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={
                isSelected
                  ? currentTheme.colors.accent
                  : currentTheme.colors.textSecondary
              }
            />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => onShareRecording(item)}
                style={tw`p-2 mr-1`}
              >
                <Icon
                  name="share"
                  size={16}
                  color={currentTheme.colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onEditRecording(item)}
                style={tw`p-2 mr-1`}
              >
                <Icon
                  name="pencil"
                  size={16}
                  color={currentTheme.colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    t('audio.deleteRecording.title', 'Supprimer'),
                    t(
                      'audio.deleteRecording.message',
                      'Supprimer cet enregistrement ?',
                    ),
                    [
                      { text: t('common.cancel', 'Annuler'), style: 'cancel' },
                      {
                        text: t('common.delete', 'Supprimer'),
                        style: 'destructive',
                        onPress: () => onDeleteRecording(item.id),
                      },
                    ],
                  );
                }}
                style={tw`p-2`}
              >
                <Icon name="trash" size={16} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyRecordings = () => (
    <View style={tw`flex-1 items-center justify-center p-8`}>
      <LinearGradient
        colors={[
          folder.color || currentTheme.colors.accent,
          `${folder.color || currentTheme.colors.accent}80`,
        ]}
        style={tw`w-20 h-20 rounded-full items-center justify-center mb-4`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name="mic" size={32} color="white" />
      </LinearGradient>
      <Text
        style={[
          tw`text-lg font-semibold text-center mb-2`,
          { color: currentTheme.colors.text },
        ]}
      >
        {t('audio.emptyRecordings.title', 'Aucun enregistrement')}
      </Text>
      <Text
        style={[
          tw`text-sm text-center mb-6`,
          { color: currentTheme.colors.textSecondary },
        ]}
      >
        {t(
          'audio.emptyRecordings.message',
          'Créez votre premier enregistrement dans ce dossier',
        )}
      </Text>
      <TouchableOpacity
        onPress={onCreateRecording}
        style={[
          tw`px-6 py-3 rounded-lg`,
          { backgroundColor: folder.color || currentTheme.colors.accent },
        ]}
      >
        <Text style={tw`text-white font-semibold`}>
          {t('audio.createRecording', 'Nouvel enregistrement')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      {/* Header avec gradient */}
      <LinearGradient
        colors={[
          folder.color || currentTheme.colors.accent,
          `${folder.color || currentTheme.colors.accent}80`,
        ]}
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
          <View style={tw`flex-row`}>
            <TouchableOpacity
              onPress={() => setIsSelectionMode(!isSelectionMode)}
              style={tw`p-2 rounded-full bg-white/20 mr-2`}
            >
              <Icon
                name={isSelectionMode ? 'close' : 'checkmark-circle-outline'}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`items-center`}>
          <View
            style={tw`w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-3`}
          >
            <MaterialIcon name="folder" size={24} color="white" />
          </View>
          <Text style={tw`text-white text-xl font-bold text-center mb-1`}>
            {folder.name}
          </Text>
          {folder.description && (
            <Text style={tw`text-white/80 text-center mb-3`}>
              {folder.description}
            </Text>
          )}
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-white/90 text-sm mr-4`}>
              {recordings.length} {t('audio.recordings', 'enregistrements')}
            </Text>
            <Text style={tw`text-white/90 text-sm`}>
              {formatDuration(folder.totalDuration)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Actions de sélection */}
      {isSelectionMode && (
        <View
          style={[
            tw`flex-row items-center justify-between px-4 py-3`,
            {
              backgroundColor: currentTheme.colors.accent + '10',
              borderBottomWidth: 1,
              borderBottomColor: currentTheme.colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={clearSelection}>
            <Text style={{ color: currentTheme.colors.accent }}>
              {t('common.cancel', 'Annuler')}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: currentTheme.colors.text }}>
            {selectedRecordings.length} {t('audio.selected', 'sélectionné(s)')}
          </Text>
          {selectedRecordings.length > 0 && (
            <TouchableOpacity onPress={handleDeleteSelected}>
              <Text style={tw`text-red-500 font-semibold`}>
                {t('common.delete', 'Supprimer')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Liste des enregistrements */}
      <FlatList
        data={recordings}
        renderItem={renderRecording}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyRecordings}
        contentContainerStyle={[
          tw`pb-24`,
          recordings.length === 0 && tw`flex-1`,
        ]}
      />

      {/* Bouton d'enregistrement flottant */}
      {!isSelectionMode && (
        <TouchableOpacity
          onPress={onCreateRecording}
          style={[
            tw`absolute right-6 rounded-full items-center justify-center`,
            {
              bottom: insets.bottom + 20,
              width: 56,
              height: 56,
              backgroundColor: folder.color || currentTheme.colors.accent,
            },
          ]}
        >
          <Icon name="mic" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
