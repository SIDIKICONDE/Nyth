export interface PrivacyPolicyScreenProps {
  onAccept?: () => void;
  onDecline?: () => void;
  showActions?: boolean;
}

export interface PrivacySection {
  icon: string;
  title: string;
  content: string;
}

export interface PrivacyHeaderProps {
  currentTheme: any;
  showBackButton?: boolean;
}

export interface PrivacySectionItemProps {
  section: PrivacySection;
  index: number;
  currentTheme: any;
}

export interface PrivacyFooterProps {
  hasScrolledToBottom: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  currentTheme: any;
  showActions?: boolean;
}

export interface PrivacyContentProps {
  onScroll: (event: any) => void;
  hasScrolledToBottom: boolean;
  currentTheme: any;
}
