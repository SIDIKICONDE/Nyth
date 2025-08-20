import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useFABDesign } from "../home/UnifiedHomeFAB/hooks/useFABDesign";
import { FABDesignType } from "@/components/home/UnifiedHomeFAB/types";
import { UIText } from "../ui/Typography";

interface FABDesignOption {
  type: FABDesignType;
  name: string;
  description: string;
  icon: string;
  preview: string;
}

export const FABDesignSelector: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { fabDesign, setFabDesign } = useFABDesign();

  const designOptions: FABDesignOption[] = [
    {
      type: "stacked",
      name: t("fabDesignSelector.designs.stacked.name", "Cartes Empilées 🃏"),
      description: t(
        "fabDesignSelector.designs.stacked.description",
        "Cartes qui se déploient avec rotation"
      ),
      icon: "cards-outline",
      preview: "🃏🃏🃏",
    },
    {
      type: "orbital",
      name: t("fabDesignSelector.designs.orbital.name", "Orbital ✨"),
      description: t(
        "fabDesignSelector.designs.orbital.description",
        "Boutons qui orbitent autour du centre"
      ),
      icon: "orbit",
      preview: "○ ● ○",
    },
    {
      type: "hamburger",
      name: t("fabDesignSelector.designs.hamburger.name", "Menu Hamburger 🍔"),
      description: t(
        "fabDesignSelector.designs.hamburger.description",
        "Menu vertical centré en bas"
      ),
      icon: "menu",
      preview: "≡",
    },
  ];

  const handleDesignSelect = async (designType: FABDesignType) => {
    await setFabDesign(designType);
  };

  return (
    <View style={tw`mb-6`}>
      {/* Header */}
      <View style={tw`flex-row items-center mb-4`}>
        <MaterialCommunityIcons
          name="gesture-tap-button"
          size={24}
          color={currentTheme.colors.primary}
        />
        <UIText
          size="lg"
          weight="semibold"
          style={tw`ml-3`}
          color={currentTheme.colors.text}
        >
          {t("fabDesignSelector.title", "Style du Menu Flottant")}
        </UIText>
      </View>
      {/* Options de design */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`pb-2`}
      >
        {designOptions.map((option) => (
          <TouchableOpacity
            key={option.type}
            onPress={() => handleDesignSelect(option.type)}
            style={[
              tw`mr-4 p-4 rounded-2xl min-w-[160px]`,
              {
                backgroundColor:
                  fabDesign === option.type
                    ? `${currentTheme.colors.primary}20`
                    : currentTheme.colors.surface,
                borderWidth: 2,
                borderColor:
                  fabDesign === option.type
                    ? currentTheme.colors.primary
                    : currentTheme.colors.border,
                shadowColor: currentTheme.colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: fabDesign === option.type ? 0.2 : 0,
                shadowRadius: 4,
                elevation: fabDesign === option.type ? 4 : 1,
              },
            ]}
            activeOpacity={0.8}
          >
            {/* Icône et indicateur de sélection */}
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View
                style={[
                  tw`w-10 h-10 rounded-full items-center justify-center`,
                  {
                    backgroundColor:
                      fabDesign === option.type
                        ? currentTheme.colors.primary
                        : `${currentTheme.colors.primary}20`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={20}
                  color={
                    fabDesign === option.type
                      ? "#ffffff"
                      : currentTheme.colors.primary
                  }
                />
              </View>

              {fabDesign === option.type && (
                <View
                  style={[
                    tw`w-6 h-6 rounded-full items-center justify-center`,
                    { backgroundColor: currentTheme.colors.primary },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color="#ffffff"
                  />
                </View>
              )}
            </View>

            {/* Nom du design */}
            <UIText
              size={16}
              weight="semibold"
              style={tw`mb-2`}
              color={
                fabDesign === option.type
                  ? currentTheme.colors.primary
                  : currentTheme.colors.text
              }
            >
              {option.name}
            </UIText>

            {/* Description */}
            <UIText
              size={12}
              style={tw`mb-3`}
              color={currentTheme.colors.textSecondary}
            >
              {option.description}
            </UIText>

            {/* Aperçu visuel */}
            <View
              style={[
                tw`p-2 rounded-lg`,
                { backgroundColor: currentTheme.colors.background },
              ]}
            >
              <UIText
                size="lg"
                style={tw`text-center`}
                color={currentTheme.colors.textSecondary}
              >
                {option.preview}
              </UIText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
