import { ChatStyleId, useChatStyle } from "@/contexts/ChatStyleContext";
import { useTheme } from "@/contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Dimensions, ScrollView, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { UIText } from "../ui";

interface StyleOption {
  id: ChatStyleId;
  label: string;
  icon: string;
  color: string;
}

const STYLES: StyleOption[] = [
  {
    id: "classic",
    label: "Classique",
    icon: "chat",
    color: "#007AFF",
  },
  {
    id: "minimal",
    label: "Minimal",
    icon: "chat-outline",
    color: "#8E8E93",
  },
  {
    id: "neon",
    label: "Néon",
    icon: "lightning-bolt",
    color: "#7C3AED",
  },

  {
    id: "modern",
    label: "Moderne",
    icon: "square-rounded",
    color: "#FF9500",
  },
  {
    id: "elegant",
    label: "Élégant",
    icon: "diamond-stone",
    color: "#AF52DE",
  },
  {
    id: "retro",
    label: "Rétro",
    icon: "television-classic",
    color: "#FF6B6B",
  },
  {
    id: "glass",
    label: "Verre",
    icon: "circle",
    color: "#00D4AA",
  },
  {
    id: "ios",
    label: "iOS",
    icon: "apple",
    color: "#1C1C1E",
  },
  {
    id: "gradient",
    label: "Dégradé",
    icon: "gradient-horizontal",
    color: "#EC4899",
  },
  {
    id: "terminal",
    label: "Terminal",
    icon: "console",
    color: "#10B981",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: "robot",
    color: "#10A37F",
  },
];

const ChatStyleSelector: React.FC = () => {
  const { selectedStyle, setSelectedStyle } = useChatStyle();
  const { currentTheme } = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = 85; // Largeur fixe pour plus de styles visibles

  // Composant pour l'aperçu mini d'une bulle
  const MiniBubblePreview: React.FC<{
    styleId: ChatStyleId;
    isUser: boolean;
  }> = ({ styleId, isUser }) => {
    const getBubbleStyle = () => {
      switch (styleId) {
        case "minimal":
          return [
            tw`w-4 h-2 rounded-sm`,
            {
              backgroundColor: "transparent",
              borderWidth: 0.5,
              borderColor: isUser
                ? currentTheme.colors.accent
                : currentTheme.colors.border,
            },
          ];
        case "neon":
          return [
            tw`w-4 h-2 rounded-sm`,
            {
              backgroundColor: isUser ? "#7C3AED" : "#1E40AF",
              shadowColor: isUser ? "#7C3AED" : "#1E40AF",
              shadowOpacity: 0.6,
              shadowRadius: 2,
              elevation: 3,
            },
          ];

        case "modern":
          return [
            tw`w-4 h-2 rounded-none`,
            {
              backgroundColor: isUser ? "#FF9500" : currentTheme.colors.surface,
              borderLeftWidth: isUser ? 0 : 2,
              borderRightWidth: isUser ? 2 : 0,
              borderColor: isUser ? "#FF9500" : currentTheme.colors.accent,
            },
          ];
        case "elegant":
          return [
            tw`w-4 h-2`,
            {
              backgroundColor: isUser ? "#AF52DE" : currentTheme.colors.surface,
              borderRadius: 6,
              borderWidth: 0.5,
              borderColor: isUser ? "#AF52DE" : currentTheme.colors.border,
              shadowColor: "#AF52DE",
              shadowOpacity: isUser ? 0.3 : 0,
              shadowRadius: 1,
            },
          ];
        case "retro":
          return [
            tw`w-4 h-2 rounded-sm`,
            {
              backgroundColor: isUser ? "#FF6B6B" : "#F0F0F0",
              borderWidth: 1,
              borderColor: isUser ? "#FF4757" : "#DDD",
              borderStyle: "solid",
            },
          ];
        case "glass":
          return [
            tw`w-4 h-2 rounded-lg`,
            {
              backgroundColor: isUser
                ? "rgba(0, 212, 170, 0.2)"
                : "rgba(255, 255, 255, 0.1)",
              borderWidth: 0.5,
              borderColor: isUser
                ? "rgba(0, 212, 170, 0.4)"
                : "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
            },
          ];
        case "ios":
          return [
            tw`w-4 h-2`,
            {
              backgroundColor: "rgba(72, 72, 74, 0.85)",
              borderRadius: 4,
              borderWidth: 0.3,
              borderColor: "rgba(120, 120, 128, 0.5)",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 1,
              elevation: 2,
            },
          ];
        case "gradient":
          return [
            tw`w-4 h-2 rounded-lg`,
            {
              backgroundColor: isUser ? "#EC4899" : "#8B5CF6",
              opacity: 0.9,
            },
          ];
        case "terminal":
          return [
            tw`w-4 h-2 rounded-sm`,
            {
              backgroundColor: isUser ? "#10B981" : "#1F2937",
              borderWidth: 1,
              borderColor: "#10B981",
              opacity: 0.9,
            },
          ];
        case "chatgpt":
          return [
            tw`w-4 h-2 rounded-lg`,
            {
              backgroundColor: isUser
                ? currentTheme.isDark
                  ? "#2f2f2f"
                  : "#f7f7f8"
                : currentTheme.isDark
                ? "#444654"
                : "#ffffff",
              borderWidth: isUser ? 0 : 1,
              borderColor: currentTheme.isDark ? "#565869" : "#e5e5e7",
            },
          ];
        default: // classic
          return [
            tw`w-4 h-2 rounded-none`,
            {
              backgroundColor: "transparent",
              borderWidth: 0.5,
              borderColor: currentTheme.colors.textSecondary,
              opacity: 0.3,
            },
          ];
      }
    };

    return <View style={getBubbleStyle()} />;
  };

  // Aperçu miniature du style
  const MiniStylePreview: React.FC<{ styleId: ChatStyleId }> = ({
    styleId,
  }) => (
    <View style={tw`flex-row justify-between items-center w-full px-1`}>
      <View style={tw`items-start`}>
        <MiniBubblePreview styleId={styleId} isUser={false} />
        <View style={tw`mt-0.5`}>
          <MiniBubblePreview styleId={styleId} isUser={false} />
        </View>
      </View>
      <View style={tw`items-end`}>
        <MiniBubblePreview styleId={styleId} isUser={true} />
        <View style={tw`mt-0.5`}>
          <MiniBubblePreview styleId={styleId} isUser={true} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={tw`px-4`}>
      {/* Titre */}
      <UIText
        size="sm"
        weight="medium"
        style={[
          tw`mb-3 opacity-70`,
          { color: currentTheme.colors.textSecondary },
        ]}
      >
        Choisissez votre style
      </UIText>

      {/* Slider horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`gap-3`}
        style={tw`-mx-1`}
      >
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;

          return (
            <TouchableOpacity
              key={style.id}
              onPress={() => setSelectedStyle(style.id)}
              style={[
                tw`rounded-2xl p-3 items-center`,
                {
                  width: cardWidth,
                  backgroundColor: isSelected
                    ? currentTheme.colors.accent + "15"
                    : currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.03)",
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? currentTheme.colors.accent
                    : currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.06)",
                },
              ]}
              activeOpacity={0.7}
            >
              {/* Icône avec indicateur de sélection */}
              <View style={tw`relative mb-2`}>
                <View
                  style={[
                    tw`w-8 h-8 rounded-full items-center justify-center`,
                    {
                      backgroundColor: isSelected
                        ? currentTheme.colors.accent + "20"
                        : currentTheme.isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={style.icon as any}
                    size={16}
                    color={
                      isSelected
                        ? currentTheme.colors.accent
                        : currentTheme.colors.textSecondary
                    }
                  />
                </View>

                {/* Badge de sélection */}
                {isSelected && (
                  <View
                    style={[
                      tw`absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center`,
                      { backgroundColor: currentTheme.colors.accent },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={10}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </View>

              {/* Nom du style */}
              <UIText
                size="xs"
                weight="medium"
                style={[
                  tw`text-center mb-2`,
                  {
                    color: isSelected
                      ? currentTheme.colors.accent
                      : currentTheme.colors.text,
                  },
                ]}
                numberOfLines={1}
              >
                {style.label}
              </UIText>

              {/* Mini aperçu */}
              <View
                style={[
                  tw`w-full h-6 rounded-lg items-center justify-center`,
                  {
                    backgroundColor: currentTheme.isDark
                      ? "rgba(255, 255, 255, 0.03)"
                      : "rgba(0, 0, 0, 0.02)",
                  },
                ]}
              >
                <MiniStylePreview styleId={style.id} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ChatStyleSelector;
