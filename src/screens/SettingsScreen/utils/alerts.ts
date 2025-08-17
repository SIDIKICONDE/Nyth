import { Alert, Platform } from 'react-native';
import { showAlert, showSaveConfirmation, showResetConfirmation as showResetAlert, showError } from '../../../utils/alertManager';

export const showResetConfirmation = (onConfirm: () => void, t: (key: string) => string) => {
  showResetAlert(
    t('settings.reset.confirmation.title'),
    t('settings.reset.confirmation.message'),
    onConfirm
  );
};

export const showResetSuccess = (t: (key: string) => string) => {
  showSaveConfirmation(
    t('settings.reset.success.title'), 
    t('settings.reset.success.message')
  );
};

export const showSaveSuccess = (hasCloudSync: boolean, t: (key: string) => string) => {
  showSaveConfirmation(
    t('settings.save.success.title'),
    hasCloudSync 
      ? t('settings.save.success.messageWithCloud')
      : t('settings.save.success.messageLocal')
  );
};

export const showSaveError = (t: (key: string) => string) => {
  showError(
    t('common.error'),
    t('settings.save.error.message')
  );
};

export const showNoScriptError = (t: (key: string) => string) => {
  Alert.alert(
    t('settings.noScript.title'),
    t('settings.noScript.message'),
    [{ text: t('common.ok') }]
  );
};



export const showClearCacheConfirmation = (onConfirm: () => void, t: (key: string) => string) => {
  Alert.alert(
    t('settings.clearCache.confirmation.title'),
    t('settings.clearCache.confirmation.message'),
    [
      {
        text: t('common.cancel'),
        style: 'cancel'
      },
      {
        text: t('settings.clearCache.confirmation.reset'),
        style: 'destructive',
        onPress: onConfirm
      }
    ]
  );
};

export const showResetCompleteAlert = (onRestart: () => void, t: (key: string) => string) => {
  Alert.alert(
    t('settings.clearCache.complete.title'),
    t('settings.clearCache.complete.message'),
    [
      {
        text: t('settings.clearCache.complete.restart'),
        onPress: onRestart
      }
    ]
  );
};

export const showResetError = (t: (key: string) => string) => {
  Alert.alert(
    t('common.error'),
    t('settings.clearCache.error.message')
  );
};

export const showSignOutConfirmation = (onConfirm: () => void, t: (key: string) => string) => {
  Alert.alert(
    t('settings.signOut.confirmation.title'),
    t('settings.signOut.confirmation.message'),
    [
      {
        text: t('common.cancel'),
        style: 'cancel'
      },
      {
        text: t('settings.signOut.confirmation.signOut'),
        style: 'destructive',
        onPress: onConfirm
      }
    ]
  );
};

export const showSignOutSuccess = (onOk: () => void, t: (key: string) => string) => {
  Alert.alert(
    t('settings.signOut.success.title'),
    t('settings.signOut.success.message'),
    [
      {
        text: t('common.ok'),
        onPress: onOk
      }
    ]
  );
};

export const showSignOutError = (t: (key: string) => string) => {
  Alert.alert(
    t('common.error'),
    t('settings.signOut.error.message')
  );
}; 