import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideInDown,
  SlideOutUp,
} from "react-native-reanimated";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";

interface EmailSuggestionAlertProps {
  visible: boolean;
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  onDismiss: () => void;
}

const { width } = Dimensions.get("window");

export const EmailSuggestionAlert: React.FC<EmailSuggestionAlertProps> = ({
  visible,
  suggestions,
  onSuggestionSelect,
  onDismiss,
}) => {
  const { currentTheme } = useTheme();

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={SlideInDown.duration(400).springify()}
      exiting={SlideOutUp.duration(300)}
      style={[
        tw`absolute top-0 left-0 right-0 z-50`,
        {
          paddingTop: 50, // Pour éviter la status bar
        },
      ]}
    >
      <View
        style={[
          tw`mx-4 rounded-xl p-4 shadow-lg`,
          {
            backgroundColor: currentTheme.colors.background,
            borderWidth: 1,
            borderColor: currentTheme.colors.primary + "30",
            shadowColor: currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          },
        ]}
      >
        {/* Header avec icône et bouton fermer */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                {
                  backgroundColor: currentTheme.colors.primary + "20",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="email-edit"
                size={18}
                color={currentTheme.colors.primary}
              />
            </View>
            <Text
              style={[
                tw`text-base font-semibold`,
                { color: currentTheme.colors.text },
              ]}
            >
              📧 Suggestion d'email
            </Text>
          </View>

          <TouchableOpacity
            onPress={onDismiss}
            style={[
              tw`w-8 h-8 rounded-full items-center justify-center`,
              {
                backgroundColor: currentTheme.colors.text + "10",
              },
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={currentTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Message */}
        <Text
          style={[
            tw`text-sm mb-3`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Nous avons détecté une possible faute de frappe. Vouliez-vous dire :
        </Text>

        {/* Liste des suggestions */}
        <View style={tw`gap-2`}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                onSuggestionSelect(suggestion);
                onDismiss();
              }}
              style={[
                tw`p-3 rounded-lg flex-row items-center`,
                {
                  backgroundColor: currentTheme.colors.primary + "15",
                  borderWidth: 1,
                  borderColor: currentTheme.colors.primary + "20",
                },
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  tw`w-6 h-6 rounded-full items-center justify-center mr-3`,
                  {
                    backgroundColor: currentTheme.colors.primary + "30",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="email"
                  size={14}
                  color={currentTheme.colors.primary}
                />
              </View>

              <Text
                style={[
                  tw`text-base font-medium flex-1`,
                  { color: currentTheme.colors.primary },
                ]}
              >
                {suggestion}
              </Text>

              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={currentTheme.colors.primary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Note en bas */}
        <Text
          style={[
            tw`text-xs mt-3 text-center`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Appuyez sur une suggestion pour l'utiliser
        </Text>
      </View>
    </Animated.View>
  );
};
