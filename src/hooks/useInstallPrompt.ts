import { useEffect, useRef, useState } from "react";
import type { PWAInstallElement } from "@khmyznikov/pwa-install";

function isStandalone(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export function useInstallPrompt() {
  const [installed, setInstalled] = useState(isStandalone);
  const pwaInstallRef = useRef<PWAInstallElement | null>(null);

  useEffect(() => {
    const onInstalled = () => {
      setInstalled(true);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = () => {
    const el = pwaInstallRef.current ?? (document.querySelector("pwa-install") as PWAInstallElement | null);
    if (el) {
      el.showDialog(true);
    }
  };

  return { canInstall: !installed, install, installed, pwaInstallRef };
}
