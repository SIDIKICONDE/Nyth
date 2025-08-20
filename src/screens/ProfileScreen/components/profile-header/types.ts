import { UserProfile } from '../../../../types/user';

export interface SocialLinks {
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
  instagram?: string;
}

export interface ProfileHeaderProps {
  profile: UserProfile;
  onEditPress: () => void;
  onBackPress?: () => void;
  currentDesign?: 'classic' | 'glassmorphism' | 'neomorphism';
}

export interface ProfileAvatarProps {
  profile: UserProfile;
  displayName: string;
  onImagePicker: () => void;
  currentTheme: any;
}

export interface GradientHeaderProps {
  currentTheme: any;
  onBackPress?: () => void;
  children: React.ReactNode;
}

export interface ProfileInfoProps {
  profile: UserProfile;
  displayName: string;
  currentTheme: any;
  t: any; // Type simplifié pour éviter les conflits avec i18next
} 