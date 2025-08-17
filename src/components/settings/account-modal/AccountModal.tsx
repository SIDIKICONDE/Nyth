import React from 'react';
import { Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { ModalContent } from './ModalContent';
import { ModalHeader } from './ModalHeader';
import { UserProfileSection } from './UserProfileSection';
import { GuestSection } from './GuestSection';
import { AccountModalProps, NavigationProp } from './types';

export const AccountModal: React.FC<AccountModalProps> = ({ 
  visible, 
  onClose 
}) => {
  const { currentUser } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ModalContent onClose={onClose}>
        <ModalHeader />
        
        {currentUser ? (
          <UserProfileSection 
            onClose={onClose} 
            navigation={navigation} 
          />
        ) : (
          <GuestSection 
            onClose={onClose} 
            navigation={navigation} 
          />
        )}
      </ModalContent>
    </Modal>
  );
}; 