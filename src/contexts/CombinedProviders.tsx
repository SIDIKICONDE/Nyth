import React, { ReactNode, useMemo } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Import des providers
import { AuthProvider } from "./AuthContext";
import { GlobalPreferencesProvider } from "./GlobalPreferencesContext";
import { FontProvider } from "./FontContext";
import { DisplayPreferencesProvider } from "./DisplayPreferencesContext";
import { LayoutPreferencesProvider } from "./LayoutPreferencesContext";
import { InputStyleProvider } from "./InputStyleContext";
import { ChatStyleProvider } from "./ChatStyleContext";
import { MessageLayoutProvider } from "./MessageLayoutContext";
import { SettingsProvider } from "./SettingsContext";
import { ThemeProvider } from "./ThemeContext";
import { UserProfileProvider } from "./UserProfileContext";
import { SubscriptionProvider } from "./SubscriptionContext";
import { ScriptsProvider } from "./ScriptsContext";
import { ChatProvider } from "./ChatContext";
import { AchievementProvider } from "./AchievementContext";

interface CombinedProvidersProps {
  children: ReactNode;
}

// Provider optimisé pour les préférences UI
const UIPreferencesProvider = React.memo(({ children }: { children: ReactNode }) => {
  return (
    <FontProvider>
      <DisplayPreferencesProvider>
        <LayoutPreferencesProvider>
          <InputStyleProvider>
            <ChatStyleProvider>
              <MessageLayoutProvider>
                {children}
              </MessageLayoutProvider>
            </ChatStyleProvider>
          </InputStyleProvider>
        </LayoutPreferencesProvider>
      </DisplayPreferencesProvider>
    </FontProvider>
  );
});

UIPreferencesProvider.displayName = "UIPreferencesProvider";

// Provider optimisé pour les données utilisateur
const UserDataProvider = React.memo(({ children }: { children: ReactNode }) => {
  return (
    <UserProfileProvider>
      <SubscriptionProvider>
        <AchievementProvider>
          {children}
        </AchievementProvider>
      </SubscriptionProvider>
    </UserProfileProvider>
  );
});

UserDataProvider.displayName = "UserDataProvider";

// Provider optimisé pour les fonctionnalités de l'app
const AppFeaturesProvider = React.memo(({ children }: { children: ReactNode }) => {
  return (
    <ScriptsProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </ScriptsProvider>
  );
});

AppFeaturesProvider.displayName = "AppFeaturesProvider";

// Provider principal combiné avec mémoisation
export const CombinedProviders = React.memo(({ children }: CombinedProvidersProps) => {
  // Mémoisation du contenu pour éviter les re-renders inutiles
  const content = useMemo(() => children, [children]);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <GlobalPreferencesProvider>
            <SettingsProvider>
              <ThemeProvider>
                <UIPreferencesProvider>
                  <UserDataProvider>
                    <AppFeaturesProvider>
                      {content}
                    </AppFeaturesProvider>
                  </UserDataProvider>
                </UIPreferencesProvider>
              </ThemeProvider>
            </SettingsProvider>
          </GlobalPreferencesProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
});

CombinedProviders.displayName = "CombinedProviders";