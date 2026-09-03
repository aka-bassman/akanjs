"use client";
import { Device, isMobileDevice, Translator } from "akanjs/client";
import { type CapacitorPermissionState, loadCapacitorCamera } from "akanjs/client/capacitor";
import { parseAkanI18nEnv } from "akanjs/common";
import { useEffect, useState } from "react";

type PermissionStatus = {
  camera: CapacitorPermissionState;
  photos: CapacitorPermissionState;
};

/** The four strings the native picker shows. Omitted ones come from the `base` dictionary. */
export interface CameraPromptLabels {
  header?: string;
  photo?: string;
  picture?: string;
  cancel?: string;
}

/**
 * The picker sheet is drawn by the OS from strings handed to it, so there is no component to render `l()` in and
 * no render pass to read it during — the same position `showMessage` is in, and the same answer.
 */
const promptLabel = (key: string, override?: string) =>
  override ?? Translator.translateByLocale(Translator.getActiveLocale() ?? parseAkanI18nEnv().defaultLocale, key);

/** Capacitor camera/photos hook with permission checks and app-settings fallback. */
export const useCamera = ({ promptLabels = {} }: { promptLabels?: CameraPromptLabels } = {}) => {
  const [permissions, setPermissions] = useState<PermissionStatus>({ camera: "prompt", photos: "prompt" });

  /**
   * 최초로 킬 경우 권한은 prompt 상태이다.
   * prompt 상태일 경우 권한을 요청한다.
   * 권한이 denied 상태일 경우 설정으로 이동한다.
   * 이후 state의 permission을 업데이트해야한다.
   *
   */
  const checkPermission = async (type: "photos" | "camera" | "all") => {
    try {
      const { Camera } = await loadCapacitorCamera();
      if (type === "photos") {
        if (permissions.photos === "prompt") {
          const { photos } = await Camera.requestPermissions();
          setPermissions((prev) => ({ ...prev, photos }));
        } else if (permissions.photos === "denied") {
          location.assign("app-settings:");
          return;
        }
      } else if (type === "camera") {
        if (permissions.camera === "prompt") {
          const { camera } = await Camera.requestPermissions();
          setPermissions((prev) => ({ ...prev, camera }));
        } else if (permissions.camera === "denied") {
          location.assign("app-settings:");
          return;
        }
      } else {
        if (permissions.camera === "prompt" || permissions.photos === "prompt") {
          const permissions = await Camera.requestPermissions();
          setPermissions(permissions);
        } else if (permissions.camera === "denied" || permissions.photos === "denied") {
          location.assign("app-settings:");
          return;
        }
      }
    } catch {
      //
    }
  };

  const getPhoto = async (src: "prompt" | "camera" | "photos" = "prompt") => {
    const { Camera, CameraResultType, CameraSource } = await loadCapacitorCamera();
    const source =
      Device.getDevice().info.platform !== "web"
        ? src === "prompt"
          ? CameraSource.Prompt
          : src === "camera"
            ? CameraSource.Camera
            : CameraSource.Photos
        : CameraSource.Photos;
    const permission = src === "prompt" ? "all" : src === "camera" ? "camera" : "photos";
    await checkPermission(permission);
    try {
      const photo = await Camera.getPhoto({
        quality: 100,
        source,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        promptLabelHeader: promptLabel("base.cameraPromptHeader", promptLabels.header),
        promptLabelPhoto: promptLabel("base.cameraPromptPhoto", promptLabels.photo),
        promptLabelPicture: promptLabel("base.cameraPromptPicture", promptLabels.picture),
        promptLabelCancel: promptLabel("base.cameraPromptCancel", promptLabels.cancel),
      });
      return photo;
    } catch (e) {
      if (e === "User cancelled photos app") return;
    }
  };

  const pickImage = async () => {
    await checkPermission("photos");
    const { Camera } = await loadCapacitorCamera();
    const photo = await Camera.pickImages({
      quality: 90,
    });

    return photo;
  };

  useEffect(() => {
    void (async () => {
      if (isMobileDevice()) {
        const { Camera } = await loadCapacitorCamera();
        const permissions = await Camera.checkPermissions();
        setPermissions(permissions);
      }
    })();
  }, []);
  return { permissions, getPhoto, pickImage, checkPermission };
};
