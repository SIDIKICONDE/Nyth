import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  useColorScheme,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Slider from "react-native-slider-x";
import { useSystemTheme } from "../../../hooks/useSystemTheme";

interface ManualControlsProps {
  visible: boolean;
  zoom: number;
  exposure: number;
  iso: number;
  focusDistance?: number;
  whiteBalance?: number;
  onZoomChange: (value: number) => void;
  onExposureChange: (value: number) => void;
  onIsoChange: (value: number) => void;
  onFocusChange?: (value: number) => void;
  onWhiteBalanceChange?: (value: number) => void;
  capabilities: {
    maxZoom: number;
    minZoom: number;
    supportsManualFocus: boolean;
    supportsManualWhiteBalance: boolean;
  };
}

const { width: screenWidth } = Dimensions.get("window");

export const ManualControls: React.FC<ManualControlsProps> = ({
  visible,
  zoom,
  exposure,
  iso,
  focusDistance = 0,
  whiteBalance = 5500,
  onZoomChange,
  onExposureChange,
  onIsoChange,
  onFocusChange,
  onWhiteBalanceChange,
  capabilities,
}) => {
  const [activeControl, setActiveControl] = useState<string | null>(null);
  const [slideAnimation] = useState(new Animated.Value(visible ? 0 : -100));

  // Détecter le thème système
  const { systemTheme, isSystemDark } = useSystemTheme();
  const colorScheme = useColorScheme();
  const isDark = isSystemDark || colorScheme === "dark";

  React.useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: visible ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnimation]);

  const controls = [
    {
      id: "zoom",
      label: "Zoom",
      icon: "magnify",
      value: zoom,
      min: capabilities.minZoom,
      max: capabilities.maxZoom,
      step: 0.1,
      onChange: onZoomChange,
      formatValue: (val: number) => `${val.toFixed(1)}x`,
      color: "#FF9800",
    },
    {
      id: "exposure",
      label: "Exposition",
      icon: "brightness-6",
      value: exposure,
      min: -2,
      max: 2,
      step: 0.1,
      onChange: onExposureChange,
      formatValue: (val: number) => `${val > 0 ? "+" : ""}${val.toFixed(1)}`,
      color: "#FFC107",
    },
    {
      id: "iso",
      label: "ISO",
      icon: "camera-iris",
      value: iso,
      min: 50,
      max: 3200,
      step: 50,
      onChange: onIsoChange,
      formatValue: (val: number) => val.toString(),
      color: "#9C27B0",
    },
  ];

  // Ajouter les contrôles optionnels si supportés
  if (capabilities.supportsManualFocus && onFocusChange) {
    controls.push({
      id: "focus",
      label: "Focus",
      icon: "camera-focus",
      value: focusDistance,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: onFocusChange,
      formatValue: (val: number) =>
        val === 0 ? "∞" : val === 1 ? "Proche" : `${(val * 100).toFixed(0)}%`,
      color: "#2196F3",
    });
  }

  if (capabilities.supportsManualWhiteBalance && onWhiteBalanceChange) {
    controls.push({
      id: "whiteBalance",
      label: "Balance Blancs",
      icon: "white-balance-sunny",
      value: whiteBalance,
      min: 2000,
      max: 10000,
      step: 100,
      onChange: onWhiteBalanceChange,
      formatValue: (val: number) => `${val}K`,
      color: "#00BCD4",
    });
  }

  const QuickZoomButtons = () => (
    <View style={styles.quickZoomContainer}>
      <Text
        style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
      >
        Zoom Rapide
      </Text>
      <View style={styles.quickZoomRow}>
        {[1, 2, 5, capabilities.maxZoom].map((zoomLevel) => {
          const isActive = Math.abs(zoom - zoomLevel) < 0.1;
          return (
            <TouchableOpacity
              key={zoomLevel}
              style={[
                styles.quickZoomButton,
                isActive && styles.quickZoomButtonActive,
              ]}
              onPress={() =>
                onZoomChange(Math.min(zoomLevel, capabilities.maxZoom))
              }
              activeOpacity={0.7}
            >
              {isActive && <View style={styles.quickZoomGlow} />}
              <Text
                style={[
                  styles.quickZoomText,
                  isActive && styles.quickZoomTextActive,
                  {
                    color: isDark
                      ? isActive
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.8)"
                      : isActive
                      ? "#0F172A"
                      : "#334155",
                  },
                ]}
              >
                {zoomLevel}x
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const ControlSlider = ({ control }: { control: (typeof controls)[0] }) => (
    <View style={styles.controlContainer}>
      <View style={styles.controlCard}>
        <View style={styles.controlHeader}>
          <View style={styles.controlHeaderLeft}>
            <View
              style={[styles.controlIcon, { backgroundColor: control.color }]}
            >
              <MaterialCommunityIcons
                name={control.icon}
                size={18}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.controlLabel}>{control.label}</Text>
          </View>
          <View
            style={[
              styles.controlValueContainer,
              { borderColor: control.color },
            ]}
          >
            <Text style={[styles.controlValue, { color: control.color }]}>
              {control.formatValue(control.value)}
            </Text>
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={control.min}
            maximumValue={control.max}
            value={control.value}
            step={control.step}
            onValueChange={control.onChange}
            minimumTrackTintColor={control.color}
            maximumTrackTintColor="rgba(255, 255, 255, 0.15)"
          />
        </View>
      </View>
    </View>
  );

  const ResetButton = () => (
    <TouchableOpacity
      style={styles.resetButton}
      onPress={() => {
        onZoomChange(1);
        onExposureChange(0);
        onIsoChange(100);
        onFocusChange?.(0);
        onWhiteBalanceChange?.(5500);
      }}
    >
      <MaterialCommunityIcons name="restore" size={16} color="#FF6B6B" />
      <Text style={styles.resetButtonText}>Réinitialiser</Text>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={styles.gestureContainer}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnimation }],
          },
        ]}
      >
        <View
          style={[
            styles.backgroundGradient,
            {
              backgroundColor: isDark
                ? "rgba(15, 15, 25, 0.98)"
                : "rgba(248, 250, 252, 0.98)",
            },
          ]}
        />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="tune" size={22} color="#00D4AA" />
            </View>
            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? "#FFFFFF" : "#0F172A" },
              ]}
            >
              Contrôles Manuels
            </Text>
          </View>
          <ResetButton />
        </View>

        {/* Boutons de zoom rapide */}
        <QuickZoomButtons />

        {/* Contrôles avec sliders */}
        <View style={styles.controlsList}>
          {controls.map((control) => (
            <ControlSlider key={control.id} control={control} />
          ))}
        </View>

        {/* Indicateurs visuels */}
        <View style={styles.indicators}>
          <View style={styles.indicatorRow}>
            <MaterialCommunityIcons name="chart-line" size={14} color="#888" />
            <Text style={styles.indicatorText}>
              Zoom: {zoom.toFixed(1)}x • Exposition: {exposure > 0 ? "+" : ""}
              {exposure.toFixed(1)}
            </Text>
          </View>
          <View style={styles.indicatorRow}>
            <MaterialCommunityIcons
              name="information-outline"
              size={14}
              color="#888"
            />
            <Text style={styles.indicatorText}>
              Pincer pour zoomer • Double tap pour réinitialiser
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  gestureContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 212, 170, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    position: "relative",
    overflow: "hidden",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 212, 170, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 170, 0.4)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.4)",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resetButtonText: {
    fontSize: 13,
    color: "#FF6B6B",
    fontWeight: "700",
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  quickZoomContainer: {
    marginBottom: 28,
    position: "relative",
    zIndex: 1,
  },
  quickZoomRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  quickZoomButton: {
    width: 52,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickZoomButtonActive: {
    backgroundColor: "rgba(255, 152, 0, 0.2)",
    borderColor: "#FF9800",
    transform: [{ scale: 1.1 }],
    shadowColor: "#FF9800",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  quickZoomGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    borderRadius: 18,
  },
  quickZoomText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
  },
  quickZoomTextActive: {
    color: "#FFFFFF",
  },
  controlsList: {
    gap: 20,
    position: "relative",
    zIndex: 1,
  },
  controlContainer: {
    marginVertical: 4,
  },
  controlCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  controlHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  controlHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  controlValueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  controlValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  slider: {
    width: "100%",
    height: 36,
  },
  indicators: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 212, 170, 0.2)",
    gap: 12,
    position: "relative",
    zIndex: 1,
  },
  indicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  indicatorText: {
    fontSize: 13,
    color: "#B0BEC5",
    flex: 1,
    fontWeight: "500",
  },
});
