import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../contexts/AuthContext";
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
import HelpScreen from "../screens/HelpScreen";
import HomeScreen from "../screens/HomeScreen";
import LibraryScreen from "../screens/LibraryScreen";
import WelcomeScreen from "../screens/WelcomeScreen";

// import OnboardingScreen from "../screens/OnboardingScreen"; // Onboarding supprimé
import { PlanningScreen } from "../screens/PlanningScreen";

import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import ProfileScreen from "../screens/ProfileScreen";

import CartesaniDemoScreen from "../screens/CartesaniDemoScreen";
import { TaskDetailScreen } from "../screens/TaskDetailScreen";

import SettingsScreen from "../screens/SettingsScreen";
import ThemeScreen from "../screens/ThemeScreen";
import RecordingScreen from "../screens/RecordingScreen/RecordingScreen";

import PricingScreen from "../screens/subscription/PricingScreen";
import SubscriptionManagementScreen from "../screens/subscription/SubscriptionManagementScreen";

// Auth Screens
import { LoginScreen, RegisterScreen } from "../screens/auth";
import LoadingScreen from "../screens/LoadingScreen";

const Stack = createStackNavigator<RootStackParamList>();

const AuthNavigator = () => (
  <Stack.Navigator id={undefined} screenOptions={getDefaultNavigatorOptions()}>
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={getScreenTransitionOptions()}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={getScreenTransitionOptions()}
    />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const { navigationState } = useAppNavigator();
  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName={navigationState.initialRoute}
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

      {/* ForgotPasswordScreen sera ajouté plus tard */}
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
        name="SubscriptionManagement"
        component={SubscriptionManagementScreen}
        options={getScreenTransitionOptions()}
      />
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={getScreenTransitionOptions()}
      />
      {/* L'écran de vérification email sera recréé plus tard si nécessaire */}
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
  );
};

export default function AppNavigator() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return currentUser ? <MainNavigator /> : <AuthNavigator />;
}
