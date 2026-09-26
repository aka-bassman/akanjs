"use client";
import { useCallback } from "react";

const debounce = <Args extends unknown[], Return>(callback: (...args: Args) => Return, wait = 500) => {
  let timer: NodeJS.Timeout;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

export const useDebounce = <Args extends unknown[], Return>(
  callback: (...args: Args) => Return,
  states: unknown[] = [],
  wait = 100,
) => {
  const fn = useCallback(debounce(callback, wait), states);
  return fn;
};
