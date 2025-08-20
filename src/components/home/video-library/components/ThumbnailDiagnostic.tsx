import React, { useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../ui/Typography";
import { useVideoThumbnail } from "../hooks/useVideoThumbnail";

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ThumbnailDiagnostic');

interface ThumbnailDiagnosticProps {
  videoUri: string;
  visible?: boolean;
}

/**
 * Composant de diagnostic pour les miniatures vidéo
 * Affiche des informations détaillées et permet de tester la génération
 */
export const ThumbnailDiagnostic: React.FC<ThumbnailDiagnosticProps> = ({
  videoUri,
  visible = false,
}) => {
  const { currentTheme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const { thumbnailUri, isLoading, hasError, error, retryGeneration } =
    useVideoThumbnail(videoUri);

  if (!visible) return null;

  const getStatusColor = () => {
    if (isLoading) return "#FFA500"; // Orange
    if (hasError) return "#FF4444"; // Rouge
    return "#44AA44"; // Vert
  };

  const getStatusIcon = () => {
    if (isLoading) return "loading";
    if (hasError) return "alert-circle";
    return "check-circle";
  };

  const getStatusText = () => {
    if (isLoading) return "Génération...";
    if (hasError) return "Échec";
    return "Succès";
  };

  const handleShowDetails = () => {
    const details = {
      videoUri,
      thumbnailUri,
      isLoading,
      hasError,
      error,
      timestamp: new Date().toISOString(),
    };

    Alert.alert("🔍 Diagnostic miniature", JSON.stringify(details, null, 2), [
      {
        text: "Copier",
        onPress: () => logger.debug("📋 Diagnostic copié:", details),
      },
      { text: "Retry", onPress: retryGeneration },
      { text: "Fermer", style: "cancel" },
    ]);
  };

  return (
    <View
      style={[
        tw`absolute top-1 right-1 z-50`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: currentTheme.colors.border,
          padding: 4,
          minWidth: 60,
        },
      ]}
    >
      {/* Indicateur de statut compact */}
      <TouchableOpacity
        onPress={handleShowDetails}
        style={tw`flex-row items-center`}
      >
        <MaterialCommunityIcons
          name={getStatusIcon()}
          size={12}
          color={getStatusColor()}
        />
        <UIText
          size="xs"
          style={[tw`ml-1`, { color: getStatusColor(), fontSize: 9 }]}
        >
          {getStatusText()}
        </UIText>
      </TouchableOpacity>

      {/* Détails développés */}
      {showDetails && (
        <View style={tw`mt-2 p-2 bg-black bg-opacity-75 rounded`}>
          <UIText size="xs" style={{ color: "#FFF", fontSize: 8 }}>
            📁 URI: {videoUri.substring(videoUri.lastIndexOf("/") + 1)}
          </UIText>
          {thumbnailUri && (
            <UIText size="xs" style={{ color: "#FFF", fontSize: 8 }}>
              🖼️ Thumb:{" "}
              {thumbnailUri.substring(thumbnailUri.lastIndexOf("/") + 1)}
            </UIText>
          )}
          {error && (
            <UIText size="xs" style={{ color: "#FF4444", fontSize: 8 }}>
              ❌ {error}
            </UIText>
          )}

          <TouchableOpacity
            onPress={retryGeneration}
            style={[tw`mt-1 px-2 py-1 rounded`, { backgroundColor: "#007AFF" }]}
          >
            <UIText size="xs" style={{ color: "#FFF", fontSize: 8 }}>
              🔄 Retry
            </UIText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
