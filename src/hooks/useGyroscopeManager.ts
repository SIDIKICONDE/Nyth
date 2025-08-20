import { useRef, useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";

interface GyroscopeManagerOptions {
  disableDuringTouch?: boolean;
  disableDuringScroll?: boolean;
  disableWhenAppInactive?: boolean;
  reenableDelay?: number;
}

export const useGyroscopeManager = (options: GyroscopeManagerOptions = {}) => {
  const {
    disableDuringTouch = true,
    disableDuringScroll = true,
    disableWhenAppInactive = true,
    reenableDelay = 1000,
  } = options;

  const isDisabledRef = useRef<boolean>(false);
  const reenableTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const disableGyroscope = useCallback(() => {
    if (!isDisabledRef.current) {
      isDisabledRef.current = true;
    }
  }, []);

  const enableGyroscope = useCallback(() => {
    if (isDisabledRef.current) {
      isDisabledRef.current = false;
    }
  }, []);

  const scheduleReenable = useCallback(() => {
    if (reenableTimeoutRef.current) {
      clearTimeout(reenableTimeoutRef.current);
    }

    reenableTimeoutRef.current = setTimeout(() => {
      enableGyroscope();
      reenableTimeoutRef.current = null;
    }, reenableDelay);
  }, [enableGyroscope, reenableDelay]);

  const handleTouchStart = useCallback(() => {
    if (disableDuringTouch) {
      touchStartTimeRef.current = Date.now();
      disableGyroscope();
    }
  }, [disableDuringTouch, disableGyroscope]);

  const handleTouchEnd = useCallback(() => {
    if (disableDuringTouch) {
      const touchDuration = Date.now() - touchStartTimeRef.current;

      if (touchDuration < 200) {
        enableGyroscope();
      } else {
        scheduleReenable();
      }
    }
  }, [disableDuringTouch, enableGyroscope, scheduleReenable]);

  const handleScrollStart = useCallback(() => {
    if (disableDuringScroll) {
      disableGyroscope();
    }
  }, [disableDuringScroll, disableGyroscope]);

  const handleScrollEnd = useCallback(() => {
    if (disableDuringScroll) {
      scheduleReenable();
    }
  }, [disableDuringScroll, scheduleReenable]);

  useEffect(() => {
    if (!disableWhenAppInactive) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "inactive" || nextAppState === "background") {
        disableGyroscope();
      } else if (nextAppState === "active") {
        scheduleReenable();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [disableWhenAppInactive, disableGyroscope, scheduleReenable]);

  useEffect(() => {
    return () => {
      if (reenableTimeoutRef.current) {
        clearTimeout(reenableTimeoutRef.current);
        reenableTimeoutRef.current = null;
      }

      enableGyroscope();
    };
  }, [enableGyroscope]);

  return {
    isDisabled: isDisabledRef.current,
    disableGyroscope,
    enableGyroscope,
    handleTouchStart,
    handleTouchEnd,
    handleScrollStart,
    handleScrollEnd,
  };
};
