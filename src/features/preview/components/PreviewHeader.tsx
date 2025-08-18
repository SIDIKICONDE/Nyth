import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CustomHeader } from '@/components/common';
import { useTranslation } from '@/hooks/useTranslation';
import { PreviewHeaderProps } from '../types';

export function PreviewHeader({ recording, onBackPress, onHomePress }: PreviewHeaderProps) {
  const { t } = useTranslation();

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <CustomHeader
        title={t('preview.title', 'Aperçu Vidéo')}
        subtitle={recording.createdAt ? formatDate(recording.createdAt) : ''}
        showBackButton={true}
        onBackPress={onBackPress}
        actionButtons={[
          {
            icon: '🏠',
            onPress: onHomePress,
          },
        ]}
      />
    </Animated.View>
  );
}
