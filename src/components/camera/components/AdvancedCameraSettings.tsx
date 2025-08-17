import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  useColorScheme,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSystemTheme } from "../../../hooks/useSystemTheme";
import { useTheme } from "../../../contexts/ThemeContext";
import type {
  AdvancedCameraConfig,
  AdvancedCameraCapabilities,
} from "../types/advanced";
import { Section } from "./advanced/Section";
import { QualityAndResolutionSection } from "./advanced/sections/QualityAndResolutionSection";
import { ManualSection } from "./advanced/sections/ManualSection";
import { EffectsSection } from "./advanced/sections/EffectsSection";
import { FormatSection } from "./advanced/sections/FormatSection";
import { AudioSection } from "./advanced/sections/AudioSection";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface AdvancedCameraSettingsProps {
  visible: boolean;
  onClose: () => void;
  config: AdvancedCameraConfig;
  onConfigChange: (config: AdvancedCameraConfig) => void;
  capabilities?: AdvancedCameraCapabilities;
}

export const AdvancedCameraSettings: React.FC<AdvancedCameraSettingsProps> = ({
  visible,
  onClose,
  config,
  onConfigChange,
  capabilities = {
    maxZoom: 10,
    supportsHDR: true,
    supportsLowLight: true,
    supportedResolutions: ["720p", "1080p", "4K"],
    supportedCodecs: ["h264", "h265"],
  },
}) => {
  const [activeSection, setActiveSection] = useState<string>("quality");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Détecter le thème système
  const { systemTheme, isSystemDark } = useSystemTheme();
  const colorScheme = useColorScheme();
  const isDark = isSystemDark || colorScheme === "dark";

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, fadeAnim, slideAnim]);

  const updateConfig = (updates: Partial<AdvancedCameraConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const isQualityActive = activeSection === "quality";
  const isManualActive = activeSection === "manual";
  const isEffectsActive = activeSection === "effects";
  const isFormatActive = activeSection === "format";
  const isAudioActive = activeSection === "audio";

  const { currentTheme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: currentTheme.colors.background },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconContainer,
                  {
                    borderColor: currentTheme.colors.border,
                    backgroundColor: currentTheme.colors.surface,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="tune-variant"
                  size={24}
                  color={currentTheme.colors.text}
                />
              </View>
              <Text style={[styles.title, { color: currentTheme.colors.text }]}>
                Paramètres Avancés
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={currentTheme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
          >
            <Section
              title="Qualité & Résolution"
              icon="video-outline"
              isActive={isQualityActive}
              onToggle={() =>
                setActiveSection(isQualityActive ? "" : "quality")
              }
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            >
              <QualityAndResolutionSection
                config={config}
                capabilities={capabilities}
                isDark={isDark}
                onChange={updateConfig}
              />
            </Section>

            <Section
              title="Contrôles Manuels"
              icon="tune"
              isActive={isManualActive}
              onToggle={() => setActiveSection(isManualActive ? "" : "manual")}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            >
              <ManualSection
                config={config}
                maxZoom={capabilities.maxZoom}
                onChange={updateConfig}
              />
            </Section>

            <Section
              title="Stabilisation & Effets"
              icon="camera-iris"
              isActive={isEffectsActive}
              onToggle={() =>
                setActiveSection(isEffectsActive ? "" : "effects")
              }
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            >
              <EffectsSection
                config={config}
                supportsHDR={capabilities.supportsHDR}
                supportsLowLight={capabilities.supportsLowLight}
                onChange={updateConfig}
              />
            </Section>

            <Section
              title="Format & Orientation"
              icon="crop"
              isActive={isFormatActive}
              onToggle={() => setActiveSection(isFormatActive ? "" : "format")}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            >
              <FormatSection config={config} onChange={updateConfig} />
            </Section>

            <Section
              title="Audio"
              icon="microphone"
              isActive={isAudioActive}
              onToggle={() => setActiveSection(isAudioActive ? "" : "audio")}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            >
              <AudioSection config={config} onChange={updateConfig} />
            </Section>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: screenWidth * 0.92,
    maxWidth: 480,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    position: "relative",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollArea: {
    maxHeight: 384,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionHeaderGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  sectionHeaderActive: {
    transform: [{ scale: 1.02 }],
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  iconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  sectionTitleActive: {
    fontWeight: "700",
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: -8,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  optionButtonActive: {
    backgroundColor: "transparent",
    transform: [{ scale: 1.05 }],
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  optionButtonGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
  },
  optionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCheckIcon: {
    marginRight: 6,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionTextActive: {
    fontWeight: "700",
  },
  sliderContainer: {
    marginVertical: 20,
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  slider: {
    width: "100%",
    height: 44,
  },

  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  switchDisabled: {
    opacity: 0.4,
    backgroundColor: "transparent",
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  switchLabelDisabled: {
    color: "rgba(255, 255, 255, 0.4)",
  },
});
