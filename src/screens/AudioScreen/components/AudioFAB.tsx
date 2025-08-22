import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
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

interface AudioFABProps {
  onPress: () => void;
  isRecording?: boolean;
  recordingDuration?: number;
}

export default function AudioFAB({
  onPress,
  isRecording = false,
  recordingDuration = 0,
}: AudioFABProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Animations
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const recordingScale = useSharedValue(1);
  const recordingPulse = useSharedValue(1);

  // Style animé pour l'effet de pulse normal
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.2], [0.7, 0]),
  }));

  // Style animé pour le bouton principal
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isRecording ? recordingScale.value : scale.value }],
  }));

  // Style animé pour l'effet de pulse d'enregistrement
  const recordingPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingPulse.value }],
    opacity: interpolate(recordingPulse.value, [1, 1.5], [0.8, 0]),
  }));

  // Gestion des animations
  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  // Animation de pulse continue (quand pas en enregistrement)
  React.useEffect(() => {
    if (!isRecording) {
      const pulseAnimation = () => {
        pulseScale.value = withSpring(1.2, { duration: 1500 }, () => {
          pulseScale.value = withSpring(1, { duration: 1500 });
        });
      };

      const interval = setInterval(pulseAnimation, 3000);
      return () => clearInterval(interval);
    }
  }, [pulseScale, isRecording]);

  // Animation d'enregistrement
  React.useEffect(() => {
    if (isRecording) {
      // Animation de croissance progressive
      recordingScale.value = withSpring(1.3, { duration: 300 });

      // Animation de pulse rapide
      const recordingPulseAnimation = () => {
        recordingPulse.value = withTiming(1.5, { duration: 800 }, () => {
          recordingPulse.value = withTiming(1, { duration: 800 });
        });
      };

      const interval = setInterval(recordingPulseAnimation, 1600);
      return () => clearInterval(interval);
    } else {
      // Retour à la taille normale
      recordingScale.value = withSpring(1, { duration: 200 });
      recordingPulse.value = withTiming(1);
    }
  }, [isRecording, recordingScale, recordingPulse]);

  return (
    <Animated.View
      testID="audio-fab-container"
      style={[
        tw`absolute right-6`,
        {
          bottom: insets.bottom + 20,
        },
        buttonStyle,
      ]}
    >
      {/* Cercle de pulse animé (normal ou enregistrement) */}
      {isRecording ? (
        <Animated.View
          testID="recording-pulse"
          style={[
            tw`absolute rounded-full`,
            {
              width: 120,
              height: 120,
              backgroundColor: '#EF4444', // Rouge pour l'enregistrement
              top: -25,
              left: -25,
            },
            recordingPulseStyle,
          ]}
        />
      ) : (
        <Animated.View
          testID="normal-pulse"
          style={[
            tw`absolute rounded-full`,
            {
              width: 80,
              height: 80,
              backgroundColor: currentTheme.colors.accent,
              top: -10,
              left: -10,
            },
            pulseStyle,
          ]}
        />
      )}

      {/* Bouton principal */}
      <TouchableOpacity
        testID="audio-fab-button"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={tw`shadow-lg`}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? t('audio.stopRecording', "Arrêter l'enregistrement") : t('audio.createFolder', 'Nouveau dossier')}
      >
        <LinearGradient
          testID={isRecording ? "recording-gradient" : "normal-gradient"}
          colors={
            isRecording
              ? ['#EF4444', '#DC2626'] // Rouge pour l'enregistrement
              : [currentTheme.colors.accent, `${currentTheme.colors.accent}E6`]
          }
          style={tw`w-16 h-16 rounded-full items-center justify-center`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isRecording ? (
            <>
              {/* Animation d'ondes sonores pendant l'enregistrement */}
              <View style={tw`absolute inset-0 items-center justify-center`}>
                <Icon testID="recording-icon" name="radio" size={20} color="white" />
                <Text
                  style={tw`absolute bottom-1 text-white text-xs font-bold`}
                >
                  {Math.floor(recordingDuration / 60)}:
                  {(recordingDuration % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            </>
          ) : (
            <Icon testID="add-icon" name="add" size={28} color="white" />
          )}

          {/* Effet de brillance */}
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'transparent']}
            style={tw`absolute top-0 left-0 right-0 h-8 rounded-t-full`}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* Label explicatif */}
      <Animated.View
        style={[
          tw`absolute right-20 bg-black/80 px-3 py-2 rounded-lg`,
          {
            top: 18,
            opacity: 0, // Masqué par défaut, peut être activé avec un state
          },
        ]}
      >
        <Text style={tw`text-white text-sm font-medium`}>
          {isRecording
            ? t('audio.stopRecording', "Arrêter l'enregistrement")
            : t('audio.createFolder', 'Nouveau dossier')}
        </Text>
        <View
          style={[
            tw`absolute left-full top-3 w-0 h-0`,
            {
              borderLeftWidth: 6,
              borderLeftColor: 'rgba(0,0,0,0.8)',
              borderTopWidth: 4,
              borderTopColor: 'transparent',
              borderBottomWidth: 4,
              borderBottomColor: 'transparent',
            },
          ]}
        />
      </Animated.View>
    </Animated.View>
  );
}
