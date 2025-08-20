import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { AppLockConfig } from "../services/AppLockService";

const { width, height } = Dimensions.get("window");

interface AppLockScreenProps {
  lockConfig: AppLockConfig;
  onCustomAction?: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  lockConfig,
  onCustomAction,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!lockConfig.showCountdown || !lockConfig.unlockDate) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const unlockTime = lockConfig.unlockDate!.toDate();
      const diff = unlockTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Déverrouillage imminent...");
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let remaining = "";
        if (days > 0) remaining += `${days}j `;
        if (hours > 0) remaining += `${hours}h `;
        if (minutes > 0) remaining += `${minutes}m `;
        remaining += `${seconds}s`;

        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockConfig]);

  const handleContactSupport = (type: "email" | "phone") => {
    if (type === "email" && lockConfig.contactEmail) {
      Linking.openURL(`mailto:${lockConfig.contactEmail}`);
    } else if (type === "phone" && lockConfig.contactPhone) {
      Linking.openURL(`tel:${lockConfig.contactPhone}`);
    }
  };

  const performCustomAction = useCallback(() => {
    const action = (lockConfig.customButtonAction || "").trim();
    if (!action) {
      onCustomAction?.();
      return;
    }

    // Mapping d'actions contrôlées par l'admin
    try {
      if (action === "open_subscriptions") {
        // Deep-link générique; l'app doit le gérer côté navigation
        Linking.openURL("app://subscriptions").catch(() => onCustomAction?.());
        return;
      }
      if (action === "contact_email") {
        handleContactSupport("email");
        return;
      }
      if (action === "contact_phone") {
        handleContactSupport("phone");
        return;
      }
      if (action === "open_settings") {
        Linking.openSettings?.();
        return;
      }
      if (action.startsWith("open_url:")) {
        const url = action.slice("open_url:".length);
        if (url) {
          Linking.openURL(url).catch(() => onCustomAction?.());
          return;
        }
      }
      if (action.startsWith("deeplink:")) {
        const dl = action.slice("deeplink:".length);
        if (dl) {
          Linking.openURL(dl).catch(() => onCustomAction?.());
          return;
        }
      }
    } catch (_e) {
      // Fallback custom
    }
    onCustomAction?.();
  }, [
    lockConfig.customButtonAction,
    lockConfig.contactEmail,
    lockConfig.contactPhone,
    onCustomAction,
  ]);

  const getGradientColors = () => {
    const baseColor = lockConfig.backgroundColor || "#1e40af";
    // Créer un dégradé basé sur la couleur de base
    return [baseColor, adjustColor(baseColor, -30)];
  };

  const adjustColor = (color: string, amount: number) => {
    const usePound = color[0] === "#";
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
    return (
      (usePound ? "#" : "") +
      ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")
    );
  };

  const getIconComponent = () => {
    const iconName = lockConfig.iconName || "lock";
    const iconSize = 80;
    const iconColor = lockConfig.textColor || "#ffffff";

    return (
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={iconSize}
          color={iconColor}
        />
      </View>
    );
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={lockConfig.backgroundColor || "#1e40af"}
      />
      <LinearGradient
        colors={getGradientColors()}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
              minHeight: height,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Icône principale */}
            {getIconComponent()}

            {/* Titre */}
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: lockConfig.textColor || "#ffffff",
                textAlign: "center",
                marginBottom: 16,
                paddingHorizontal: 20,
              }}
            >
              {lockConfig.title}
            </Text>

            {/* Message */}
            <Text
              style={{
                fontSize: 16,
                color: lockConfig.textColor || "#ffffff",
                textAlign: "center",
                marginBottom: 32,
                paddingHorizontal: 20,
                lineHeight: 24,
                opacity: 0.95,
              }}
            >
              {lockConfig.message}
            </Text>

            {/* Compte à rebours */}
            {lockConfig.showCountdown && timeRemaining && (
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 12,
                  marginBottom: 32,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: lockConfig.textColor || "#ffffff",
                    textAlign: "center",
                    marginBottom: 8,
                    opacity: 0.8,
                  }}
                >
                  Déverrouillage dans
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: lockConfig.textColor || "#ffffff",
                    textAlign: "center",
                  }}
                >
                  {timeRemaining}
                </Text>
              </View>
            )}

            {/* Boutons d'action */}
            <View style={{ width: "100%", maxWidth: 300 }}>
              {/* Bouton personnalisé */}
              {lockConfig.customButtonText && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 8,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                  onPress={performCustomAction}
                >
                  <Text
                    style={{
                      color: lockConfig.textColor || "#ffffff",
                      fontSize: 16,
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  >
                    {lockConfig.customButtonText}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Contact support */}
              {lockConfig.showContactSupport && (
                <View>
                  {lockConfig.contactEmail && (
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        marginBottom: 12,
                      }}
                      onPress={() => handleContactSupport("email")}
                    >
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={20}
                        color={lockConfig.textColor || "#ffffff"}
                      />
                      <Text
                        style={{
                          color: lockConfig.textColor || "#ffffff",
                          fontSize: 14,
                          marginLeft: 8,
                        }}
                      >
                        {lockConfig.contactEmail}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {lockConfig.contactPhone && (
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        paddingVertical: 12,
                        paddingHorizontal: 20,
                        borderRadius: 8,
                        marginBottom: 12,
                      }}
                      onPress={() => handleContactSupport("phone")}
                    >
                      <MaterialCommunityIcons
                        name="phone-outline"
                        size={20}
                        color={lockConfig.textColor || "#ffffff"}
                      />
                      <Text
                        style={{
                          color: lockConfig.textColor || "#ffffff",
                          fontSize: 14,
                          marginLeft: 8,
                        }}
                      >
                        {lockConfig.contactPhone}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Badge de type de verrouillage */}
            <View
              style={{
                position: "absolute",
                top: 40,
                right: 20,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: lockConfig.textColor || "#ffffff",
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  opacity: 0.8,
                }}
              >
                {lockConfig.lockType === "test_ended"
                  ? "Test terminé"
                  : lockConfig.lockType === "maintenance"
                  ? "Maintenance"
                  : lockConfig.lockType === "subscription_required"
                  ? "Abonnement"
                  : lockConfig.lockType === "violation"
                  ? "Restriction"
                  : "Verrouillé"}
              </Text>
            </View>

            {/* Animation de particules en arrière-plan */}
            {lockConfig.lockType === "test_ended" && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: "none",
                }}
              >
                {[...Array(5)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      position: "absolute",
                      width: 4,
                      height: 4,
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      borderRadius: 2,
                      top: Math.random() * height,
                      left: Math.random() * width,
                    }}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};
