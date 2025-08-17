import React, { useEffect } from 'react';
import { useMigrateToCloudAnalytics } from '../../scripts/migrateToCloudAnalytics';

interface AnalyticsMigrationManagerProps {
  children: React.ReactNode;
}

export const AnalyticsMigrationManager: React.FC<AnalyticsMigrationManagerProps> = ({ children }) => {
  // Utiliser le hook de migration ici, où la navigation est disponible
  useMigrateToCloudAnalytics();

  return <>{children}</>;
};

export default AnalyticsMigrationManager; 