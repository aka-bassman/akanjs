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
    exitApp?: () => Promise<void> | void;
    getLaunchUrl?: () => Promise<{ url?: string | null }>;
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

export type CapacitorSpeechRecognitionModule = {
  SpeechRecognition: {
    available: () => Promise<{ available: boolean }>;
    checkPermissions: () => Promise<{ speechRecognition: CapacitorPermissionState }>;
    requestPermissions: () => Promise<{ speechRecognition: CapacitorPermissionState }>;
    start: (options: Record<string, unknown>) => Promise<{ matches?: string[] }>;
    stop: () => Promise<void>;
    removeAllListeners: () => Promise<void> | void;
    addListener: (
      eventName: string,
      listenerFunc: (data: { matches?: string[] }) => void,
    ) => Promise<{ remove: () => Promise<void> | void }> | { remove: () => Promise<void> | void };
  };
};

export type CapacitorTextToSpeechModule = {
  TextToSpeech: {
    speak: (options: { text: string; lang?: string; rate?: number }) => Promise<void>;
    stop: () => Promise<void>;
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
    setResizeMode?: (options: { mode: "body" | "ionic" | "native" | "none" }) => Promise<void> | void;
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
    addListener: (
      eventName:
        | "registration"
        | "registrationError"
        | "pushNotificationReceived"
        | "pushNotificationActionPerformed"
        | string,
      listenerFunc: (event: {
        value?: string;
        error?: string;
        notification?: { data?: Record<string, unknown> };
      }) => void,
    ) => Promise<{ remove?: () => Promise<void> | void } | void> | { remove?: () => Promise<void> | void } | void;
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
  speechRecognition: CapacitorSpeechRecognitionModule;
  textToSpeech: CapacitorTextToSpeechModule;
  updater: CapacitorUpdaterModule;
};

type CapacitorImportCache = Partial<{
  [K in keyof CapacitorModuleMap]: Promise<CapacitorModuleMap[keyof CapacitorModuleMap]>;
}>;
type CapacitorPluginRegistry = Record<string, unknown>;

declare global {
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

const getCapacitorPlugin = <Plugin>(name: string): Plugin => {
  const capacitor = (globalThis as typeof globalThis & { Capacitor?: { Plugins?: CapacitorPluginRegistry } }).Capacitor;
  const plugin = capacitor?.Plugins?.[name];
  if (!plugin) throw new Error(`Capacitor plugin "${name}" is not available.`);
  return plugin as Plugin;
};

const loadCapacitorPlugin = <K extends keyof CapacitorModuleMap>(
  name: K,
  plugin: keyof CapacitorModuleMap[K] & string,
) => loadCapacitorModule(name, async () => ({ [plugin]: getCapacitorPlugin(plugin) }) as CapacitorModuleMap[K]);

export const loadCapacitorApp = () => loadCapacitorPlugin("app", "App");
export const loadCapacitorBrowser = () => loadCapacitorPlugin("browser", "Browser");

export const loadCapacitorCamera = () =>
  loadCapacitorModule("camera", async () => ({
    Camera: getCapacitorPlugin<CapacitorCameraModule["Camera"]>("Camera"),
    CameraResultType: { DataUrl: "dataUrl" },
    CameraSource: { Prompt: "PROMPT", Camera: "CAMERA", Photos: "PHOTOS" },
  }));

export const loadCapacitorContacts = () => loadCapacitorPlugin("contacts", "Contacts");
export const loadCapacitorCore = () => loadCapacitorPlugin("core", "CapacitorCookies");
export const loadCapacitorDevice = () => loadCapacitorPlugin("device", "Device");
export const loadCapacitorFcm = () => loadCapacitorPlugin("fcm", "FCM");
export const loadCapacitorGeolocation = () => loadCapacitorPlugin("geolocation", "Geolocation");

export const loadCapacitorHaptics = () =>
  loadCapacitorModule("haptics", async () => ({
    Haptics: getCapacitorPlugin<CapacitorHapticsModule["Haptics"]>("Haptics"),
    ImpactStyle: { Light: "LIGHT", Medium: "MEDIUM", Heavy: "HEAVY" },
  }));

export const loadCapacitorKeyboard = () => loadCapacitorPlugin("keyboard", "Keyboard");
export const loadCapacitorPreferences = () => loadCapacitorPlugin("preferences", "Preferences");
export const loadCapacitorPushNotifications = () => loadCapacitorPlugin("pushNotifications", "PushNotifications");
export const loadCapacitorSafeArea = () => loadCapacitorPlugin("safeArea", "SafeArea");
export const loadCapacitorSpeechRecognition = () => loadCapacitorPlugin("speechRecognition", "SpeechRecognition");
export const loadCapacitorTextToSpeech = () => loadCapacitorPlugin("textToSpeech", "TextToSpeech");
export const loadCapacitorUpdater = () => loadCapacitorPlugin("updater", "CapacitorUpdater");
