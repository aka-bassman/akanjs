"use client";
import { loadCapacitorGeolocation } from "akanjs/client/capacitor";

/** `getPosition` opens the app settings instead of resolving when location permission is denied. */
export const useGeoLocation = () => {
  const checkPermission = async (): Promise<{ geolocation: string; coarseLocation: string }> => {
    const { Geolocation } = await loadCapacitorGeolocation();
    const { location: geolocation, coarseLocation } = await Geolocation.requestPermissions();
    return { geolocation, coarseLocation };
  };

  const getPosition = async () => {
    const { geolocation, coarseLocation } = await checkPermission();
    if (geolocation === "denied" || coarseLocation === "denied") {
      location.assign("app-settings:");
      return;
    }
    const { Geolocation } = await loadCapacitorGeolocation();
    const coordinates = await Geolocation.getCurrentPosition();
    return coordinates;
  };

  return { checkPermission, getPosition };
};
