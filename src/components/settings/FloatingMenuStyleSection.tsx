import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useFABDesign } from "../home/UnifiedHomeFAB/hooks/useFABDesign";
import { FABDesignType } from "../home/UnifiedHomeFAB/types";
import { UIText } from "../ui/Typography";
import Card from "./Card";
import SectionHeader from "./SectionHeader";

interface FABDesignOption {
  type: FABDesignType;
  name: string;
  description: string;
  icon: string;
  preview: string;
  color: string;
}

export const FloatingMenuStyleSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { fabDesign, setFabDesign } = useFABDesign();

  const designOptions: FABDesignOption[] = [
    {
      type: "stacked",
      name: "Cartes Empilées",
      description: "Cartes qui se déploient avec rotation élégante",
      icon: "cards-outline",
      preview: "🃏",
      color: "#10B981",
    },
    {
      type: "orbital",
      name: "Orbital",
      description: "Boutons qui orbitent autour du centre",
      icon: "orbit",
      preview: "🌟",
      color: "#3B82F6",
    },
    {
      type: "hamburger",
      name: "Menu Hamburger",
      description: "Menu vertical centré en bas",
      icon: "menu",
      preview: "🍔",
      color: "#8B5CF6",
    },
  ];

  const handleDesignSelect = async (designType: FABDesignType) => {
    await setFabDesign(designType);
  };

  return (
    <View>
      <SectionHeader title="Style du Menu Flottant" />
      <Card>
        <View style={tw`p-4`}>
          {/* Description */}
          <View style={tw`mb-6`}>
            <UIText
              size="sm"
              color={currentTheme.colors.textSecondary}
              style={tw`text-center`}
            >
              Choisissez le style d'animation pour votre menu flottant
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
                  tw`mr-4 p-4 rounded-2xl min-w-[140px]`,
                  {
                    backgroundColor:
                      fabDesign === option.type
                        ? `${option.color}20`
                        : currentTheme.colors.surface,
                    borderWidth: 2,
                    borderColor:
                      fabDesign === option.type
                        ? option.color
                        : currentTheme.colors.border,
                    shadowColor: option.color,
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
                            ? option.color
                            : `${option.color}20`,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={20}
                      color={
                        fabDesign === option.type ? "#ffffff" : option.color
                      }
                    />
                  </View>

                  {fabDesign === option.type && (
                    <View
                      style={[
                        tw`w-6 h-6 rounded-full items-center justify-center`,
                        { backgroundColor: option.color },
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
                  size="sm"
                  weight="semibold"
                  style={tw`mb-2`}
                  color={
                    fabDesign === option.type
                      ? option.color
                      : currentTheme.colors.text
                  }
                >
                  {option.name}
                </UIText>

                {/* Description */}
                <UIText
                  size="xs"
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

          {/* Style actuel */}
          <View
            style={[
              tw`mt-4 p-3 rounded-lg`,
              { backgroundColor: currentTheme.colors.background },
            ]}
          >
            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={tw`text-center`}
            >
              Style actuel :{" "}
              <UIText
                size="xs"
                weight="semibold"
                color={currentTheme.colors.primary}
              >
                {designOptions.find((opt) => opt.type === fabDesign)?.name ||
                  "Cartes Empilées"}
              </UIText>
            </UIText>
          </View>
        </View>
      </Card>
    </View>
  );
};
