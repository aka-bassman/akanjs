import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { MobileProject } from "@trapezedev/project";
import type { AndroidProject } from "@trapezedev/project/dist/android/project";
import type { IosProject } from "@trapezedev/project/dist/ios/project";
import { capitalize } from "akanjs/common";
import type { AkanMobileTargetConfig } from "./akanConfig";
import type { AppExecutor } from "./executors";
import { FileEditor } from "./fileEditor";
import { resolveMobilePath, targetHtmlFilename } from "./mobile";

interface RunConfig {
  operation: "local" | "release";
  env: "local" | "debug" | "develop" | "main";
  regenerate?: boolean;
}

interface PrepareConfig extends RunConfig {}

export class CapacitorApp {
  project: MobileProject & { ios: IosProject; android: AndroidProject };
  iosTargetName = "App";
  readonly targetRoot: string;
  readonly targetRootPath: string;
  readonly targetWebRoot: string;
  readonly targetAssetRoot: string;
  readonly iosRootPath = "ios";
  readonly iosProjectPath = "ios/App";
  readonly androidRootPath = "android";
  readonly androidAssetsPath = "android/app/src/main/assets";
  constructor(
    private readonly app: AppExecutor,
    readonly target: AkanMobileTargetConfig,
  ) {
    this.targetRootPath = path.posix.join(".akan", "mobile", this.target.name);
    this.targetRoot = path.join(this.app.cwdPath, this.targetRootPath);
    this.targetWebRoot = path.join(this.targetRoot, "www");
    this.targetAssetRoot = path.join(this.targetRoot, "assets");
    this.project = new MobileProject(this.app.cwdPath, {
      android: { path: this.androidRootPath },
      ios: { path: this.iosProjectPath },
    }) as MobileProject & { ios: IosProject; android: AndroidProject };
  }
  async init({
    platform,
    operation = "release",
    env = "debug",
    regenerate = false,
  }: { platform?: "ios" | "android" } & Partial<PrepareConfig> = {}) {
    await mkdir(this.targetRoot, { recursive: true });
    await this.#writeCapacitorConfig();
    if (regenerate) {
      if (!platform || platform === "ios")
        await rm(path.join(this.app.cwdPath, this.iosRootPath), { recursive: true, force: true });
      if (!platform || platform === "android")
        await rm(path.join(this.app.cwdPath, this.androidRootPath), { recursive: true, force: true });
    }
    const project = this.project as MobileProject;
    await this.project.load();
    if ((!platform || platform === "android") && !project.android) {
      await this.#spawnMobile("npx", ["cap", "add", "android"], { operation, env });
      await this.project.load();
    }
    if ((!platform || platform === "ios") && !project.ios) {
      await this.#spawnMobile("npx", ["cap", "add", "ios"], { operation, env });
      await this.project.load();
    }
    return this;
  }
  async save() {
    await this.project.commit();
  }
  async #prepareIos({ operation, env, regenerate = false }: PrepareConfig) {
    await this.init({ platform: "ios", operation, env, regenerate });
    await this.#prepareTargetAssets();
    await this.#prepareExternalFiles("ios");
    await this.#applyIosMetadata();
    await this.#applyPermissions();
    await this.#applyLinks();
    await this.project.commit();
    await this.#generateAssets({ operation, env });
    this.app.verbose(`syncing iOS`);
    await this.#spawnMobile("npx", ["cap", "sync", "ios"], { operation, env });
    this.app.verbose(`sync completed.`);
  }
  async buildIos({ env = "debug", regenerate = false }: { env?: RunConfig["env"]; regenerate?: boolean } = {}) {
    await this.prepareWww();
    await this.#prepareIos({ operation: "release", env, regenerate });
    await this.#spawnMobile("npx", ["cap", "build", "ios"], { operation: "release", env }, { stdio: "inherit" });
    this.app.verbose(`build completed iOS.`);
    return;
  }
  async syncIos() {
    await this.#spawnMobile("npx", ["cap", "sync", "ios"], { operation: "local", env: "local" });
  }
  async openIos() {
    await this.#spawnMobile("npx", ["cap", "open", "ios"], { operation: "local", env: "local" });
  }
  async runIos({ operation, env, regenerate = false }: RunConfig) {
    if (operation === "release") await this.prepareWww();
    await this.#prepareIos({ operation, env, regenerate });
    const args = ["cap", "run", "ios"];
    await this.#spawnMobile("npx", args, { operation, env }, { stdio: "inherit" });
  }

  async #prepareAndroid({ operation, env, regenerate = false }: PrepareConfig) {
    await this.init({ platform: "android", operation, env, regenerate });
    await this.#prepareTargetAssets();
    await this.#prepareExternalFiles("android");
    await this.#applyAndroidMetadata();
    await this.#applyPermissions();
    await this.#applyLinks();
    await this.project.commit();
    await this.#generateAssets({ operation, env });
    await this.#ensureAndroidAssetsDir();
    await this.#ensureAndroidDebugKeystore();
    await this.#spawnMobile("npx", ["cap", "sync", "android"], { operation, env });
  }

  async #updateAndroidBuildTypes() {
    //keystore 기본 설정 및 debug, release 설정

    const appGradle = await FileEditor.create(path.join(this.app.cwdPath, this.androidRootPath, "app/build.gradle"));
    const buildTypesBlock = `
      debug {
        applicationIdSuffix ".debug"
        versionNameSuffix "-DEBUG"
        debuggable true
        minifyEnabled false
      }
    `;
    const singinConfigBlock = `
     signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
        `;
    if (appGradle.find("signingConfigs {") === -1) {
      appGradle.insertBefore("buildTypes {", singinConfigBlock);
    }
    if (appGradle.find(`applicationIdSuffix ".debug"`) === -1) {
      appGradle.insertAfter("buildTypes {", buildTypesBlock);
    }
    await appGradle.save();
  }
  async buildAndroid(
    assembleType: "apk" | "aab",
    { env = "debug", regenerate = false }: { env?: RunConfig["env"]; regenerate?: boolean } = {},
  ) {
    await this.prepareWww();
    await this.#prepareAndroid({ operation: "release", env, regenerate });
    await this.#updateAndroidBuildTypes();
    //윈도우는 gradlew.bat 사용
    const isWindows = process.platform === "win32";
    const gradleCommand = isWindows ? "gradlew.bat" : "./gradlew";

    await this.app.spawn(gradleCommand, [assembleType === "apk" ? "assembleRelease" : "bundleRelease"], {
      stdio: "inherit",
      cwd: path.join(this.app.cwdPath, this.androidRootPath),
      env: await this.#commandEnv("release", env),
    });
  }
  async openAndroid() {
    await this.#spawnMobile("npx", ["cap", "open", "android"], { operation: "local", env: "local" });
  }
  async #ensureAndroidAssetsDir() {
    await mkdir(path.join(this.app.cwdPath, this.androidAssetsPath), { recursive: true });
  }
  async #ensureAndroidDebugKeystore() {
    const keystorePath = path.join(this.app.cwdPath, this.androidRootPath, "app/debug.keystore");
    if (await Bun.file(keystorePath).exists()) return;

    await this.#spawn("keytool", [
      "-genkeypair",
      "-v",
      "-keystore",
      keystorePath,
      "-storepass",
      "android",
      "-alias",
      "androiddebugkey",
      "-keypass",
      "android",
      "-keyalg",
      "RSA",
      "-keysize",
      "2048",
      "-validity",
      "10000",
      "-dname",
      "CN=Android Debug,O=Android,C=US",
    ]);
  }
  async syncAndroid(options: { regenerate?: boolean } = {}) {
    await this.prepareWww();
    await this.#prepareAndroid({ operation: "release", env: "debug", ...options });
    this.app.log(`Sync Android Completed.`);
  }
  async runAndroid({ operation, env, regenerate = false }: RunConfig) {
    if (operation === "release") await this.prepareWww();
    await this.#prepareAndroid({ operation, env, regenerate });
    this.app.logger.info(`Running Android in ${operation} mode on ${env} env`);
    const args = ["cap", "run", "android"];
    await this.#spawnMobile("npx", args, { operation, env }, { stdio: "inherit" });
  }

  async releaseIos() {
    await this.prepareWww();
    await this.#prepareIos({ operation: "release", env: "main" });
  }
  async releaseAndroid() {
    await this.prepareWww();
    await this.#prepareAndroid({ operation: "release", env: "main" });
  }
  async prepareWww() {
    const htmlSource = path.join(this.app.dist.cwdPath, "csr", targetHtmlFilename(this.target));
    if (!(await Bun.file(htmlSource).exists()))
      throw new Error(`CSR html for mobile target '${this.target.name}' not found: ${htmlSource}`);
    await rm(this.targetWebRoot, { recursive: true, force: true });
    await mkdir(this.targetWebRoot, { recursive: true });
    await Bun.write(
      path.join(this.targetWebRoot, "index.html"),
      this.#injectMobileTargetMeta(await Bun.file(htmlSource).text()),
    );
  }
  #injectMobileTargetMeta(html: string) {
    const basePath = this.target.basePath?.replace(/^\/+|\/+$/g, "") ?? "";
    const script = `<script>window.__AKAN_MOBILE_TARGET__=${JSON.stringify({ name: this.target.name, basePath })};</script>`;
    if (html.includes("window.__AKAN_MOBILE_TARGET__")) return html;
    return html.replace(/<\/head\s*>/i, `${script}\n</head>`);
  }
  async #writeCapacitorConfig() {
    await mkdir(this.targetRoot, { recursive: true });
    const appInfoPath = path
      .relative(this.app.cwdPath, path.join(this.app.cwdPath, "akan.app.json"))
      .split(path.sep)
      .join("/");
    const content = `import type { AppScanResult } from "akanjs";
import { withBase } from "${process.env.USE_AKANJS_PKGS === "true" ? "../../pkgs/" : ""}akanjs/capacitor.base.config";
import appInfo from "${appInfoPath.startsWith(".") ? appInfoPath : `./${appInfoPath}`}";

export default withBase(
  (config, target) => ({
    ...config,
    webDir: \`.akan/mobile/\${target.name}/www\`,
    android: {
      ...config.android,
      path: "android",
    },
    ios: {
      ...config.ios,
      path: "ios",
    },
  }),
  appInfo as AppScanResult,
);
`;
    await Bun.write(path.join(this.app.cwdPath, "capacitor.config.ts"), content);
  }
  async #prepareTargetAssets() {
    if (!this.target.assets) return;
    await mkdir(this.targetAssetRoot, { recursive: true });
    if (this.target.assets.icon)
      await cp(path.join(this.app.cwdPath, this.target.assets.icon), path.join(this.targetAssetRoot, "icon.png"), {
        force: true,
      });
    if (this.target.assets.splash)
      await cp(path.join(this.app.cwdPath, this.target.assets.splash), path.join(this.targetAssetRoot, "splash.png"), {
        force: true,
      });
  }
  async #prepareExternalFiles(platform: "ios" | "android") {
    const files = this.target.files?.[platform];
    if (!files) return;
    const platformRoot = path.join(this.app.cwdPath, platform === "ios" ? this.iosRootPath : this.androidRootPath);
    await Promise.all(
      Object.entries(files).map(async ([to, from]) => {
        const targetPath = path.join(platformRoot, to);
        await mkdir(path.dirname(targetPath), { recursive: true });
        await cp(path.join(this.app.cwdPath, from), targetPath, { force: true });
      }),
    );
  }
  async #generateAssets({ operation, env }: Pick<RunConfig, "operation" | "env">) {
    if (!this.target.assets) return;
    await this.#spawnMobile(
      "npx",
      [
        "@capacitor/assets",
        "generate",
        "--assetPath",
        path.posix.join(this.targetRootPath, "assets"),
        "--iosProject",
        this.iosProjectPath,
        "--androidProject",
        this.androidRootPath,
      ],
      { operation, env },
    );
  }
  async #applyIosMetadata() {
    this.project.ios.setBundleId("App", "Debug", this.target.appId);
    this.project.ios.setBundleId("App", "Release", this.target.appId);
    await this.project.ios.setVersion("App", "Debug", this.target.version);
    await this.project.ios.setVersion("App", "Release", this.target.version);
    await this.project.ios.setBuild("App", "Debug", this.target.buildNum);
    await this.project.ios.setBuild("App", "Release", this.target.buildNum);
  }
  async #applyAndroidMetadata() {
    await this.project.android.setVersionName(this.target.version);
    await this.project.android.setPackageName(this.target.appId);
    await this.project.android.setVersionCode(this.target.buildNum);
    await this.project.android.setAppName(this.target.appName);
  }
  async #applyPermissions() {
    for (const permission of this.target.permissions ?? []) {
      if (permission === "camera") await this.addCamera();
      else if (permission === "contacts") await this.addContact();
      else if (permission === "location") await this.addLocation();
      else if (permission === "push") await this.addPush();
    }
  }
  async #applyLinks() {
    const links = this.target.links;
    if (!links) return;
    const schemes = links.schemes ?? [];
    if (schemes.length > 0) {
      await this.#setPermissionInIos({
        appTransportSecurity: "",
      });
      for (const scheme of schemes) {
        this.project.android
          .getAndroidManifest()
          .injectFragment(
            "activity",
            `<intent-filter><action android:name="android.intent.action.VIEW" /><category android:name="android.intent.category.DEFAULT" /><category android:name="android.intent.category.BROWSABLE" /><data android:scheme="${scheme}" /></intent-filter>`,
          );
      }
    }
    for (const domain of links.associatedDomains ?? []) {
      this.app.logger.info(`Configure iOS associated domain manually if needed: ${domain}`);
    }
    for (const host of links.androidHosts ?? []) {
      const pathPrefix = resolveMobilePath(this.target, "/");
      this.project.android
        .getAndroidManifest()
        .injectFragment(
          "activity",
          `<intent-filter android:autoVerify="true"><action android:name="android.intent.action.VIEW" /><category android:name="android.intent.category.DEFAULT" /><category android:name="android.intent.category.BROWSABLE" /><data android:scheme="https" android:host="${host}" android:pathPrefix="${pathPrefix}" /></intent-filter>`,
        );
    }
  }
  async #commandEnv(operation: "local" | "release", env: "local" | "debug" | "develop" | "main") {
    const devPort = operation === "local" ? (await this.app.getDevPort()).toString() : undefined;
    return this.app.getCommandEnv({
      APP_OPERATION_MODE: operation,
      AKAN_PUBLIC_OPERATION_MODE: env === "local" ? "local" : "cloud",
      AKAN_PUBLIC_ENV: env,
      AKAN_MOBILE_TARGET: this.target.name,
      ...(devPort ? { PORT: devPort, AKAN_PUBLIC_CLIENT_PORT: devPort, AKAN_PUBLIC_SERVER_PORT: devPort } : {}),
    });
  }
  async #spawn(command: string, args: string[] = [], options: Parameters<AppExecutor["spawn"]>[2] = {}) {
    return await this.app.spawn(command, args, { cwd: this.app.cwdPath, ...options });
  }
  async #spawnMobile(
    command: string,
    args: string[] = [],
    { operation, env }: Pick<RunConfig, "operation" | "env">,
    options: Parameters<AppExecutor["spawn"]>[2] = {},
  ) {
    return await this.#spawn(command, args, {
      ...options,
      env: { ...(await this.#commandEnv(operation, env)), ...options.env },
    });
  }
  async addCamera() {
    await this.#setPermissionInIos({
      cameraUsageDescription: "$(PRODUCT_NAME) requires access to the camera to take photos.",
      photoAddUsageDescription: "$(PRODUCT_NAME) requires access to the photo library to take photos.",
      photoUsageDescription: "$(PRODUCT_NAME) requires access to the photo library to take photos.",
    });
    this.#setPermissionsInAndroid(["READ_MEDIA_IMAGES", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]);
  }
  async addContact() {
    await this.#setPermissionInIos({
      contactsUsageDescription: "$(PRODUCT_NAME) requires access to the contacts to add new contacts.",
    });
    this.#setPermissionsInAndroid(["READ_CONTACTS", "WRITE_CONTACTS"]);
  }
  async addLocation() {
    await this.#setPermissionInIos({
      locationAlwaysUsageDescription: "$(PRODUCT_NAME) requires access to the location to get the user's location.",
      locationWhenInUseUsageDescription: "$(PRODUCT_NAME) requires access to the location to get the user's location.",
    });
    this.#setPermissionsInAndroid(["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"]);
    this.#setFeaturesInAndroid(["android.hardware.location.gps"]);
  }
  async addPush() {
    await this.#setPermissionInIos({
      userNotificationsUsageDescription: "$(PRODUCT_NAME) uses notifications to keep you updated.",
    });
    this.#setPermissionsInAndroid(["POST_NOTIFICATIONS"]);
  }
  async #setPermissionInIos(permissions: { [key: string]: string }) {
    const updateNs = Object.fromEntries(
      Object.entries(permissions).map(([key, value]) => [`NS${capitalize(key)}`, value]),
    );
    await Promise.all([
      this.project.ios.updateInfoPlist(this.iosTargetName, "Debug", updateNs),
      this.project.ios.updateInfoPlist(this.iosTargetName, "Release", updateNs),
    ]);
  }
  #setFeaturesInAndroid(features: string[]) {
    for (const feature of features) {
      if (this.#hasFeatureInAndroid(feature)) {
        this.app.logger.info(`${feature} already exists in android`);
        return this;
      }
      this.app.logger.info(`Adding ${feature} to android`);
      this.project.android
        .getAndroidManifest()
        .injectFragment("manifest", `<uses-feature android:name="${feature}" />`);
    }
    return this;
  }
  #getFeaturesInAndroid() {
    const androidManifest = this.project.android.getAndroidManifest();
    const element = androidManifest.getDocumentElement();
    if (!element) throw new Error("manifest not found");
    const usesFeature = element.getElementsByTagName("uses-feature");
    return Array.from(usesFeature).map((feature) => feature.getAttribute("android:name"));
  }
  #hasFeatureInAndroid(feature: string) {
    return this.#getFeaturesInAndroid().includes(feature);
  }

  #setPermissionsInAndroid(permissions: string[]) {
    for (const permission of permissions) {
      if (this.#hasPermissionInAndroid(permission)) {
        this.app.logger.info(`${permission} already exists in android`);
        return this;
      }
      this.app.logger.info(`Adding ${permission} to android`);
      this.project.android
        .getAndroidManifest()
        .injectFragment("manifest", `<uses-permission android:name="android.permission.${permission}" />`);
    }
    return this;
  }
  #getPermissionsInAndroid() {
    const androidManifest = this.project.android.getAndroidManifest();
    const element = androidManifest.getDocumentElement();
    if (!element) throw new Error("manifest not found");
    const usesPermission = element.getElementsByTagName("uses-permission");
    return Array.from(usesPermission).map((permission) => permission.getAttribute("android:name"));
  }
  #hasPermissionInAndroid(permission: string) {
    return this.#getPermissionsInAndroid().includes(permission);
  }
}
