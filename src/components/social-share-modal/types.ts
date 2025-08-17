import { SocialPlatform } from '../../services/social-share';

export interface SocialShareModalProps {
  visible: boolean;
  onClose: () => void;
  videoUri: string;
  videoTitle?: string;
  aspectRatio?: { width: number; height: number };
}

export interface ShareFormData {
  title: string;
  description: string;
  hashtags: string;
}

export interface ShareState {
  selectedPlatform: SocialPlatform | null;
  formData: ShareFormData;
  isSharing: boolean;
}

export interface PlatformButtonProps {
  platform: SocialPlatform;
  isSelected: boolean;
  isInstalled: boolean;
  isRecommended: boolean;
  onSelect: (platform: SocialPlatform) => void;
}

export interface ShareFormProps {
  platform: SocialPlatform;
  formData: ShareFormData;
  onFormChange: (data: Partial<ShareFormData>) => void;
}

export interface AppDetectionState {
  installedApps: Set<string>;
  isLoading: boolean;
}

export interface ShareModalHeaderProps {
  onClose: () => void;
  onShare: () => void;
  canShare: boolean;
  isSharing: boolean;
}

export interface PlatformGridProps {
  platforms: SocialPlatform[];
  selectedPlatform: SocialPlatform | null;
  onPlatformSelect: (platform: SocialPlatform | null) => void;
  recommendedPlatforms: SocialPlatform[];
} 