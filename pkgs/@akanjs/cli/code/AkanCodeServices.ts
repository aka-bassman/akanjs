import { existsSync, mkdirSync } from "node:fs";
import {
  AuthStorage,
  type InlineExtension,
  ModelRegistry,
  SessionManager,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";
import type { CodeAgentProfile } from "akanjs/common";
import { AkanAuthStorageBackend } from "./AkanAuthStorageBackend";
import { AkanEnvKeys } from "./AkanEnvKeys";
import { akanCodePaths } from "./akanCodePaths";
import { akanSystemPrompt } from "./akanSystemPrompt";

export interface AkanCodeServicesOptions {
  workspaceRoot: string;
  cwd: string;
  profile: CodeAgentProfile;
  extensions: InlineExtension[];
  sessionId?: string;
}

/**
 * Assembles the engine's injectable services from akan's own storage.
 *
 * Every one of the five is passed explicitly. Leave any of them out and the engine falls back to `~/.pi/` —
 * measured: with all five injected it writes nothing outside the paths named here.
 */
export class AkanCodeServices {
  static settings() {
    // Settings are in memory on purpose: the engine's file settings would be a second configuration surface
    // beside `akan.config.ts` with its own precedence, for options akan already decides through the profile.
    // `enableInstallTelemetry` defaults to true and attaches pi-branded headers to OpenRouter, NVIDIA and
    // Cloudflare requests, so it is turned off here rather than per host — a host that changes provider later
    // would otherwise turn it back on without meaning to.
    return SettingsManager.inMemory({
      enableInstallTelemetry: false,
      enableAnalytics: false,
      quietStartup: true,
    });
  }

  static auth(workspaceRoot: string) {
    mkdirSync(akanCodePaths.globalDir(), { recursive: true, mode: 0o700 });
    const authStorage = AuthStorage.fromStorage(new AkanAuthStorageBackend(akanCodePaths.authFile()));
    AkanEnvKeys.apply(authStorage, workspaceRoot);
    return authStorage;
  }

  static models(authStorage: AuthStorage) {
    return ModelRegistry.create(authStorage, akanCodePaths.modelsFile());
  }

  static sessions(workspaceRoot: string, cwd: string, profile: CodeAgentProfile) {
    if (profile.session.store !== "file") return SessionManager.inMemory(cwd);
    const dir = akanCodePaths.sessionsDir(workspaceRoot);
    mkdirSync(dir, { recursive: true });
    return SessionManager.create(cwd, dir);
  }

  /**
   * The akan skill set, then the workspace's own.
   *
   * A path that does not exist is a reported load error rather than a skip, so both are checked first.
   */
  static #skillPaths(profile: CodeAgentProfile, workspaceRoot: string) {
    if (!profile.context.skills) return [];
    const workspace = akanCodePaths.skillsDir(workspaceRoot);
    return [akanCodePaths.builtinSkillsDir(), existsSync(workspace) ? workspace : undefined].filter(
      (dir): dir is string => !!dir,
    );
  }

  /**
   * What the engine's resource loader may discover. Extensions and skills come from the workspace, never from
   * the home directory: a coding agent that picks up a globally installed extension behaves differently in two
   * checkouts of the same repo for reasons nothing in the repo explains.
   */
  static resourceOptions(options: AkanCodeServicesOptions) {
    // A path that does not exist is reported as a load error rather than skipped, and these two are optional.
    const present = (dir: string) => (existsSync(dir) ? [dir] : []);
    return {
      noExtensions: true,
      // Always on: it turns off the engine's *default* skill locations, which are `~/.pi/skills` and the
      // checkout's own `.pi/`. Explicit `additionalSkillPaths` are merged either way, so this is the switch
      // that keeps a skill in whoever's home directory from changing how the agent works here.
      noSkills: true,
      noPromptTemplates: true,
      noThemes: true,
      noContextFiles: !options.profile.context.projectFiles,
      appendSystemPrompt: [akanSystemPrompt(options.profile)],
      additionalExtensionPaths: present(akanCodePaths.extensionsDir(options.workspaceRoot)),
      additionalSkillPaths: AkanCodeServices.#skillPaths(options.profile, options.workspaceRoot),
      extensionFactories: options.extensions,
    };
  }
}
