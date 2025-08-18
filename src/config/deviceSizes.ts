// Configuration des tailles d'appareils pour les tests responsive

export interface DeviceSize {
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  platform: 'ios' | 'android';
}

export const deviceSizes: DeviceSize[] = [
  // iPhones
  {
    name: 'iPhone SE (1st gen)',
    width: 320,
    height: 568,
    pixelRatio: 2,
    platform: 'ios',
  },
  {
    name: 'iPhone SE (2nd gen)',
    width: 375,
    height: 667,
    pixelRatio: 2,
    platform: 'ios',
  },
  {
    name: 'iPhone 12 Mini',
    width: 375,
    height: 812,
    pixelRatio: 3,
    platform: 'ios',
  },
  {
    name: 'iPhone 12',
    width: 390,
    height: 844,
    pixelRatio: 3,
    platform: 'ios',
  },
  {
    name: 'iPhone 12 Pro Max',
    width: 428,
    height: 926,
    pixelRatio: 3,
    platform: 'ios',
  },
  {
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    pixelRatio: 3,
    platform: 'ios',
  },
  {
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    pixelRatio: 3,
    platform: 'ios',
  },
  
  // iPads
  {
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    pixelRatio: 2,
    platform: 'ios',
  },
  {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    pixelRatio: 2,
    platform: 'ios',
  },
  {
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    pixelRatio: 2,
    platform: 'ios',
  },
  {
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    platform: 'ios',
  },
  
  // Android Phones
  {
    name: 'Pixel 3a',
    width: 393,
    height: 808,
    pixelRatio: 2.75,
    platform: 'android',
  },
  {
    name: 'Pixel 5',
    width: 393,
    height: 851,
    pixelRatio: 2.75,
    platform: 'android',
  },
  {
    name: 'Samsung Galaxy S10',
    width: 360,
    height: 760,
    pixelRatio: 4,
    platform: 'android',
  },
  {
    name: 'Samsung Galaxy S21',
    width: 384,
    height: 854,
    pixelRatio: 3.2,
    platform: 'android',
  },
  
  // Android Tablets
  {
    name: 'Nexus 7',
    width: 600,
    height: 960,
    pixelRatio: 2,
    platform: 'android',
  },
  {
    name: 'Samsung Galaxy Tab S7',
    width: 800,
    height: 1280,
    pixelRatio: 1.75,
    platform: 'android',
  },
];

// Catégories de tailles
export const sizeCategories = {
  smallPhone: deviceSizes.filter(d => d.width < 375),
  normalPhone: deviceSizes.filter(d => d.width >= 375 && d.width < 414),
  largePhone: deviceSizes.filter(d => d.width >= 414 && d.width < 600),
  smallTablet: deviceSizes.filter(d => d.width >= 600 && d.width < 800),
  largeTablet: deviceSizes.filter(d => d.width >= 800),
};

// Fonction pour obtenir la catégorie d'un appareil
export const getDeviceCategory = (width: number): string => {
  if (width < 375) return 'smallPhone';
  if (width < 414) return 'normalPhone';
  if (width < 600) return 'largePhone';
  if (width < 800) return 'smallTablet';
  return 'largeTablet';
};

// Safe areas par défaut pour différents appareils
export const defaultSafeAreas = {
  ios: {
    smallPhone: { top: 20, bottom: 0, left: 0, right: 0 },
    normalPhone: { top: 44, bottom: 34, left: 0, right: 0 },
    largePhone: { top: 47, bottom: 34, left: 0, right: 0 },
    tablet: { top: 20, bottom: 0, left: 0, right: 0 },
  },
  android: {
    default: { top: 24, bottom: 0, left: 0, right: 0 },
  },
};
