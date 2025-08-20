import { useTheme } from "@/contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { SettingItem } from "./types";

interface SettingDetailViewProps {
  setting: SettingItem;
  onBack: () => void;
}

export const SettingDetailView: React.FC<SettingDetailViewProps> = ({
  setting,
  onBack,
}) => {
  const { currentTheme } = useTheme();

  const renderSteps = (steps: string[]) => {
    return steps.map((step, index) => (
      <View key={index} style={tw`flex-row items-start mb-2`}>
        <View
          style={[
            tw`w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5`,
            { backgroundColor: currentTheme.colors.accent },
          ]}
        >
          <Text style={tw`text-white text-xs font-bold`}>{index + 1}</Text>
        </View>
        <Text
          style={[
            tw`text-sm flex-1 leading-5`,
            { color: currentTheme.colors.text },
          ]}
        >
          {step}
        </Text>
      </View>
    ));
  };

  return (
    <View style={tw`flex-1`}>
      {/* Header avec retour */}
      <View
        style={[
          tw`flex-row items-center p-4 border-b`,
          { borderBottomColor: currentTheme.colors.border },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={tw`mr-3`}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={currentTheme.colors.text}
          />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text
            style={[tw`text-lg font-bold`, { color: currentTheme.colors.text }]}
          >
            {setting.title}
          </Text>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            {setting.description}
          </Text>
        </View>
      </View>

      {/* Contenu détaillé */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
      >
        {/* Étapes */}
        <View style={tw`mb-6`}>
          <Text
            style={[
              tw`text-lg font-semibold mb-4`,
              { color: currentTheme.colors.text },
            ]}
          >
            📋 Étapes à suivre
          </Text>
          {renderSteps(setting.steps)}
        </View>

        {/* Conseil */}
        {setting.tips && (
          <View
            style={[
              tw`p-3 rounded-lg mb-4 flex-row items-start`,
              {
                backgroundColor: "#D1FAE5",
                borderLeftWidth: 4,
                borderLeftColor: "#10B981",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lightbulb"
              size={20}
              color="#10B981"
              style={tw`mr-2`}
            />
            <View style={tw`flex-1`}>
              <Text
                style={[tw`text-sm font-semibold mb-1`, { color: "#065F46" }]}
              >
                💡 Conseil
              </Text>
              <Text style={[tw`text-sm leading-5`, { color: "#065F46" }]}>
                {setting.tips}
              </Text>
            </View>
          </View>
        )}

        {/* Avertissement */}
        {setting.warning && (
          <View
            style={[
              tw`p-3 rounded-lg mb-4 flex-row items-start`,
              {
                backgroundColor: "#FEF3C7",
                borderLeftWidth: 4,
                borderLeftColor: "#F59E0B",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="alert"
              size={20}
              color="#F59E0B"
              style={tw`mr-2`}
            />
            <View style={tw`flex-1`}>
              <Text
                style={[tw`text-sm font-semibold mb-1`, { color: "#92400E" }]}
              >
                ⚠️ Attention
              </Text>
              <Text style={[tw`text-sm leading-5`, { color: "#92400E" }]}>
                {setting.warning}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
