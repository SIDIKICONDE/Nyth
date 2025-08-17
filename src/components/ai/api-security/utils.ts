import { PROVIDER_ICONS, PROVIDER_COLORS, PROVIDER_GRADIENTS, EXPIRY_THRESHOLDS, EXPIRY_STATUSES } from './constants';
import { ExpiryStatus } from './types';

export const getProviderIcon = (provider: string): string => {
  return PROVIDER_ICONS[provider] || PROVIDER_ICONS.default;
};

export const getProviderColor = (provider: string, defaultColor: string): string => {
  return PROVIDER_COLORS[provider] || defaultColor;
};

export const getProviderGradient = (provider: string, defaultGradient: [string, string]): [string, string] => {
  return PROVIDER_GRADIENTS[provider] || defaultGradient;
};

export const getExpiryStatus = (daysUntilExpiry: number): ExpiryStatus => {
  if (daysUntilExpiry <= EXPIRY_THRESHOLDS.URGENT) {
    return EXPIRY_STATUSES.URGENT;
  }
  if (daysUntilExpiry <= EXPIRY_THRESHOLDS.WARNING) {
    return EXPIRY_STATUSES.WARNING;
  }
  return EXPIRY_STATUSES.SECURE;
}; 