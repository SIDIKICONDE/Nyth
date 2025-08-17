import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";
import { CustomHeader } from "../../components/common";
import {
  PersonalSection,
  ProfessionalSection,
  SocialSection,
  CustomAlert,
} from "./components";
import { useEditProfile } from "./hooks/useEditProfile";
import { EditProfileScreenRouteProp } from "./types";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditProfileScreenRouteProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();

  const {
    formData,
    socialUsernames,
    isLoading,
    isProfileLoading,
    alertState,
    handleUpdateFormData,
    handleUpdateSocialUsername,
    handleSave,
    handleCloseAlert,
  } = useEditProfile();

  const section = route.params?.section || "personal";

  if (isProfileLoading) {
    return (
      <View
        style={[
          tw`flex-1 justify-center items-center`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  const renderSection = () => {
    switch (section) {
      case "personal":
        return (
          <PersonalSection
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
          />
        );
      case "professional":
        return (
          <ProfessionalSection
            formData={formData}
            onUpdateFormData={handleUpdateFormData}
          />
        );
      case "social":
        return (
          <SocialSection
            socialUsernames={socialUsernames}
            onUpdateSocialUsername={handleUpdateSocialUsername}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <CustomHeader
        title={t("profile.editProfile.title")}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        actionButtons={[
          {
            icon: "check",
            onPress: handleSave,
            iconComponent: isLoading ? (
              <ActivityIndicator
                size="small"
                color={getOptimizedButtonColors().background}
              />
            ) : (
              <MaterialCommunityIcons
                name="check"
                size={24}
                color={getOptimizedButtonColors().background}
              />
            ),
          },
        ]}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={[
          tw`px-4 py-6`,
          { backgroundColor: currentTheme.colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderSection()}
      </ScrollView>

      {/* Alerte personnalisée */}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={handleCloseAlert}
        autoClose={alertState.type === "success"}
        autoCloseDelay={2000}
      />
    </KeyboardAvoidingView>
  );
}
