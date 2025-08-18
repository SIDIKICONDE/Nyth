declare module "@env" {
  export const SERVER_URL: string;
  export const CLIENT_API_KEY: string;
  export const BYPASS_PROXY: string; // "true"/"false"
  // Clés côté application mobile (React Native)
  export const GOOGLE_WEB_CLIENT_ID: string;
  export const GOOGLE_IOS_CLIENT_ID: string;
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';
  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }
  export default class Icon extends Component<IconProps> {}
}
