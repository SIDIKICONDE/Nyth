import React, { useEffect } from "react";

interface SplashScreenManagerProps {
  children: React.ReactNode;
  onReady?: () => void;
}

export const SplashScreenManager: React.FC<SplashScreenManagerProps> = ({
  children,
  onReady,
}) => {
  useEffect(() => {
    if (onReady) onReady();
  }, [onReady]);
  return <>{children}</>;
};

export default SplashScreenManager;
