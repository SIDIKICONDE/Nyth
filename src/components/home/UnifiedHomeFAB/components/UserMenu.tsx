import { UIText } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BlurView } from "@react-native-community/blur";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { USER_QUICK_ACTIONS } from "../constants";

interface UserMenuProps {
  showUserMenu: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  onSignIn: () => void;
  onActionPress: (route: string) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  showUserMenu,
  onClose,
  onCreateAccount,
  onSignIn,
  onActionPress,
}) => {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  if (!showUserMenu) return null;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={[tw`absolute inset-0`, { zIndex: 9998 }]}
        onPress={onClose}
        activeOpacity={1}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            blurAmount={20}
            blurType="dark"
            style={tw`absolute inset-0`}
          />
        ) : (
          <View
            style={[
              tw`absolute inset-0`,
              { backgroundColor: "rgba(0,0,0,0.3)" },
            ]}
          />
        )}
      </TouchableOpacity>

      {/* Menu */}
      <View
        style={[
          tw`absolute bottom-20 left-4`,
          {
            zIndex: 10000,
            width: 220,
          },
        ]}
      >
        <View
          style={[
            tw`rounded-2xl overflow-hidden`,
            {
              backgroundColor:
                Platform.OS === "ios"
                  ? "rgba(255,255,255,0.85)"
                  : currentTheme.colors.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 15,
            },
          ]}
        >
          {Platform.OS === "ios" && (
            <BlurView
              blurAmount={100}
              blurType="dark"
              style={tw`absolute inset-0`}
            />
          )}

          <View
            style={[
              tw`p-3`,
              {
                backgroundColor:
                  Platform.OS === "ios" ? "transparent" : undefined,
              },
            ]}
          >
            {!user || user.isGuest ? (
              // Actions invité
              <>
                <View style={tw`mb-3`}>
                  <UIText
                    size="sm"
                    weight="semibold"
                    style={[
                      tw`text-center`,
                      { color: currentTheme.colors.text },
                    ]}
                  >
                    {t("profile.guest.welcome", "Bienvenue ! 👋")}
                  </UIText>
                  <UIText
                    size="xs"
                    style={[
                      tw`text-center mt-1`,
                      { color: currentTheme.colors.textSecondary },
                    ]}
                  >
                    {t(
                      "profile.guest.subtitle",
                      "Créez un compte pour sauvegarder vos données"
                    )}
                  </UIText>
                </View>

                <TouchableOpacity onPress={onCreateAccount} activeOpacity={0.8}>
                  <LinearGradient
                    colors={["#10B981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={tw`rounded-xl p-4`}
                  >
                    <View
                      style={tw`flex-row items-center justify-center gap-2`}
                    >
                      <MaterialCommunityIcons
                        name="account-plus"
                        size={22}
                        color="white"
                      />
                      <UIText
                        size="base"
                        weight="semibold"
                        style={tw`text-white`}
                      >
                        {t(
                          "profile.guest.createAccount.button",
                          "Créer un compte"
                        )}
                      </UIText>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onSignIn}
                  style={tw`mt-3 p-2`}
                  activeOpacity={0.7}
                >
                  <UIText
                    size="sm"
                    style={[
                      tw`text-center`,
                      { color: currentTheme.colors.primary },
                    ]}
                  >
                    {t(
                      "profile.guest.alreadyHaveAccount",
                      "Déjà un compte ? Se connecter"
                    )}
                  </UIText>
                </TouchableOpacity>
              </>
            ) : (
              // Actions utilisateur
              <View style={tw`flex-row flex-wrap justify-center`}>
                {USER_QUICK_ACTIONS.map((action, index) => (
                  <View key={index} style={tw`w-1/2 px-1 mb-2`}>
                    <TouchableOpacity
                      onPress={() => onActionPress(action.route)}
                      style={[
                        tw`items-center justify-center py-3 px-2 rounded-lg`,
                        { backgroundColor: currentTheme.colors.surface },
                      ]}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={action.icon}
                        size={22}
                        color={
                          "color" in action && action.color === "error"
                            ? currentTheme.colors.error
                            : currentTheme.colors.primary
                        }
                      />
                      <UIText
                        size="xs"
                        style={[
                          tw`mt-1 text-center`,
                          {
                            color:
                              "color" in action && action.color === "error"
                                ? currentTheme.colors.error
                                : currentTheme.colors.text,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {t(action.label, action.label)}
                      </UIText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </>
  );
};
