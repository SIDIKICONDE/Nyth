import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export const useCacheAnimation = () => {
  const rotation = useSharedValue(0);

  const animatedRefreshStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const handleRefresh = async (refreshCacheStats: () => Promise<void>) => {
    rotation.value = withSpring(rotation.value + 360);
    await refreshCacheStats();
  };

  return {
    animatedRefreshStyle,
    handleRefresh,
  };
}; 