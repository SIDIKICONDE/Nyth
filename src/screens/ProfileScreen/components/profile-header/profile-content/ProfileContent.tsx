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
import { responsiveSpacing } from '../../../../../utils/responsive';

export const ProfileContent: React.FC<ProfileInfoProps> = ({ 
  profile, 
  displayName, 
  currentTheme, 
  t 
}) => {
  const paddingTop = responsiveSpacing(12);
  const paddingBottom = responsiveSpacing(8);
  
  return (
    <View style={[
      { 
        paddingTop,
        paddingBottom,
        backgroundColor: currentTheme.colors.background 
      }
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