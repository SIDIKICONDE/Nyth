import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { SocialLinks } from '../../types/user';

export type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;
export type EditProfileScreenRouteProp = RouteProp<RootStackParamList, 'EditProfile'>;

export interface SocialField {
  name: keyof SocialLinks;
  icon: 'twitter' | 'linkedin' | 'github' | 'youtube' | 'instagram';
  placeholder: string;
  baseUrl: string;
  prefix?: string;
} 