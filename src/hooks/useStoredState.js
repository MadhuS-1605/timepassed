import { useEffect, useState } from "react";

export default function useStoredState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) {
        return typeof initial === "function" ? initial() : initial;
      }
      return JSON.parse(saved);
    } catch {
      return typeof initial === "function" ? initial() : initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`useStoredState: failed to persist key "${key}"`, e);
    }
  }, [key, value]);

  return [value, setValue];
}
