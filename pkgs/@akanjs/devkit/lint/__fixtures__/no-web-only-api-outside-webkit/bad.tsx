export const share = (url: string) => navigator.share({ url }); // @warn
export const canShare = () => typeof navigator.canShare === "function"; // @warn
export const worker = () => navigator.serviceWorker.register("/sw.js"); // @warn
export const ask = () => Notification.requestPermission(); // @warn
export const permission = () => Notification.permission; // @warn
export const locate = () => navigator.geolocation.getCurrentPosition(() => undefined); // @warn
export const buzz = () => navigator.vibrate(50); // @warn
