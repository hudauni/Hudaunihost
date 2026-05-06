"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export default function CapacitorAppListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const handleBackButton = () => {
        // Paths where pressing back should exit the app instead of navigating back
        const exitPaths = ['/', '/login'];
        
        if (exitPaths.includes(pathname)) {
          CapacitorApp.exitApp();
        } else {
          router.back();
        }
      };

      const backButtonListener = CapacitorApp.addListener('backButton', handleBackButton);

      return () => {
        backButtonListener.then(listener => listener.remove());
      };
    }
  }, [router, pathname]);

  return null;
}
