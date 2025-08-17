import * as React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from 'twrnc';

import { SizeInfo } from '../types';

interface CacheProgressBarProps {
  usagePercentage: number;
  sizeInfo: SizeInfo;
  currentTheme: any;
}

const CacheProgressBar: React.FC<CacheProgressBarProps> = ({
  usagePercentage,
  sizeInfo,
  currentTheme,
}) => {
  return (
    <View style={tw`mb-3`}>
      <View style={[
        tw`h-2 rounded-full overflow-hidden`,
        { backgroundColor: `${currentTheme.colors.surface}30` }
      ]}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={[
            tw`h-full rounded-full`,
            { 
              width: `${usagePercentage}%`,
              backgroundColor: sizeInfo.color
            }
          ]}
        />
      </View>
      <Text style={[tw`text-xs mt-1 text-right`, { color: sizeInfo.color }]}>
        {sizeInfo.text} / 100 MB
      </Text>
    </View>
  );
};

export default CacheProgressBar; 