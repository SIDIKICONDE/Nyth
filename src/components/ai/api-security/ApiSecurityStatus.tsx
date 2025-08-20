import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useApiSecurity } from './hooks/useApiSecurity';
import { 
  SecurityHeader, 
  ApiKeyCard, 
  EmptyState, 
  SecurityActions, 
  LoadingState 
} from './components';

export const ApiSecurityStatus: React.FC = () => {
  const { currentTheme } = useTheme();
  const {
    apiKeys,

    isLoading,
    expandedKey,
    setExpandedKey,
    handleDeleteKey,
    handleMigrateKeys,
  } = useApiSecurity();
  const [_encryptionEnabled, setEncryptionEnabled] = React.useState<boolean>(false);

  React.useEffect(() => {
    (async () => {
      try {
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        const enabled = (await AsyncStorage.getItem('secure_api_keys_enabled')) === 'true';
        setEncryptionEnabled(enabled);
      } catch {}
    })();
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  const defaultGradient: [string, string] = [
    currentTheme.colors.primary, 
    currentTheme.colors.accent
  ];

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
    >
      <SecurityHeader 
        apiKeysCount={apiKeys.length} 
      />

      {/* Liste des clés avec animations */}
      {apiKeys.length > 0 ? (
        <View>
          {apiKeys.map((key, index) => (
            <Animated.View
              key={key.provider}
              entering={FadeInDown.delay(index * 100).springify()}
              layout={Layout.springify()}
              style={tw`mb-3`}
            >
              <ApiKeyCard
                apiKey={key}
                isExpanded={expandedKey === key.provider}
                onToggleExpand={() => setExpandedKey(
                  expandedKey === key.provider ? null : key.provider
                )}
                onDelete={handleDeleteKey}
                defaultGradient={defaultGradient}
              />
            </Animated.View>
          ))}
        </View>
      ) : (
        <EmptyState />
      )}

      <SecurityActions onMigrateKeys={handleMigrateKeys} />
    </Animated.View>
  );
}; 