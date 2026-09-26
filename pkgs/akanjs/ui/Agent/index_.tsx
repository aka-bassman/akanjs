"use client";
import { lazy } from "akanjs/webkit";

export const Chat = lazy(() => import("./Chat"), { ssr: false });
