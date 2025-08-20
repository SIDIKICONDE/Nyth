import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { H4, UIText } from "../../../components/ui/Typography";
import { useScripts } from "../../../contexts/ScriptsContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { useContrastOptimization } from "../../../hooks/useContrastOptimization";
import { RootStackParamList } from "../../../types";
import { UserProfile } from "../../../types/user";

interface ProfileSectionsProps {
  profile: UserProfile;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProfileSections({ profile }: ProfileSectionsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const navigation = useNavigation<NavigationProp>();
  const { getFavoriteScripts } = useScripts();

  const favoriteScripts = getFavoriteScripts();
  const favoritesCount = favoriteScripts.length;

  const sections = [
    {
      id: "personal",
      title: t("profile.sections.personal"),
      icon: "account-details",
      onPress: () =>
        navigation.navigate("EditProfile", { section: "personal" }),
      hasData: !!(
        profile.firstName ||
        profile.lastName ||
        profile.phoneNumber ||
        profile.dateOfBirth
      ),
      color: currentTheme.isDark ? "#8b5cf6" : currentTheme.colors.primary,
    },
    {
      id: "professional",
      title: t("profile.sections.professional"),
      icon: "briefcase",
      onPress: () =>
        navigation.navigate("EditProfile", { section: "professional" }),
      hasData: !!(profile.profession || profile.company || profile.website),
      color: currentTheme.isDark ? "#8b5cf6" : currentTheme.colors.primary,
    },
    {
      id: "social",
      title: t("profile.sections.social"),
      icon: "share-variant",
      onPress: () => navigation.navigate("EditProfile", { section: "social" }),
      hasData: !!(
        profile.socials && Object.values(profile.socials).some((link) => link)
      ),
      color: currentTheme.isDark ? "#8b5cf6" : currentTheme.colors.primary,
    },
    {
      id: "ai-memory",
      title: t("aiMemory.title"),
      icon: "brain",
      onPress: () => navigation.navigate("AIMemory"),
      hasData: true, // Toujours disponible
      color: "#8B5CF6", // Violet pour l'IA
      subtitle: t("aiMemory.settings.sectionDescription"),
    },
    // TODO: Ajouter ces sections plus tard
    // {
    //   id: 'preferences',
    //   title: t('profile.sections.preferences'),
    //   icon: 'tune',
    //   onPress: () => navigation.navigate('ProfileSettings'),
    //   hasData: true,
    // },
    // {
    //   id: 'privacy',
    //   title: t('profile.sections.privacy'),
    //   icon: 'shield-lock',
    //   onPress: () => navigation.navigate('ProfilePrivacy'),
    //   hasData: true,
    // },
  ];

  return (
    <View style={tw`px-4 pb-8`}>
      <View style={tw`flex-row items-center mb-4`}>
        <H4 style={{ color: currentTheme.colors.text }}>
          {t("profile.sections.title")}
        </H4>
        <View
          style={[
            tw`flex-1 h-0.5 ml-4`,
            { backgroundColor: currentTheme.colors.border },
          ]}
        />
      </View>

      <View
        style={[
          tw`rounded-xl overflow-hidden`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        {sections.map((section, index) => (
          <TouchableOpacity
            key={section.id}
            onPress={section.onPress}
            style={[
              tw`flex-row items-center p-4`,
              index < sections.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: currentTheme.colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                {
                  backgroundColor:
                    (section.color || currentTheme.colors.primary) + "20",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={section.icon as any}
                size={20}
                color={section.color || currentTheme.colors.primary}
              />
            </View>

            <View style={tw`flex-1`}>
              <UIText
                size="base"
                weight="medium"
                color={currentTheme.colors.text}
                style={section.id === "ai-memory" ? tw`text-center` : {}}
              >
                {section.title}
              </UIText>
              {section.subtitle ? (
                <UIText
                  size="xs"
                  color={currentTheme.colors.textSecondary}
                  style={[
                    tw`mt-0.5`,
                    section.id === "ai-memory" ? tw`text-center` : {},
                  ]}
                >
                  {section.subtitle}
                </UIText>
              ) : !section.hasData ? (
                <UIText
                  size="xs"
                  color={currentTheme.colors.textSecondary}
                  style={tw`mt-0.5`}
                >
                  {t("profile.sections.notCompleted")}
                </UIText>
              ) : null}
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={currentTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
