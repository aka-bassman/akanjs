"use client";
import { createContext, useContext } from "react";
import { AgenticSurface } from "./AgenticSurface";

export const SurfaceContext = createContext<AgenticSurface | null>(null);
export const ScopeContext = createContext<string[]>([]);

export const useSurface = () => useContext(SurfaceContext) ?? AgenticSurface.shared;
export const useScopePath = () => useContext(ScopeContext);
