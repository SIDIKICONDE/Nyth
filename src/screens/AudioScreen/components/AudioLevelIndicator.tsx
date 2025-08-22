import React from 'react';
import { View, Text, Animated } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '@/contexts/ThemeContext';

interface AudioLevelIndicatorProps {
  currentLevel: number; // 0.0 à 1.0
  peakLevel: number; // 0.0 à 1.0
  isRecording: boolean;
  isPaused?: boolean;
}

export default function AudioLevelIndicator({
  currentLevel,
  peakLevel,
  isRecording,
  isPaused = false,
}: AudioLevelIndicatorProps) {
  const { currentTheme } = useTheme();
  const animatedLevel = React.useRef(new Animated.Value(0)).current;
  
  // Animation du niveau actuel
  React.useEffect(() => {
    Animated.timing(animatedLevel, {
      toValue: currentLevel,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [currentLevel]);
  
  // Convertir le niveau en dB pour l'affichage
  const levelInDb = currentLevel > 0 
    ? Math.round(20 * Math.log10(currentLevel))
    : -60;
  
  const peakInDb = peakLevel > 0
    ? Math.round(20 * Math.log10(peakLevel))
    : -60;
  
  // Couleur selon le niveau
  const getLevelColor = (level: number) => {
    if (level > 0.9) return 'red-500'; // Clipping
    if (level > 0.7) return 'yellow-500'; // Attention
    if (level > 0.3) return 'green-500'; // Bon niveau
    return 'gray-400'; // Faible
  };
  
  const levelColor = getLevelColor(currentLevel);
  const peakColor = getLevelColor(peakLevel);
  
  if (!isRecording) return null;
  
  return (
    <View
      style={tw`p-4 mx-4 mb-4 rounded-lg ${
        currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}
    >
      {/* Titre et état */}
      <View style={tw`flex-row justify-between items-center mb-3`}>
        <Text
          style={tw`text-sm font-medium ${
            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          Niveau audio
        </Text>
        {isPaused && (
          <Text style={tw`text-xs text-yellow-500 font-medium`}>
            En pause
          </Text>
        )}
      </View>
      
      {/* Barre de niveau actuel */}
      <View style={tw`mb-3`}>
        <View
          style={tw`h-6 rounded-full overflow-hidden ${
            currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <Animated.View
            style={[
              tw`h-full rounded-full bg-${levelColor}`,
              {
                width: animatedLevel.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text
          style={tw`text-xs mt-1 ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Actuel: {levelInDb} dB
        </Text>
      </View>
      
      {/* Indicateur de crête */}
      <View style={tw`flex-row items-center`}>
        <View style={tw`flex-1`}>
          <View
            style={tw`h-2 rounded-full overflow-hidden ${
              currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <View
              style={[
                tw`h-full rounded-full bg-${peakColor}`,
                { width: `${peakLevel * 100}%` },
              ]}
            />
          </View>
        </View>
        <Text
          style={tw`text-xs ml-3 ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Crête: {peakInDb} dB
        </Text>
      </View>
      
      {/* Indicateurs d'état */}
      <View style={tw`flex-row justify-between mt-3 pt-3 border-t border-gray-200`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={tw`w-2 h-2 rounded-full mr-2 ${
              currentLevel > 0.05 ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <Text
            style={tw`text-xs ${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Signal détecté
          </Text>
        </View>
        
        {peakLevel > 0.9 && (
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-2 h-2 rounded-full mr-2 bg-red-500`} />
            <Text style={tw`text-xs text-red-500`}>
              Clipping!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}