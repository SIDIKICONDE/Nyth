import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { Script } from "../../types";
import { AIFriendlyIcon, AIRealisticBrainIcon } from "../icons";
import { useCustomAlert } from "../ui/CustomAlert";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('HomeFAB');

type TabType = "scripts" | "videos";

interface HomeFABProps {
  activeTab: TabType;
  scripts: Script[];
  onCreateScript: () => void;
  onRecordVideo: (scriptId: string) => void;
  onAIGenerate: () => void;
  onAIChat: () => void;
}

export default function HomeFAB({
  activeTab,
  scripts,
  onCreateScript,
  onRecordVideo,
  onAIGenerate,
  onAIChat,
}: HomeFABProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();

  // Animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      // Animations d'ouverture
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animations de fermeture
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, fadeAnim, rotateAnim, scaleAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const handleRecordPress = () => {
    if (scripts.length > 0) {
      // Vérifier que le premier script existe vraiment
      const firstScript = scripts.find((s) => s.id && s.content);
      if (firstScript) {
        onRecordVideo(firstScript.id);
      } else {
        logger.debug("🚫 Premier script invalide, ouverture de l'éditeur");
        onCreateScript();
      }
    } else {
      showAlert({
        type: "warning",
        title: t("home.noScript.title"),
        message: t("home.noScript.message"),
        buttons: [
          {
            text: t("home.noScript.createScript"),
            onPress: onCreateScript,
          },
          {
            text: t("home.noScript.generateWithAI"),
            onPress: onAIGenerate,
          },
        ],
      });
    }
  };

  if (activeTab === "videos") {
    return null;
  }

  return (
    <>
      {/* Menu des boutons secondaires avec animations */}
      <Animated.View
        style={[
          tw`absolute bottom-32 right-4`,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        {/* AI Chat Button */}
        <Animated.View
          style={{
            transform: [
              {
                translateY: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setIsOpen(false);
              onAIChat();
            }}
            style={[
              tw`w-14 h-14 rounded-full items-center justify-center mb-2`,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "transparent",
                shadowColor: "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              },
            ]}
            activeOpacity={0.8}
          >
            <AIFriendlyIcon
              size={55}
              primaryColor={currentTheme.colors.accent}
              secondaryColor={currentTheme.colors.secondary}
              animated={true}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* AI Generator Button */}
        <Animated.View
          style={{
            transform: [
              {
                translateY: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setIsOpen(false);
              onAIGenerate();
            }}
            style={[
              tw`w-14 h-14 rounded-full items-center justify-center mb-2`,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: "transparent",
                shadowColor: "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              },
            ]}
            activeOpacity={0.8}
          >
            <AIRealisticBrainIcon size={55} />
          </TouchableOpacity>
        </Animated.View>

        {/* Manual Creation Button */}
        <Animated.View
          style={{
            transform: [
              {
                translateY: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setIsOpen(false);
              onCreateScript();
            }}
            style={[
              tw`w-14 h-14 rounded-full items-center justify-center mb-2`,
              {
                backgroundColor: currentTheme.colors.accent,
                shadowColor: currentTheme.colors.accent,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Main FAB button avec animation de rotation */}
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={[
          tw`absolute bottom-8 w-16 h-16 rounded-full items-center justify-center right-4`,
          {
            backgroundColor: currentTheme.colors.primary,
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          },
        ]}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons
            name={isOpen ? "close" : "add"}
            size={28}
            color={currentTheme.colors.text}
          />
        </Animated.View>
      </TouchableOpacity>

      <AlertComponent />
    </>
  );
}
