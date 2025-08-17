import { useState } from 'react';

export const usePrivacyPolicy = () => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isScrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return {
    hasScrolledToBottom,
    handleScroll,
  };
}; 