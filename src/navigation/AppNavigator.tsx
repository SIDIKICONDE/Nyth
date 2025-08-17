import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { View } from "react-native";
import { AnalyticsMigrationManager } from "../components/common/AnalyticsMigrationManager";
import { RootStackParamList } from "../types/index";
import { useAppNavigator } from "./hooks/useAppNavigator";
import {
  getAIScreenTransitionOptions,
  getDefaultNavigatorOptions,
  getScreenTransitionOptions,
} from "./transitions";

// Screens
import AIChatScreen from "../screens/AIChatScreen";
import AIGeneratorScreen from "../screens/AIGeneratorScreen";
import AIMemoryScreen from "../screens/AIMemoryScreen";
import AISettingsScreen from "../screens/AISettingsScreen";
import { AdminScreenV2 } from "../screens/AdminScreen/AdminScreenV2";
import EditProfileScreen from "../screens/EditProfileScreen";
import EditorScreen from "../screens/EditorScreen";
import FontSettingsScreen from "../screens/FontSettingsScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import HelpScreen from "../screens/HelpScreen";
import HomeScreen from "../screens/HomeScreen";
import LibraryScreen from "../screens/LibraryScreen";
import LoginScreen from "../screens/LoginScreen";
import WelcomeScreen from "../screens/WelcomeScreen";

// import OnboardingScreen from "../screens/OnboardingScreen"; // Onboarding supprimé
import { PlanningScreen } from "../screens/PlanningScreen";
import PreviewScreen from "../screens/PreviewScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import ProfileScreen from "../screens/ProfileScreen";

import CartesaniDemoScreen from "../screens/CartesaniDemoScreen";
import { TaskDetailScreen } from "../screens/TaskDetailScreen";

import RegisterScreen from "../screens/RegisterScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ThemeScreen from "../screens/ThemeScreen";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";
import RecordingScreen from "../screens/RecordingScreen/RecordingScreen";

import PricingScreen from "../screens/subscription/PricingScreen";

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  // Utiliser le hook principal qui orchestre toute la logique
  const {
    navigationState,
    handlePermissionsComplete,
    setIsInitialLoading,
    setHasCompletedOnboarding,
  } = useAppNavigator();

  // Onboarding supprimé - l'app va directement à l'écran principal

  // App principale après onboarding (les permissions sont gérées dans chaque écran)
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <AnalyticsMigrationManager>
          <Stack.Navigator
            initialRouteName={
              navigationState.initialRoute as keyof RootStackParamList
            }
            screenOptions={getDefaultNavigatorOptions()}
          >
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="Editor"
              component={EditorScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={getAIScreenTransitionOptions()}
            />
            {/* <Stack.Screen
          name="Recording"
          component={RecordingScreen} */}
            <Stack.Screen
              name="Recording"
              component={RecordingScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Preview"
              component={PreviewScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Theme"
              component={ThemeScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="AIGenerator"
              component={AIGeneratorScreen}
              options={getAIScreenTransitionOptions()}
            />
            <Stack.Screen
              name="AISettings"
              component={AISettingsScreen}
              options={getAIScreenTransitionOptions()}
            />
            <Stack.Screen
              name="AIChat"
              component={AIChatScreen}
              options={getAIScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="RegisterScreen"
              component={RegisterScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="ProfileScreen"
              component={ProfileScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Admin"
              component={AdminScreenV2}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Help"
              component={HelpScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="FontSettings"
              component={FontSettingsScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Pricing"
              component={PricingScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Library"
              component={LibraryScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="PrivacyPolicyScreen"
              component={PrivacyPolicyScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="AIMemory"
              component={AIMemoryScreen}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="MemorySources"
              component={require("../screens/MemorySourcesScreen").default}
              options={getScreenTransitionOptions()}
            />
            <Stack.Screen
              name="Planning"
              component={PlanningScreen}
              options={getAIScreenTransitionOptions()}
            />

            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={getScreenTransitionOptions()}
            />

            <Stack.Screen
              name="CartesaniDemo"
              component={CartesaniDemoScreen}
              options={getScreenTransitionOptions()}
            />
          </Stack.Navigator>
        </AnalyticsMigrationManager>
      </NavigationContainer>
    </View>
  );
}
