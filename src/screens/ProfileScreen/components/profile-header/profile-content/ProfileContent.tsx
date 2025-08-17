import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import { ProfileInfoProps } from './types';
import ProfileSocials from '../ProfileSocials';
import {
  ProfileBasicInfo,
  ProfileBio,
  ProfileProfessionalInfo,
  ProfileHint,
} from './components';

export const ProfileContent: React.FC<ProfileInfoProps> = ({ 
  profile, 
  displayName, 
  currentTheme, 
  t 
}) => {
  return (
    <View style={[
      tw`pt-3 pb-2`,
      { backgroundColor: currentTheme.colors.background }
    ]}>
      <ProfileBasicInfo 
        displayName={displayName} 
        email={profile.email}
        currentTheme={currentTheme} 
      />
      
      <ProfileBio 
        bio={profile.bio} 
        currentTheme={currentTheme} 
      />
      
      <ProfileProfessionalInfo 
        profession={profile.profession}
        company={profile.company}
        currentTheme={currentTheme} 
      />
      
      <ProfileSocials 
        socials={profile.socials} 
        currentTheme={currentTheme} 
      />
      
      <ProfileHint 
        hasPhoto={!!profile.photoURL} 
        currentTheme={currentTheme} 
        t={t} 
      />
    </View>
  );
}; 