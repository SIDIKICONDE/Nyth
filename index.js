/**
 * @format
 */

import { AppRegistry } from 'react-native';
import "react-native-gesture-handler";
import "react-native-get-random-values";

import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

// Handler des messages reçus en arrière-plan (obligatoire pour FCM)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message reçu en arrière-plan:', remoteMessage?.messageId);
});

AppRegistry.registerComponent(appName, () => App);
