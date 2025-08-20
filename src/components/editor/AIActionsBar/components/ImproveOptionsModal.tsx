import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { ImprovementFocus, ImprovementStyle } from "../hooks/useImproveAction";

interface ImproveOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onImprove: (options: {
    style: ImprovementStyle;
    focus: ImprovementFocus;
    preserveLength: boolean;
    addExamples: boolean;
  }) => void;
}

export const ImproveOptionsModal: React.FC<ImproveOptionsModalProps> = ({
  visible,
  onClose,
  onImprove,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const [selectedStyle, setSelectedStyle] =
    useState<ImprovementStyle>("engaging");
  const [selectedFocus, setSelectedFocus] = useState<ImprovementFocus>("all");
  const [preserveLength, setPreserveLength] = useState(false);
  const [addExamples, setAddExamples] = useState(false);

  const styles: Array<{
    value: ImprovementStyle;
    label: string;
    icon: string;
    description: string;
  }> = [
    {
      value: "concise",
      label: t("ai.improve.styles.concise", "Concis"),
      icon: "text-short",
      description: t(
        "ai.improve.styles.conciseDesc",
        "Direct et sans superflu"
      ),
    },
    {
      value: "detailed",
      label: t("ai.improve.styles.detailed", "Détaillé"),
      icon: "text-long",
      description: t(
        "ai.improve.styles.detailedDesc",
        "Ajoute des précisions utiles"
      ),
    },
    {
      value: "engaging",
      label: t("ai.improve.styles.engaging", "Engageant"),
      icon: "star",
      description: t("ai.improve.styles.engagingDesc", "Captivant et vivant"),
    },
    {
      value: "formal",
      label: t("ai.improve.styles.formal", "Formel"),
      icon: "tie",
      description: t(
        "ai.improve.styles.formalDesc",
        "Professionnel et sérieux"
      ),
    },
    {
      value: "casual",
      label: t("ai.improve.styles.casual", "Décontracté"),
      icon: "emoticon-happy",
      description: t("ai.improve.styles.casualDesc", "Amical et accessible"),
    },
  ];

  const focuses: Array<{
    value: ImprovementFocus;
    label: string;
    icon: string;
  }> = [
    {
      value: "clarity",
      label: t("ai.improve.focus.clarity", "Clarté"),
      icon: "eye",
    },
    {
      value: "impact",
      label: t("ai.improve.focus.impact", "Impact"),
      icon: "lightning-bolt",
    },
    {
      value: "flow",
      label: t("ai.improve.focus.flow", "Fluidité"),
      icon: "waves",
    },
    {
      value: "all",
      label: t("ai.improve.focus.all", "Tout"),
      icon: "all-inclusive",
    },
  ];

  const handleImprove = () => {
    onImprove({
      style: selectedStyle,
      focus: selectedFocus,
      preserveLength,
      addExamples,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
        <View
          style={[
            tw`rounded-t-3xl p-6`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          {/* Header */}
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text
              style={[
                tw`text-xl font-bold`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("ai.improve.options.title", "Options d'amélioration")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={currentTheme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Style Selection */}
            <View style={tw`mb-6`}>
              <Text
                style={[
                  tw`text-base font-semibold mb-3`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t("ai.improve.options.style", "Style d'amélioration")}
              </Text>
              {styles.map((style) => (
                <TouchableOpacity
                  key={style.value}
                  onPress={() => setSelectedStyle(style.value)}
                  style={[
                    tw`flex-row items-center p-3 rounded-lg mb-2`,
                    {
                      backgroundColor:
                        selectedStyle === style.value
                          ? `${currentTheme.colors.primary}20`
                          : currentTheme.colors.background,
                      borderWidth: 1,
                      borderColor:
                        selectedStyle === style.value
                          ? currentTheme.colors.primary
                          : currentTheme.colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={style.icon}
                    size={24}
                    color={
                      selectedStyle === style.value
                        ? currentTheme.colors.primary
                        : currentTheme.colors.textSecondary
                    }
                  />
                  <View style={tw`ml-3 flex-1`}>
                    <Text
                      style={[
                        tw`font-medium`,
                        { color: currentTheme.colors.text },
                      ]}
                    >
                      {style.label}
                    </Text>
                    <Text
                      style={[
                        tw`text-xs mt-1`,
                        { color: currentTheme.colors.textSecondary },
                      ]}
                    >
                      {style.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Focus Selection */}
            <View style={tw`mb-6`}>
              <Text
                style={[
                  tw`text-base font-semibold mb-3`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t("ai.improve.options.focus", "Focus principal")}
              </Text>
              <View style={tw`flex-row flex-wrap -mx-1`}>
                {focuses.map((focus) => (
                  <TouchableOpacity
                    key={focus.value}
                    onPress={() => setSelectedFocus(focus.value)}
                    style={[
                      tw`m-1 px-3 py-2 rounded-lg flex-row items-center`,
                      {
                        backgroundColor:
                          selectedFocus === focus.value
                            ? currentTheme.colors.primary
                            : currentTheme.colors.background,
                        borderWidth: 1,
                        borderColor:
                          selectedFocus === focus.value
                            ? currentTheme.colors.primary
                            : currentTheme.colors.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={focus.icon}
                      size={16}
                      color={
                        selectedFocus === focus.value
                          ? "#ffffff"
                          : currentTheme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        tw`ml-1 text-sm`,
                        {
                          color:
                            selectedFocus === focus.value
                              ? "#ffffff"
                              : currentTheme.colors.text,
                        },
                      ]}
                    >
                      {focus.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Options */}
            <View style={tw`mb-6`}>
              <Text
                style={[
                  tw`text-base font-semibold mb-3`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t(
                  "ai.improve.options.additionalOptions",
                  "Options supplémentaires"
                )}
              </Text>

              <View
                style={[
                  tw`flex-row justify-between items-center p-3 rounded-lg mb-2`,
                  { backgroundColor: currentTheme.colors.background },
                ]}
              >
                <Text style={[tw`flex-1`, { color: currentTheme.colors.text }]}>
                  {t(
                    "ai.improve.options.preserveLength",
                    "Conserver la longueur"
                  )}
                </Text>
                <Switch
                  value={preserveLength}
                  onValueChange={setPreserveLength}
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor="#ffffff"
                />
              </View>

              <View
                style={[
                  tw`flex-row justify-between items-center p-3 rounded-lg`,
                  { backgroundColor: currentTheme.colors.background },
                ]}
              >
                <Text style={[tw`flex-1`, { color: currentTheme.colors.text }]}>
                  {t("ai.improve.options.addExamples", "Ajouter des exemples")}
                </Text>
                <Switch
                  value={addExamples}
                  onValueChange={setAddExamples}
                  trackColor={{
                    false: currentTheme.colors.border,
                    true: currentTheme.colors.primary,
                  }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={tw`flex-row mt-4`}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                tw`flex-1 py-3 rounded-lg mr-2`,
                { backgroundColor: currentTheme.colors.background },
              ]}
            >
              <Text
                style={[
                  tw`text-center font-medium`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleImprove}
              style={[
                tw`flex-1 py-3 rounded-lg ml-2`,
                { backgroundColor: currentTheme.colors.primary },
              ]}
            >
              <UIText
                weight="600"
                style={[
                  tw`text-white text-center`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t("ai.improve.apply", "Améliorer")}
              </UIText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
