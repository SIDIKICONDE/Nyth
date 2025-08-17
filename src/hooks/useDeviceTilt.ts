import { useEffect, useState, useRef, useCallback } from "react";
import {
  accelerometer,
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes,
} from "react-native-sensors";

interface SensorData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface TiltData {
  tiltX: number;
  tiltY: number;
  rotation: string;
  isAvailable: boolean;
}

interface SensorSubscription {
  unsubscribe: () => void;
}

export const useDeviceTilt = (
  sensitivity: number = 0.5,
  maxRotation: number = 20,
  options?: {
    disableDuringTouch?: boolean;
    disableDuringScroll?: boolean;
  }
) => {
  const [tiltData, setTiltData] = useState<TiltData>({
    tiltX: 0,
    tiltY: 0,
    rotation: "0deg",
    isAvailable: false,
  });

  const lastUpdateRef = useRef<number>(0);
  const lastTiltDataRef = useRef<TiltData>({
    tiltX: 0,
    tiltY: 0,
    rotation: "0deg",
    isAvailable: false,
  });
  const isProcessingRef = useRef<boolean>(false);
  const gyroSubscriptionRef = useRef<SensorSubscription | null>(null);
  const accelSubscriptionRef = useRef<SensorSubscription | null>(null);
  const isDisabledRef = useRef<boolean>(false);

  const processGyroscopeData = useCallback(
    (data: SensorData) => {
      const now = Date.now();

      if (isDisabledRef.current || now - lastUpdateRef.current < 16) {
        return;
      }

      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      lastUpdateRef.current = now;

      try {
        const alpha = 0.8;
        const rawX = data.x * sensitivity;
        const rawY = data.y * sensitivity;
        const rawZ = data.z * sensitivity;

        const threshold = 0.05;
        const filteredX = Math.abs(rawX) < threshold ? 0 : rawX;
        const filteredY = Math.abs(rawY) < threshold ? 0 : rawY;

        const tiltX = Math.max(-1, Math.min(1, filteredX));
        const tiltY = Math.max(-1, Math.min(1, filteredY));

        const rotationDegrees = tiltX * maxRotation;

        const newTiltData = {
          tiltX,
          tiltY,
          rotation: `${rotationDegrees.toFixed(1)}deg`,
          isAvailable: true,
        };

        const hasSignificantChange =
          Math.abs(newTiltData.tiltX - lastTiltDataRef.current.tiltX) > 0.01 ||
          Math.abs(newTiltData.tiltY - lastTiltDataRef.current.tiltY) > 0.01;

        if (hasSignificantChange) {
          lastTiltDataRef.current = newTiltData;
          setTiltData(newTiltData);
        }
      } catch (error) {
      } finally {
        isProcessingRef.current = false;
      }
    },
    [sensitivity, maxRotation]
  );

  useEffect(() => {
    const initSensors = async () => {
      try {
        setUpdateIntervalForType(SensorTypes.gyroscope, 16);
        setUpdateIntervalForType(SensorTypes.accelerometer, 50);

        gyroSubscriptionRef.current = gyroscope.subscribe({
          next: processGyroscopeData,
          error: () => {
            accelSubscriptionRef.current = accelerometer.subscribe({
              next: processGyroscopeData,
              error: () => {
                setTiltData({
                  tiltX: 0,
                  tiltY: 0,
                  rotation: "0deg",
                  isAvailable: false,
                });
              },
            });
          },
        });
      } catch (error) {
        setTiltData({
          tiltX: 0,
          tiltY: 0,
          rotation: "0deg",
          isAvailable: false,
        });
      }
    };

    initSensors();

    return () => {
      isDisabledRef.current = true;

      if (gyroSubscriptionRef.current) {
        gyroSubscriptionRef.current.unsubscribe();
        gyroSubscriptionRef.current = null;
      }

      if (accelSubscriptionRef.current) {
        accelSubscriptionRef.current.unsubscribe();
        accelSubscriptionRef.current = null;
      }

      lastUpdateRef.current = 0;
      isProcessingRef.current = false;

      setTiltData({
        tiltX: 0,
        tiltY: 0,
        rotation: "0deg",
        isAvailable: false,
      });
    };
  }, [processGyroscopeData]);

  const disableGyroscope = useCallback(() => {
    isDisabledRef.current = true;
  }, []);

  const enableGyroscope = useCallback(() => {
    isDisabledRef.current = false;
  }, []);

  return {
    ...tiltData,
    disableGyroscope,
    enableGyroscope,
  };
};
