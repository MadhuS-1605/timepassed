import { useEffect, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

const MaterialYou = registerPlugin("MaterialYou");

const EMPTY = { supported: false, primary: null };

export default function useMaterialYou() {
  const [colors, setColors] = useState(EMPTY);

  useEffect(() => {
    let cancelled = false;
    if (!Capacitor.isNativePlatform()) return;
    MaterialYou.getDynamicColors()
      .then((result) => {
        if (cancelled) return;
        setColors(result || EMPTY);
      })
      .catch((e) => {
        console.warn("MaterialYou.getDynamicColors failed", e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return colors;
}
