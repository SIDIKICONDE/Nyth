import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types';

export type NavigationProp = StackNavigationProp<RootStackParamList>;

export interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface UserProfileSectionProps {
  onClose: () => void;
  navigation: NavigationProp;
}

export interface GuestSectionProps {
  onClose: () => void;
  navigation: NavigationProp;
}

export interface ModalHeaderProps {
  // Props si nécessaire dans le futur
} 