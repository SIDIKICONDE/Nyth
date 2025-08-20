import { UserProfile } from '../../../../../types/user';

export interface ProfileInfoProps {
  profile: UserProfile;
  displayName: string;
  currentTheme: any;
  t: (key: string, defaultValue: string) => string;
} 