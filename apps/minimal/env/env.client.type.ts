export type AppClientEnv = {
  firebase?: {
    apiKey: string;
    authDomain?: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    vapidKey?: string;
  };
  google?: {
    mapKey: string;
  };
  cloudflare?: {
    siteKey: string;
  };
};
