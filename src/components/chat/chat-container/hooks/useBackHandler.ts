import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList, 'AIChat'>;

export const useBackHandler = () => {
  const navigation = useNavigation<NavigationProp>();
  
  useEffect(() => {
    const handleBackPress = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    };
    
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );
    
    return () => {
      backHandler.remove();
    };
  }, [navigation]);
}; 