import React, { useEffect } from "react";
import { Animated, Modal, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { HeadingText, UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../hooks/useCentralizedFont";

interface CustomAlertProps {
  visible: boolean;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
}) => {
  const { currentTheme } = useTheme();
  const { ui, heading } = useCentralizedFont();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const getAlertConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "check-circle" as const,
          colors: ["#10B981", "#059669"],
          iconColor: "#FFFFFF",
        };
      case "error":
        return {
          icon: "alert-circle" as const,
          colors: ["#EF4444", "#DC2626"],
          iconColor: "#FFFFFF",
        };
      case "info":
        return {
          icon: "information" as const,
          colors: ["#3B82F6", "#2563EB"],
          iconColor: "#FFFFFF",
        };
    }
  };

  const config = getAlertConfig();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }

      // Retourner une fonction de nettoyage vide si autoClose est false
      return () => {};
    }

    // Retourner une fonction de nettoyage vide si visible est false
    return () => {};
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            tw`mx-6 w-full max-w-sm`,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            <LinearGradient
              colors={config.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                tw`rounded-3xl p-1`,
                {
                  shadowColor: config.colors[0],
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 10,
                },
              ]}
            >
              <View
                style={[
                  tw`rounded-3xl p-6`,
                  { backgroundColor: currentTheme.colors.surface },
                ]}
              >
                {/* Icône animée */}
                <View style={tw`items-center mb-4`}>
                  <LinearGradient
                    colors={config.colors}
                    style={tw`p-4 rounded-full`}
                  >
                    <MaterialCommunityIcons
                      name={config.icon}
                      size={48}
                      color={config.iconColor}
                    />
                  </LinearGradient>
                </View>

                {/* Titre */}
                <HeadingText
                  size="2xl"
                  weight="bold"
                  style={[
                    heading,
                    tw`text-center mb-2`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {title}
                </HeadingText>

                {/* Message */}
                <UIText
                  size="base"
                  weight="medium"
                  style={[
                    ui,
                    tw`text-center mb-6`,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  {message}
                </UIText>

                {/* Bouton de fermeture */}
                <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
                  <LinearGradient
                    colors={config.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={tw`py-3 px-6 rounded-2xl`}
                  >
                    <UIText
                      weight="bold"
                      style={[ui, tw`text-white text-center`]}
                    >
                      Fermer
                    </UIText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};
