import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as React from "react";
import { Platform, StatusBar, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types/navigation";
import AnimatedMenuIcon from "./AnimatedMenuIcon";

interface ChatHeaderProps {
  showHuggingFaceButton: boolean;
  onActivateHuggingFace: () => void;
  onMenuPress: () => void;
  onFontSettingsPress: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList, "AIChat">;

const ChatHeader: React.FC<ChatHeaderProps> = ({
  showHuggingFaceButton,
  onActivateHuggingFace,
  onMenuPress,
  onFontSettingsPress,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fonction pour retourner à l'écran précédent
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View
      style={[
        tw`flex-row items-center justify-between px-4 py-3`,
        {
          backgroundColor: "transparent", // Fond transparent
          paddingTop:
            Platform.OS === "ios"
              ? StatusBar.currentHeight || 44
              : StatusBar.currentHeight || 24,
        },
      ]}
    >
      {/* Bouton retour */}
      <TouchableOpacity
        onPress={handleGoBack}
        style={[
          tw`w-10 h-10 rounded-full items-center justify-center`,
          {
            backgroundColor: currentTheme.isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.45)",
            borderWidth: 1,
            borderColor: currentTheme.isDark
              ? "rgba(255,255,255,0.25)"
              : "rgba(255,255,255,0.3)",
          },
        ]}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color={currentTheme.colors.text}
        />
      </TouchableOpacity>

      {/* Espace central vide */}
      <View style={tw`flex-1`}>
        {/* Titre supprimé */}
      </View>

      {/* Actions à droite */}
      <View style={tw`flex-row items-center`}>
        {/* Bouton HuggingFace si nécessaire */}
        {showHuggingFaceButton && (
          <TouchableOpacity
            onPress={onActivateHuggingFace}
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center`,
              {
                backgroundColor: "#FF6B35",
                shadowColor: "#FF6B35",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
                marginRight: 8,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              },
            ]}
          >
            <MaterialCommunityIcons name="robot" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Bouton menu animé */}
        <View
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.45)",
              borderWidth: 1,
              borderColor: currentTheme.isDark
                ? "rgba(255,255,255,0.25)"
                : "rgba(255,255,255,0.3)",
            },
          ]}
        >
          <AnimatedMenuIcon
            size={20}
            color={currentTheme.colors.text}
            onPress={onMenuPress}
          />
        </View>
      </View>
    </View>
  );
};

export default ChatHeader;
