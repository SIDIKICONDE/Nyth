import React from 'react';
import { View, Dimensions } from 'react-native';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from 'twrnc';
import { UIText } from '@/components/ui/Typography';
import { VideoPlayerSectionProps } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

export function VideoPlayerSection({
  recording: _recording,
  previewVideoUri,
  isGeneratingPreview,
  videoSize,
}: VideoPlayerSectionProps) {
  const [validatedUri, setValidatedUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const validate = async () => {
      const uri = previewVideoUri || '';
      if (!uri) {
        if (mounted) setValidatedUri(null);
        return;
      }
      const localPath = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      try {
        const exists = await RNFS.exists(localPath);
        if (mounted) setValidatedUri(exists ? uri : null);
      } catch {
        if (mounted) setValidatedUri(null);
      }
    };
    validate();
    return () => {
      mounted = false;
    };
  }, [previewVideoUri]);

  if (isGeneratingPreview) {
    return (
      <View style={tw`items-center justify-center py-8`}>
        <Animated.View entering={FadeIn.duration(500)}>
          <UIText size="lg" weight="medium" style={tw`text-gray-600 dark:text-gray-300`}>
            Génération de l'aperçu...
          </UIText>
        </Animated.View>
      </View>
    );
  }

  if (!validatedUri) {
    return (
      <View style={tw`items-center justify-center py-8`}>
        <Animated.View entering={FadeIn.duration(500)}>
          <UIText size="lg" weight="medium" style={tw`text-gray-600 dark:text-gray-300`}>
            Aucun aperçu disponible
          </UIText>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(500)} style={tw`items-center`}>
      <View style={tw`rounded-2xl overflow-hidden bg-black`}>
        <Video
          source={{ uri: validatedUri }}
          style={{
            width: SCREEN_WIDTH - 32,
            height: VIDEO_HEIGHT,
          }}
          controls={true}
          resizeMode="contain"
          repeat={false}
          paused={false}
        />
      </View>
      
      {videoSize && (
        <View style={tw`mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full`}>
          <UIText size="sm" style={tw`text-gray-600 dark:text-gray-300`}>
            Taille: {videoSize}
          </UIText>
        </View>
      )}
    </Animated.View>
  );
}
