export type CapacitorDeviceInfo = {
  platform: string;
  isVirtual: boolean;
  osVersion: string;
  [key: string]: unknown;
};

export type CapacitorKeyboardInfo = {
  keyboardHeight: number;
};

export type CapacitorPermissionState = "prompt" | "prompt-with-rationale" | "granted" | "denied" | string;

export type CapacitorAppModule = {
  App: {
    addListener: (eventName: string, listenerFunc: (...args: unknown[]) => void) => Promise<unknown> | unknown;
    removeAllListeners: () => Promise<void> | void;
    getInfo: () => Promise<{ id: string; version: string; build: string; [key: string]: unknown }>;
  };
};

export type CapacitorBrowserModule = {
  Browser: {
    open: (options: { url: string; presentationStyle?: string }) => Promise<void> | void;
  };
};

export type CapacitorCameraModule = {
  Camera: {
    checkPermissions: () => Promise<{ camera: CapacitorPermissionState; photos: CapacitorPermissionState }>;
    requestPermissions: () => Promise<{ camera: CapacitorPermissionState; photos: CapacitorPermissionState }>;
    getPhoto: (options: Record<string, unknown>) => Promise<{ dataUrl?: string; [key: string]: unknown }>;
    pickImages: (options: Record<string, unknown>) => Promise<{ photos: unknown[]; [key: string]: unknown }>;
  };
  CameraResultType: { DataUrl: string };
  CameraSource: { Prompt: string; Camera: string; Photos: string };
};

export type CapacitorContactsModule = {
  Contacts: {
    checkPermissions: () => Promise<{ contacts: CapacitorPermissionState }>;
    requestPermissions: () => Promise<{ contacts: CapacitorPermissionState }>;
    getContacts: (options: Record<string, unknown>) => Promise<{ contacts: unknown[] }>;
  };
};

export type CapacitorCoreModule = {
  CapacitorCookies: {
    setCookie: (options: { key: string; value: string; path?: string }) => Promise<void> | void;
  };
};

export type CapacitorDeviceModule = {
  Device: {
    getInfo: () => Promise<CapacitorDeviceInfo>;
    getLanguageCode: () => Promise<{ value: string }>;
  };
};

export type CapacitorFcmModule = {
  FCM: {
    setAutoInit: (options: { enabled: boolean }) => Promise<void> | void;
    getToken: () => Promise<{ token: string }>;
  };
};

export type CapacitorGeolocationModule = {
  Geolocation: {
    requestPermissions: () => Promise<{ location: string; coarseLocation: string; [key: string]: string }>;
    getCurrentPosition: () => Promise<unknown>;
  };
};

export type CapacitorHapticsModule = {
  ImpactStyle: { Light: string; Medium: string; Heavy: string };
  Haptics: {
    vibrate: (options: { duration: number }) => Promise<void> | void;
    impact: (options: { style: string }) => Promise<void> | void;
    selectionStart: () => Promise<void> | void;
    selectionChanged: () => Promise<void> | void;
    selectionEnd: () => Promise<void> | void;
  };
};

export type CapacitorKeyboardModule = {
  Keyboard: {
    show: () => Promise<void> | void;
    hide: () => Promise<void> | void;
    addListener: (eventName: string, listenerFunc: (info: CapacitorKeyboardInfo) => void) => Promise<unknown> | unknown;
    removeAllListeners: () => Promise<void> | void;
  };
};

export type CapacitorPreferencesModule = {
  Preferences: {
    get: (options: { key: string }) => Promise<{ value: string | null }>;
    set: (options: { key: string; value: string }) => Promise<void> | void;
    remove: (options: { key: string }) => Promise<void> | void;
  };
};

export type CapacitorPushNotificationsModule = {
  PushNotifications: {
    requestPermissions: () => Promise<{ receive: "granted" | "denied" | string }>;
    checkPermissions: () => Promise<{ receive: "granted" | "denied" | string }>;
    register: () => Promise<void> | void;
  };
};

export type CapacitorSafeAreaModule = {
  SafeArea: {
    getSafeAreaInsets: () => Promise<{ insets: { top: number; bottom: number } }>;
  };
};

export type CapacitorUpdaterModule = {
  CapacitorUpdater: {
    notifyAppReady: () => Promise<void> | void;
    getPluginVersion: () => Promise<{ version: string }>;
    getDeviceId: () => Promise<{ deviceId: string }>;
    current: () => Promise<{ bundle: { version: string }; native: string }>;
    getBuiltinVersion: () => Promise<{ version: string }>;
    download: (options: { url: string; version: string }) => Promise<unknown>;
    set: (bundle: unknown) => Promise<void> | void;
  };
};

type CapacitorModuleMap = {
  app: CapacitorAppModule;
  browser: CapacitorBrowserModule;
  camera: CapacitorCameraModule;
  contacts: CapacitorContactsModule;
  core: CapacitorCoreModule;
  device: CapacitorDeviceModule;
  fcm: CapacitorFcmModule;
  geolocation: CapacitorGeolocationModule;
  haptics: CapacitorHapticsModule;
  keyboard: CapacitorKeyboardModule;
  preferences: CapacitorPreferencesModule;
  pushNotifications: CapacitorPushNotificationsModule;
  safeArea: CapacitorSafeAreaModule;
  updater: CapacitorUpdaterModule;
};

type CapacitorImportCache = Partial<{
  [K in keyof CapacitorModuleMap]: Promise<CapacitorModuleMap[keyof CapacitorModuleMap]>;
}>;

declare global {
  // eslint-disable-next-line no-var
  var __AKAN_CAPACITOR_IMPORTS__: CapacitorImportCache | undefined;
}

const getCapacitorImportCache = () => {
  globalThis.__AKAN_CAPACITOR_IMPORTS__ ??= {};
  return globalThis.__AKAN_CAPACITOR_IMPORTS__;
};

const loadCapacitorModule = <K extends keyof CapacitorModuleMap>(
  name: K,
  loader: () => Promise<CapacitorModuleMap[K]>,
) => {
  const cache = getCapacitorImportCache();
  const cached = cache[name] as Promise<CapacitorModuleMap[K]> | undefined;
  if (cached) return cached;

  const loaded = loader();
  cache[name] = loaded;
  return loaded;
};

const asCapacitorModule = <T>(modulePromise: Promise<unknown>) => modulePromise as Promise<T>;

export const loadCapacitorApp = () =>
  loadCapacitorModule("app", () => asCapacitorModule<CapacitorAppModule>(import("@capacitor/app")));

export const loadCapacitorBrowser = () =>
  loadCapacitorModule("browser", () => asCapacitorModule<CapacitorBrowserModule>(import("@capacitor/browser")));

export const loadCapacitorCamera = () =>
  loadCapacitorModule("camera", () => asCapacitorModule<CapacitorCameraModule>(import("@capacitor/camera")));

export const loadCapacitorContacts = () =>
  loadCapacitorModule("contacts", () =>
    asCapacitorModule<CapacitorContactsModule>(import("@capacitor-community/contacts")),
  );

export const loadCapacitorCore = () =>
  loadCapacitorModule("core", () => asCapacitorModule<CapacitorCoreModule>(import("@capacitor/core")));

export const loadCapacitorDevice = () =>
  loadCapacitorModule("device", () => asCapacitorModule<CapacitorDeviceModule>(import("@capacitor/device")));

export const loadCapacitorFcm = () =>
  loadCapacitorModule("fcm", () => asCapacitorModule<CapacitorFcmModule>(import("@capacitor-community/fcm")));

export const loadCapacitorGeolocation = () =>
  loadCapacitorModule("geolocation", () =>
    asCapacitorModule<CapacitorGeolocationModule>(import("@capacitor/geolocation")),
  );

export const loadCapacitorHaptics = () =>
  loadCapacitorModule("haptics", () => asCapacitorModule<CapacitorHapticsModule>(import("@capacitor/haptics")));

export const loadCapacitorKeyboard = () =>
  loadCapacitorModule("keyboard", () => asCapacitorModule<CapacitorKeyboardModule>(import("@capacitor/keyboard")));

export const loadCapacitorPreferences = () =>
  loadCapacitorModule("preferences", () =>
    asCapacitorModule<CapacitorPreferencesModule>(import("@capacitor/preferences")),
  );

export const loadCapacitorPushNotifications = () =>
  loadCapacitorModule("pushNotifications", () =>
    asCapacitorModule<CapacitorPushNotificationsModule>(import("@capacitor/push-notifications")),
  );

export const loadCapacitorSafeArea = () =>
  loadCapacitorModule("safeArea", () =>
    asCapacitorModule<CapacitorSafeAreaModule>(import("capacitor-plugin-safe-area")),
  );

export const loadCapacitorUpdater = () =>
  loadCapacitorModule("updater", () => asCapacitorModule<CapacitorUpdaterModule>(import("@capgo/capacitor-updater")));
