import React from 'react';
import { SafeAreaView } from 'react-native';
import { AppleSignInTest } from '../../components/debug/AppleSignInTest';
import tw from 'twrnc';

export const AppleSignInTestScreen: React.FC = () => {
  return (
    <SafeAreaView style={tw`flex-1 bg-gray-100`}>
      <AppleSignInTest />
    </SafeAreaView>
  );
};
