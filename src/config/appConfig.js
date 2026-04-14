/**
 * App Configuration — Smart Crowd AI
 * ==========================================
 * Centralized environment configuration loader.
 * Parses and type-casts environment variables for safe consumption.
 */

const getEnv = (key, defaultValue = '') => import.meta.env[key] ?? defaultValue;
const getBool = (key, defaultValue = false) => {
  const val = import.meta.env[key];
  if (val === 'true') return true;
  if (val === 'false') return false;
  return defaultValue;
};
const getInt = (key, defaultValue = 0) => {
  const val = parseInt(import.meta.env[key], 10);
  return isNaN(val) ? defaultValue : val;
};

export const appConfig = {
  app: {
    name: getEnv('VITE_APP_NAME', 'Smart Crowd AI'),
    env: getEnv('VITE_APP_ENV', 'development'),
  },
  
  firebase: {
    apiKey:            getEnv('VITE_FIREBASE_API_KEY'),
    authDomain:        getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId:         getEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket:     getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId:             getEnv('VITE_FIREBASE_APP_ID'),
  },
  
  api: {
    baseUrl: getEnv('VITE_API_BASE_URL', 'http://localhost:3000/v1'),
  },
  
  features: {
    enableSimulation:      getBool('VITE_ENABLE_SIMULATION', true),
    enableRecommendations: getBool('VITE_ENABLE_AI_RECOMMENDATIONS', true),
    enableNotifications:   getBool('VITE_ENABLE_NOTIFICATIONS', true),
    enableExport:          getBool('VITE_ENABLE_EXPORT', true),
  },

  maintenance: {
    enabled:       getBool('VITE_MAINTENANCE_MODE', false),
    message:       getEnv('VITE_MAINTENANCE_MESSAGE', 'Smart Crowd AI is temporarily unavailable for scheduled maintenance.'),
    estimatedTime: getEnv('VITE_MAINTENANCE_ESTIMATED_TIME', '15 minutes'),
    contactEmail:  getEnv('VITE_MAINTENANCE_CONTACT_EMAIL', 'support@smartcrowd.ai'),
    contactPhone:  getEnv('VITE_MAINTENANCE_CONTACT_PHONE', ''),
  },
  
  simulation: {
    refreshInterval: getInt('VITE_SIM_REFRESH_INTERVAL', 3000),
    autoStart:       getBool('VITE_SIM_AUTO_START', false),
  },

  isProduction: getEnv('VITE_APP_ENV') === 'production',
  isDevelopment: getEnv('VITE_APP_ENV') === 'development',
};

export default appConfig;
