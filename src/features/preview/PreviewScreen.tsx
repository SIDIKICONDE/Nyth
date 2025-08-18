import React from 'react';
import { View, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { useTheme } from '@/contexts/ThemeContext';
import { useCentralizedFont } from '@/hooks/useCentralizedFont';
import { usePreviewData } from './hooks';
import {
  PreviewHeader,
  VideoPlayerSection,
  ActionButtons,
  ExportProgressBar,
  LoadingState,
  NotFoundState,
} from './components';
import { VIDEO_QUALITY_COLORS } from './constants';

export default function PreviewScreen() {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  useCentralizedFont();

  const {
    recording,
    loading,
    isExporting,
    exportProgress,
    currentStep,
    videoSize,
    previewVideoUri,
    isGeneratingPreview,
    showSocialShare,
    setShowSocialShare,
    handleExport,
    handleBasicShare,
  } = usePreviewData();

  // Affichage de l'état de chargement
  if (loading) {
    return <LoadingState />;
  }

  // Affichage de l'état d'erreur si l'enregistrement n'est pas trouvé
  if (!recording) {
    return <NotFoundState />;
  }

  // Couleur par défaut pour le gradient
  const qualityColor = VIDEO_QUALITY_COLORS['1080p'];

  const handleBackPress = () => navigation.goBack();
  const handleHomePress = () => navigation.navigate('Home' as never);

  return (
    <View
      style={[
        tw`flex-1`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={currentTheme.isDark ? 'light-content' : 'dark-content'}
      />

      {/* Gradient de fond dynamique */}
      <LinearGradient
        colors={[
          `${qualityColor}12`,
          `${qualityColor}08`,
          `${qualityColor}04`,
          'transparent',
        ]}
        style={tw`absolute top-0 left-0 right-0 h-60 z-0`}
      />

      {/* En-tête avec animation */}
      <PreviewHeader
        recording={recording}
        onBackPress={handleBackPress}
        onHomePress={handleHomePress}
      />

      {/* Conteneur principal divisé en deux */}
      <View style={tw`flex-1`}>
        {/* Conteneur supérieur - Lecteur vidéo */}
        <View style={tw`flex-1 bg-gray-50 dark:bg-gray-900 rounded-t-3xl`}>
          <View style={tw`p-4`}>
            <VideoPlayerSection
              recording={recording}
              previewVideoUri={previewVideoUri}
              isGeneratingPreview={isGeneratingPreview}
              videoSize={videoSize}
            />
          </View>
        </View>

        {/* Conteneur inférieur - Actions et contrôles */}
        <View style={tw`bg-white dark:bg-gray-800 rounded-t-3xl shadow-lg`}>
          <View style={tw`p-6`}>
            {/* Barre de progression d'export */}
            {isExporting && (
              <View style={tw`mb-4`}>
                <ExportProgressBar
                  progress={exportProgress}
                  currentStep={currentStep}
                />
              </View>
            )}

            {/* Boutons d'action */}
            <ActionButtons
              onExport={handleExport}
              onBasicShare={handleBasicShare}
              isExporting={isExporting}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
