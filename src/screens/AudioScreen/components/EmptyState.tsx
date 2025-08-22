import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
// import LottieView from 'lottie-react-native'; // Removed expo dependency
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

interface EmptyStateProps {
  onCreateFolder: () => void;
  isLoading: boolean;
}

export default function EmptyState({
  onCreateFolder,
  isLoading,
}: EmptyStateProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Animations
  const iconScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);

  // Styles animés
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Démarrer les animations
  React.useEffect(() => {
    if (!isLoading) {
      iconScale.value = withDelay(200, withSpring(1));
      textOpacity.value = withDelay(400, withSpring(1));
      buttonScale.value = withDelay(600, withSpring(1));
    }
  }, [isLoading, iconScale, textOpacity, buttonScale]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 items-center justify-center px-8`}>
        <View style={tw`w-32 h-32 items-center justify-center`}>
          <Icon
            name="folder-open"
            size={64}
            color={currentTheme.colors.accent}
          />
        </View>
        <Text
          style={[
            tw`text-lg font-medium mt-4 text-center`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {t('audio.loading', 'Chargement des dossiers...')}
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 items-center justify-center px-8`}>
      {/* Animation de l'icône */}
      <Animated.View style={iconStyle}>
        <LinearGradient
          colors={[
            currentTheme.colors.accent,
            `${currentTheme.colors.accent}80`,
          ]}
          style={tw`w-24 h-24 rounded-full items-center justify-center mb-6`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="folder-open" size={32} color="white" />
        </LinearGradient>
      </Animated.View>

      {/* Texte */}
      <Animated.View style={[tw`items-center mb-8`, textStyle]}>
        <Text
          style={[
            tw`text-2xl font-bold text-center mb-2`,
            { color: currentTheme.colors.text },
          ]}
        >
          {t('audio.empty.title', 'Aucun dossier')}
        </Text>
        <Text
          style={[
            tw`text-base text-center leading-6`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {t(
            'audio.empty.message',
            'Créez votre premier dossier pour organiser vos enregistrements audio.',
          )}
        </Text>
      </Animated.View>

      {/* Bouton d'action */}
      <Animated.View style={buttonStyle}>
        <TouchableOpacity
          onPress={onCreateFolder}
          activeOpacity={0.8}
          style={tw`overflow-hidden rounded-2xl`}
        >
          <LinearGradient
            colors={[
              currentTheme.colors.accent,
              `${currentTheme.colors.accent}E6`,
            ]}
            style={tw`px-8 py-4`}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={tw`flex-row items-center`}>
              <Icon name="add" size={20} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white font-semibold text-lg`}>
                {t('audio.createFirstFolder', 'Créer un dossier')}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Suggestions */}
      <Animated.View
        style={[
          tw`mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 w-full`,
          textStyle,
        ]}
      >
        <Text
          style={[
            tw`text-sm font-medium mb-2`,
            { color: currentTheme.colors.text },
          ]}
        >
          💡 Suggestions :
        </Text>
        <Text
          style={[
            tw`text-sm leading-5`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          • {t('audio.suggestion1', 'Dossiers pour les réunions')}
          {'\n'}• {t('audio.suggestion2', 'Notes et idées personnelles')}
          {'\n'}• {t('audio.suggestion3', 'Projets créatifs')}
        </Text>
      </Animated.View>
    </View>
  );
}
