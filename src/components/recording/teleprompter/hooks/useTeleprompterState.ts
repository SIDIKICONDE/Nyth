import { useState, useRef } from 'react';

export const useTeleprompterState = () => {
  // États principaux
  const [isUpdatingHeight, setIsUpdatingHeight] = useState(false);
  const [textHeight, setTextHeight] = useState(0);
  const [isTextMeasured, setIsTextMeasured] = useState(false);
  const [isTouchPaused, setIsTouchPaused] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetIndicator, setShowResetIndicator] = useState(false);

  // Références
  const prevIsPausedRef = useRef(false);
  const prevIsRecordingRef = useRef(false);
  const doubleTapCountRef = useRef(0);
  const currentScrollPositionRef = useRef(0);

  return {
    // États
    isUpdatingHeight,
    setIsUpdatingHeight,
    textHeight,
    setTextHeight,
    isTextMeasured,
    setIsTextMeasured,
    isTouchPaused,
    setIsTouchPaused,
    isResetting,
    setIsResetting,
    showResetIndicator,
    setShowResetIndicator,
    
    // Références
    prevIsPausedRef,
    prevIsRecordingRef,
    doubleTapCountRef,
    currentScrollPositionRef,
  };
}; 