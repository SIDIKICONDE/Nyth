import React from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import Animated, { FadeIn } from 'react-native-reanimated';

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('AIGeneratorScreen');

// Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';

// Components
import { CustomHeader } from '../../components/common';
import { AIStatusIndicator } from '../../components/ai/AIStatusIndicator';
import { TopicInputSection } from '../../components/ai/TopicInputSection';
import { GenerationParameters } from '../../components/ai/GenerationParameters';
import { ActionButtons } from '../../components/ai/ActionButtons';

// Local components and hooks
import { SettingsButton } from './components';
import { useAIGeneratorScreen } from './hooks';

export const AIGeneratorScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  
  const {
    statusIndicatorRef,
    topic,
    setTopic,
    selectedPlatform,
    setSelectedPlatform,
    tone,
    setTone,
    duration,
    setDuration,
    creativity,
    setCreativity,
    maxCharacters,
    setMaxCharacters,
    isLoading,
    handleNavigateToSettings,
    onGenerate
  } = useAIGeneratorScreen();

  return (
    <View style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}>
      <CustomHeader 
        title={t('aiGenerator.title')}
        showBackButton={true}
        onBackPress={() => {
          logger.debug(t('aiGenerator.navigation.toHome'));
          navigation.navigate('Home' as never);
        }}
        rightComponent={
          <SettingsButton 
            currentTheme={currentTheme}
            onNavigateToSettings={handleNavigateToSettings}
          />
        }
      />
      
      <ScrollView 
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 py-3 pb-8`}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeIn.duration(300).delay(50)}
          style={tw`mb-3`}
        >
          <AIStatusIndicator ref={statusIndicatorRef} />
        </Animated.View>
        
        <Animated.View 
          entering={FadeIn.duration(300).delay(100)}
          style={tw`mb-4`}
        >
          <TopicInputSection 
            topic={topic}
            onTopicChange={setTopic}
          />
        </Animated.View>
        
        <Animated.View 
          entering={FadeIn.duration(300).delay(150)}
        >
          <GenerationParameters 
            tone={tone}
            onToneChange={setTone}
            platform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
            duration={duration}
            onDurationChange={setDuration}
            creativity={creativity}
            onCreativityChange={setCreativity}
            maxCharacters={maxCharacters}
            onMaxCharactersChange={setMaxCharacters}
          />
        </Animated.View>
        
        <Animated.View entering={FadeIn.duration(300).delay(200)}>
          <ActionButtons 
            topic={topic}
            selectedPlatform={selectedPlatform}
            onGenerate={onGenerate}
            isLoading={isLoading}
            onNavigateToSettings={handleNavigateToSettings}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default AIGeneratorScreen; 