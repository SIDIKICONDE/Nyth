/**
 * Configuration Firebase pour les tests
 */

import { getApp } from '@react-native-firebase/app';

export const functions = {
  httpsCallable: jest.fn(),
};

export const getFirebaseApp = () => getApp();