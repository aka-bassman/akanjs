"use client";
import { Device } from "akanjs/client";
import { type CapacitorPermissionState, loadCapacitorContacts } from "akanjs/client/capacitor";
import { useEffect, useState } from "react";

type PermissionStatus = {
  contacts: CapacitorPermissionState;
};

/** `checkPermission` opens the app settings when contacts access is denied. */
export const useContact = () => {
  const [permissions, setPermissions] = useState<PermissionStatus>({ contacts: "prompt" });

  const checkPermission = async () => {
    try {
      const { Contacts } = await loadCapacitorContacts();
      if (permissions.contacts === "prompt") {
        const { contacts } = await Contacts.requestPermissions();
        setPermissions((prev) => ({ ...prev, contacts }));
      } else if (permissions.contacts === "denied") {
        location.assign("app-settings:");
        return;
      }
    } catch {
      //
    }
  };

  const getContacts = async () => {
    await checkPermission();
    const { Contacts } = await loadCapacitorContacts();
    const { contacts } = await Contacts.getContacts({ projection: { name: true, phones: true } });
    return contacts;
  };

  useEffect(() => {
    void (async () => {
      if (Device.getDevice().info.platform === "web") return;
      const { Contacts } = await loadCapacitorContacts();
      const permissions = await Contacts.checkPermissions();
      setPermissions(permissions);
    })();
  }, []);

  return { permissions, getContacts, checkPermission };
};
