"use client";
import { loadCapacitorApp, loadCapacitorDevice, loadCapacitorUpdater } from "akanjs/client/capacitor";
import { mergeVersion, RestClient, splitVersion } from "akanjs/common";
import type { ProtoAppInfo, ProtoFile } from "akanjs/constant";
import { useState } from "react";

export const useCodepush = ({ serverUrl }: { serverUrl: string }) => {
  const [update, setUpdate] = useState(false);
  const [version, setVersion] = useState("");

  const initialize = async () => {
    const { CapacitorUpdater } = await loadCapacitorUpdater();
    await CapacitorUpdater.notifyAppReady();
  };
  const checkNewRelease = async () => {
    const [{ App }, { Device }, { CapacitorUpdater }] = await Promise.all([
      loadCapacitorApp(),
      loadCapacitorDevice(),
      loadCapacitorUpdater(),
    ]);
    const info = await Device.getInfo();
    const app = await App.getInfo();
    await CapacitorUpdater.getPluginVersion();
    const { deviceId } = await CapacitorUpdater.getDeviceId();
    const { bundle } = await CapacitorUpdater.current();
    const appId = app.id;
    const platform = info.platform;

    const runningVersion = bundle.version === "builtin" ? app.version : bundle.version;
    setVersion(runningVersion);
    const { major, minor, patch } = splitVersion(runningVersion);
    const appName = process.env.AKAN_PUBLIC_APP_NAME ?? "";

    const appInfo: ProtoAppInfo = {
      appId,
      appName,
      deviceId: deviceId,
      platform: platform as "ios" | "android",
      branch: process.env.AKAN_PUBLIC_ENV ?? "debug",
      isEmulator: info.isVirtual,
      major: parseInt(major),
      minor: parseInt(minor),
      patch: parseInt(patch),
      buildNum: app.build,
      versionOs: info.osVersion,
    };
    // TODO: take the release URL as an option and drop this lu → akasys host rewrite (codepush in development).
    const url = serverUrl.replace(/^((?:[a-z][a-z\d+.-]*:)?\/\/)?lu(?=[-.:/]|$)/i, "$1akasys");
    const httpClient = new RestClient(url);
    const release = await httpClient.post<(ProtoAppInfo & { appBuild: string }) | null>("/release/codepush", {
      data: { ...appInfo },
    });
    if (!release) return;
    const file = await httpClient.get<ProtoFile>(`/file/file/${release.appBuild}`);

    return { release: release, bundleFile: file };
  };

  const codepush = async () => {
    const newRelease = await checkNewRelease();
    if (!newRelease) return;
    const { release, bundleFile } = newRelease;
    const { CapacitorUpdater } = await loadCapacitorUpdater();
    setUpdate(true);
    const bundle = await CapacitorUpdater.download({
      url: bundleFile.url,
      version: mergeVersion(release.major, release.minor, release.patch),
    });
    await CapacitorUpdater.set(bundle);
  };

  const statManager = async () => {
    // TODO: report update statistics to the server.
  };

  return { update, version, initialize, checkNewRelease, codepush, statManager };
};
