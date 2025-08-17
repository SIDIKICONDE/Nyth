// Type declarations for modules without type definitions

// Global variables
declare const __DEV__: boolean;

declare module "react-native-modal" {
  import { ReactNode } from "react";
  import { ViewStyle } from "react-native";

  export interface ModalProps {
    isVisible: boolean;
    children: ReactNode;
    style?: ViewStyle;
    animationIn?: string;
    animationOut?: string;
    backdropOpacity?: number;
    onBackdropPress?: () => void;
    useNativeDriver?: boolean;
    backdropTransitionOutTiming?: number;
    deviceHeight?: number;
    deviceWidth?: number;
    [key: string]: any;
  }

  export default class Modal extends React.Component<ModalProps> {}
}
