import type { Dayjs } from "dayjs";
import type { SupportedLlmModel } from "../aiEditor";

export const basePath = `${Bun.env.HOME ?? Bun.env.USERPROFILE}/.akan`;
export const configPath = `${basePath}/config.json`;
export const akanCloudHost = process.env.USE_AKANJS_PKGS === "true" ? "http://localhost" : "https://cloud.akanjs.com";
export const akanCloudUrl = `${akanCloudHost}${process.env.USE_AKANJS_PKGS === "true" ? ":8282" : ""}/api`;

export interface HostConfig {
  auth?: {
    accessToken?: AccessToken;
    self?: { id: string; nickname: string };
  };
}
export interface HostConfigDto {
  auth?: {
    accessToken?: AccessTokenDto;
    self?: { id: string; nickname: string };
  };
}
export const defaultHostConfig: HostConfig = {};
export interface RemoteEnvServerConfig {
  host: string;
  username?: string;
  port?: number;
}
export interface AkanGlobalConfig {
  cloudHost: { [key: string]: HostConfigDto };
  remoteEnvServers: Record<string, RemoteEnvServerConfig>;
  llm: { model: SupportedLlmModel; apiKey: string } | null;
}
export const defaultAkanGlobalConfig: AkanGlobalConfig = {
  cloudHost: {},
  remoteEnvServers: {},
  llm: null,
};

export interface AccessTokenDto {
  jwt: string;
  refreshToken: string | null;
  expiresAt: string | null;
}
export interface AccessToken {
  jwt: string;
  refreshToken: string | null;
  expiresAt: Dayjs | null;
}
