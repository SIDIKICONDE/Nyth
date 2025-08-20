import React from 'react';
import { IconButton, IconButtonProps } from 'react-native-paper';
import { getIconName } from '../../utils/iconHelper';

interface SafeIconButtonProps extends Omit<IconButtonProps, 'icon'> {
  icon: string;
}

/**
 * Wrapper pour IconButton qui gère automatiquement les noms d'icônes
 * pour assurer la compatibilité entre plateformes
 */
export const SafeIconButton: React.FC<SafeIconButtonProps> = ({ icon, ...props }) => {
  const safeIconName = getIconName(icon);
  
  return <IconButton {...props} icon={safeIconName} />;
};

export default SafeIconButton; 