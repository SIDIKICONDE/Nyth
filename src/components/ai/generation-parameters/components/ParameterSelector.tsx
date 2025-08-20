import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../ui/Typography";
import { Option } from "../constants/options";

interface ParameterSelectorProps {
  label: string;
  selectedOption: Option;
  options: Option[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (optionId: string) => void;
}

export const ParameterSelector: React.FC<ParameterSelectorProps> = ({
  label,
  selectedOption,
  options,
  isOpen,
  onToggle,
  onSelect,
}) => {
  const { currentTheme } = useTheme();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.parameterButton,
          {
            backgroundColor: currentTheme.colors.card,
          },
        ]}
        onPress={onToggle}
      >
        <View style={tw`flex-row items-center`}>
          <UIText size="xl" style={tw`mr-3`} color={currentTheme.colors.text}>
            {selectedOption.icon}
          </UIText>
          <View>
            <UIText size="xs" color={currentTheme.colors.textSecondary}>
              {label}
            </UIText>
            <UIText color={currentTheme.colors.text}>
              {selectedOption.label}
            </UIText>
          </View>
        </View>
        <MaterialCommunityIcons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={24}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <View
          style={[
            styles.optionsContainer,
            { backgroundColor: currentTheme.colors.card },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`p-2`}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  {
                    backgroundColor:
                      option.id === selectedOption.id
                        ? `${currentTheme.colors.primary}15`
                        : "transparent",
                    borderColor:
                      option.id === selectedOption.id
                        ? currentTheme.colors.primary
                        : "transparent",
                  },
                  { marginHorizontal: 4 },
                ]}
                onPress={() => onSelect(option.id)}
              >
                <UIText
                  size="xl"
                  style={tw`mb-1`}
                  color={currentTheme.colors.text}
                >
                  {option.icon}
                </UIText>
                <UIText
                  size="xs"
                  align="center"
                  style={{ color: currentTheme.colors.text }}
                >
                  {option.label}
                </UIText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  parameterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionsContainer: {
    borderRadius: 8,
    marginTop: -4,
    marginBottom: 8,
    overflow: "hidden",
  },
  option: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 80,
  },
});
