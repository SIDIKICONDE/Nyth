import React from 'react';
import { ProfileHeaderProps, ProfileHeaderWrapper } from './profile-header';

export default function ProfileHeader({ profile, onEditPress, onBackPress, currentDesign }: ProfileHeaderProps) {
  return (
    <ProfileHeaderWrapper
      profile={profile}
      onEditPress={onEditPress}
      onBackPress={onBackPress}
      currentDesign={currentDesign}
    />
  );
} 