import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { SocialLinks } from './types';

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ProfileSocials');

interface ProfileSocialsProps {
  socials?: SocialLinks;
  currentTheme: any;
}

const SOCIAL_ICONS: { [key in keyof SocialLinks]: any } = {
  website: 'web',
  twitter: 'twitter',
  linkedin: 'linkedin',
  github: 'github',
  youtube: 'youtube',
  instagram: 'instagram',
};

const ProfileSocials: React.FC<ProfileSocialsProps> = ({ socials, currentTheme }) => {
  if (!socials || Object.values(socials).every(link => !link)) {
    return null;
  }

  const handlePress = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(err => logger.error("Couldn't load page", err));
    }
  };

  return (
    <View style={tw`flex-row justify-center items-center my-4`}>
      {Object.entries(socials).map(([key, link]) => {
        if (!link) return null;
        const iconName = SOCIAL_ICONS[key as keyof SocialLinks];
        if (!iconName) return null;
        
        return (
          <TouchableOpacity 
            key={key}
            onPress={() => handlePress(link as string)}
            style={[
              tw`mx-2 w-12 h-12 rounded-full items-center justify-center`,
              { 
                backgroundColor: currentTheme.colors.surface,
                borderWidth: 1,
                borderColor: currentTheme.colors.border,
              }
            ]}
          >
            <MaterialCommunityIcons 
              name={iconName as any}
              size={24} 
              color={currentTheme.colors.textSecondary} 
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default ProfileSocials; 