import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAdmin } from "../../../hooks/useAdmin";
import { RootStackParamList } from "../../../types/navigation";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function AdminButton() {
  const { currentTheme } = useTheme();
  const { isAdmin, isSuperAdmin } = useAdmin();
  const navigation = useNavigation<NavigationProp>();

  // Ne pas afficher le bouton si l'utilisateur n'est pas super admin
  if (!isSuperAdmin) {
    return null;
  }

  const handlePress = () => {
    navigation.navigate("Admin");
  };

  return (
    <View style={tw`px-4 mb-4`}>
      <TouchableOpacity
        style={[
          tw`flex-row items-center justify-between p-4 rounded-xl`,
          {
            backgroundColor: currentTheme.colors.primary + "15",
            borderWidth: 1,
            borderColor: currentTheme.colors.primary + "30",
          },
        ]}
        onPress={handlePress}
      >
        <View style={tw`flex-row items-center flex-1`}>
          <View
            style={[
              tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
              { backgroundColor: currentTheme.colors.primary + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="shield-crown"
              size={24}
              color={currentTheme.colors.primary}
            />
          </View>
          <View style={tw`flex-1`}>
            <UIText
              size="base"
              weight="semibold"
              color={currentTheme.colors.text}
            >
              Panneau d'administration
            </UIText>
            <UIText
              size="sm"
              color={currentTheme.colors.textSecondary}
              style={tw`mt-0.5`}
            >
              {isSuperAdmin ? "Accès Super Admin" : "Accès Admin"} • Gérer les
              utilisateurs
            </UIText>
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}
