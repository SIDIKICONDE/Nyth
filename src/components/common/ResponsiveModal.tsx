import React, { ReactNode } from 'react';
import {
  Modal,
  ModalProps,
  View,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { ResponsiveView } from './ResponsiveView';
import { ResponsiveText } from './ResponsiveText';
import { ResponsiveButton } from './ResponsiveButton';
import { dimensions } from '../../utils/responsive';
import { useTheme } from '../../contexts/ThemeContext';

interface ResponsiveModalProps extends Omit<ModalProps, 'children'> {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  fullScreen?: boolean;
  scrollable?: boolean;
  footer?: ReactNode;
  maxWidth?: number;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  title,
  children,
  onClose,
  showCloseButton = true,
  fullScreen = false,
  scrollable = true,
  footer,
  maxWidth,
  visible,
  ...modalProps
}) => {
  const insets = useSafeAreaInsets();
  const { moderateScale, wp, hp, isTablet } = useResponsive();
  const { currentTheme } = useTheme();

  const getModalWidth = () => {
    if (fullScreen) return '100%';
    if (maxWidth) return Math.min(maxWidth, wp(90));
    return isTablet ? wp(70) : wp(90);
  };

  const getModalMaxHeight = () => {
    const topPadding = insets.top + moderateScale(20);
    const bottomPadding = insets.bottom + moderateScale(20);
    return hp(100) - topPadding - bottomPadding;
  };

  const renderContent = () => {
    const content = (
      <>
        {title && (
          <View
            style={{
              paddingHorizontal: dimensions.padding.large,
              paddingTop: dimensions.padding.large,
              paddingBottom: dimensions.padding.medium,
              borderBottomWidth: 1,
              borderBottomColor: currentTheme.colors.border,
            }}
          >
            <ResponsiveText variant="h3" weight="medium">
              {title}
            </ResponsiveText>
          </View>
        )}

        <View
          style={{
            flex: 1,
            paddingHorizontal: dimensions.padding.large,
            paddingVertical: dimensions.padding.medium,
          }}
        >
          {children}
        </View>

        {footer && (
          <View
            style={{
              paddingHorizontal: dimensions.padding.large,
              paddingTop: dimensions.padding.medium,
              paddingBottom: dimensions.padding.large,
              borderTopWidth: 1,
              borderTopColor: currentTheme.colors.border,
            }}
          >
            {footer}
          </View>
        )}
      </>
    );

    if (scrollable) {
      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      );
    }

    return content;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      {...modalProps}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: fullScreen ? 0 : dimensions.padding.large,
          }}
        >
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{
                width: getModalWidth(),
                maxHeight: getModalMaxHeight(),
                ...(fullScreen && { flex: 1 }),
              }}
            >
              <View
                style={{
                  backgroundColor: currentTheme.colors.background,
                  borderRadius: fullScreen ? 0 : dimensions.borderRadius.large,
                  overflow: 'hidden',
                  ...(fullScreen && { flex: 1 }),
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: moderateScale(2),
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: moderateScale(3.84),
                  elevation: 5,
                }}
              >
                {showCloseButton && onClose && (
                  <TouchableWithoutFeedback onPress={onClose}>
                    <View
                      style={{
                        position: 'absolute',
                        top: dimensions.padding.medium,
                        right: dimensions.padding.medium,
                        zIndex: 1,
                        width: moderateScale(32),
                        height: moderateScale(32),
                        borderRadius: dimensions.borderRadius.round,
                        backgroundColor: currentTheme.colors.surface,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <ResponsiveText variant="body" color={currentTheme.colors.textSecondary}>
                        ✕
                      </ResponsiveText>
                    </View>
                  </TouchableWithoutFeedback>
                )}

                {renderContent()}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};