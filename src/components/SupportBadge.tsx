import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSupportBadge } from '../hooks/useSupport';

interface SupportBadgeProps {
  style?: any;
  size?: 'small' | 'medium' | 'large';
}

const SupportBadge: React.FC<SupportBadgeProps> = ({ style, size = 'small' }) => {
  const { hasUnread, loading } = useSupportBadge();

  if (loading || !hasUnread) {
    return null;
  }

  const badgeSize = {
    small: 8,
    medium: 10,
    large: 12,
  };

  return (
    <View style={[styles.badge, { 
      width: badgeSize[size], 
      height: badgeSize[size] 
    }, style]} />
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 50,
    position: 'absolute',
    top: -2,
    right: -2,
  },
});

export default SupportBadge;