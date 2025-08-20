import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";

const { width: screenWidth } = Dimensions.get("window");

interface PresetOption {
  id: "social" | "professional" | "streaming" | "mobile";
  title: string;
  description: string;
  icon: string;
  color: string;
  specs: {
    resolution: string;
    codec: string;
    frameRate: number;
    quality: string;
  };
}

interface CameraPresetsProps {
  onPresetSelect: (
    preset: "social" | "professional" | "streaming" | "mobile"
  ) => void;
  currentPreset?: string;
}

export const CameraPresets: React.FC<CameraPresetsProps> = ({
  onPresetSelect,
  currentPreset,
}) => {
  const presets: PresetOption[] = [
    {
      id: "social",
      title: "Réseaux Sociaux",
      description: "Optimisé pour Instagram, TikTok, YouTube Shorts",
      icon: "share-variant",
      color: "#E91E63",
      specs: {
        resolution: "1080p",
        codec: "H.264",
        frameRate: 30,
        quality: "Équilibré",
      },
    },
    {
      id: "professional",
      title: "Professionnel",
      description: "Qualité maximale pour productions sérieuses",
      icon: "video-4k-box",
      color: "#FF9800",
      specs: {
        resolution: "4K",
        codec: "H.265",
        frameRate: 24,
        quality: "Maximum",
      },
    },
    {
      id: "streaming",
      title: "Streaming",
      description: "Performance optimisée pour diffusion live",
      icon: "broadcast",
      color: "#9C27B0",
      specs: {
        resolution: "1080p",
        codec: "H.264",
        frameRate: 60,
        quality: "Vitesse",
      },
    },
    {
      id: "mobile",
      title: "Économe",
      description: "Préserve batterie et stockage",
      icon: "battery-heart",
      color: "#4CAF50",
      specs: {
        resolution: "720p",
        codec: "H.264",
        frameRate: 30,
        quality: "Vitesse",
      },
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleGradient}
        >
          <MaterialCommunityIcons name="magic" size={24} color="#FFFFFF" />
          <Text style={styles.title}>Préréglages Rapides</Text>
        </LinearGradient>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {presets.map((preset, index) => {
          const isActive = currentPreset === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              style={[styles.presetCard, isActive && styles.presetCardActive]}
              onPress={() => onPresetSelect(preset.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isActive
                    ? [preset.color, `${preset.color}80`]
                    : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                {isActive && <View style={styles.cardGlow} />}

                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={[preset.color, `${preset.color}CC`]}
                    style={[
                      styles.iconContainer,
                      isActive && styles.iconContainerActive,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={preset.icon}
                      size={26}
                      color="#FFFFFF"
                    />
                  </LinearGradient>

                  {isActive && (
                    <View style={styles.activeIndicator}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color="#00D4AA"
                      />
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.presetTitle,
                    isActive && styles.presetTitleActive,
                  ]}
                >
                  {preset.title}
                </Text>
                <Text
                  style={[
                    styles.presetDescription,
                    isActive && styles.presetDescriptionActive,
                  ]}
                  numberOfLines={2}
                >
                  {preset.description}
                </Text>

                <View style={styles.specsContainer}>
                  <View style={styles.specGrid}>
                    <View style={styles.specItem}>
                      <MaterialCommunityIcons
                        name="monitor-screenshot"
                        size={14}
                        color={isActive ? "#FFFFFF" : "#888888"}
                      />
                      <Text
                        style={[
                          styles.specText,
                          isActive && styles.specTextActive,
                        ]}
                      >
                        {preset.specs.resolution}
                      </Text>
                    </View>

                    <View style={styles.specItem}>
                      <MaterialCommunityIcons
                        name="video-outline"
                        size={14}
                        color={isActive ? "#FFFFFF" : "#888888"}
                      />
                      <Text
                        style={[
                          styles.specText,
                          isActive && styles.specTextActive,
                        ]}
                      >
                        {preset.specs.codec}
                      </Text>
                    </View>

                    <View style={styles.specItem}>
                      <MaterialCommunityIcons
                        name="speedometer"
                        size={14}
                        color={isActive ? "#FFFFFF" : "#888888"}
                      />
                      <Text
                        style={[
                          styles.specText,
                          isActive && styles.specTextActive,
                        ]}
                      >
                        {preset.specs.frameRate} FPS
                      </Text>
                    </View>

                    <View style={styles.specItem}>
                      <MaterialCommunityIcons
                        name="quality-high"
                        size={14}
                        color={isActive ? "#FFFFFF" : "#888888"}
                      />
                      <Text
                        style={[
                          styles.specText,
                          isActive && styles.specTextActive,
                        ]}
                      >
                        {preset.specs.quality}
                      </Text>
                    </View>
                  </View>
                </View>

                {isActive && (
                  <View style={styles.activeLabel}>
                    <Text style={styles.activeLabelText}>ACTIF</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.customOption}>
        <TouchableOpacity
          style={styles.customButton}
          onPress={() => {
            // Le parent devrait ouvrir les paramètres avancés
          }}
        >
          <MaterialCommunityIcons name="tune" size={20} color="#007AFF" />
          <Text style={styles.customButtonText}>Paramètres personnalisés</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  titleContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  titleGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  presetCard: {
    width: 180,
    height: 220,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  presetCardActive: {
    borderColor: "rgba(0, 212, 170, 0.6)",
    transform: [{ scale: 1.05 }],
    shadowColor: "#00D4AA",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  cardGradient: {
    flex: 1,
    padding: 18,
    position: "relative",
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 212, 170, 0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainerActive: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  presetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#B0BEC5",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  presetTitleActive: {
    color: "#FFFFFF",
  },
  presetDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 16,
    lineHeight: 16,
    fontWeight: "500",
  },
  presetDescriptionActive: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  specsContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  specGrid: {
    gap: 8,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  specText: {
    fontSize: 12,
    color: "#888888",
    fontWeight: "600",
  },
  specTextActive: {
    color: "#FFFFFF",
  },
  activeIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 212, 170, 0.2)",
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: "#00D4AA",
  },
  activeLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 212, 170, 0.9)",
    paddingVertical: 6,
    alignItems: "center",
  },
  activeLabelText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 1,
  },
  customOption: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  customButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(103, 126, 234, 0.15)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(103, 126, 234, 0.4)",
    gap: 10,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#667eea",
  },
});
