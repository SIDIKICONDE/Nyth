import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import * as React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  FadeIn,
  FadeInDown,
  SlideInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import tw from "twrnc";
import SocialShareModal from "../../components/SocialShareModal";
import { CustomHeader } from "../../components/common";

import {
  ActionButtons,
  ExportProgressBar,
  LoadingState,
  NotFoundState,
  VideoPlayerSection,
} from "./components";
import { usePreviewData } from "./hooks/usePreviewData";

import { UIText } from "../../components/ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";

import { RootStackParamList } from "../../types";

type PreviewScreenRouteProp = RouteProp<RootStackParamList, "Preview">;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function PreviewScreen() {
  const route = useRoute<PreviewScreenRouteProp>();
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const aspectRatio = { width: 16, height: 9 };
  const { t } = useTranslation();

  // Utiliser usePreviewData qui gère le chargement des données
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
    handleShare,
    handleBasicShare,
    handleDelete,
  } = usePreviewData();

  // Style animé pour l'en-tête
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
      transform: [{ translateY: 0 }],
    };
  });

  // Affichage de l'état de chargement
  if (loading) {
    return <LoadingState />;
  }

  // Affichage de l'état d'erreur si l'enregistrement n'est pas trouvé
  if (!recording) {
    return <NotFoundState />;
  }

  // Couleur par défaut pour le gradient
  const qualityColor = "#3b82f6";

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
      />

      {/* Gradient de fond dynamique */}
      <LinearGradient
        colors={[
          `${qualityColor}12`,
          `${qualityColor}08`,
          `${qualityColor}04`,
          "transparent",
        ]}
        style={tw`absolute top-0 left-0 right-0 h-60 z-0`}
      />

      {/* En-tête avec animation */}
      <Animated.View
        style={[headerAnimatedStyle]}
        entering={FadeIn.duration(400)}
      >
        <CustomHeader
          title={t("preview.title", "Aperçu Vidéo")}
          subtitle={
            recording.createdAt
              ? new Date(recording.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : ""
          }
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          actionButtons={[
            {
              icon: "🏠",
              onPress: () => navigation.navigate("Home" as never),
            },
            {
              icon: "🎬",
              onPress: () => navigation.navigate("Recording" as never),
            },
          ]}
        />
      </Animated.View>

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
              onBasicShare={handleBasicShare}
              onExport={handleExport}
              isExporting={isExporting}
            />
          </View>
        </View>
      </View>

      {/* Modal de partage social */}
      <SocialShareModal
        visible={showSocialShare}
        onClose={() => setShowSocialShare(false)}
        videoUri={previewVideoUri || ""}
        videoTitle={`Vidéo ${recording.id}`}
        aspectRatio={{ width: 16, height: 9 }}
      />
    </View>
  );
}
