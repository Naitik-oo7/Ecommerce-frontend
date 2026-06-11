"use client";

import { useEffect } from "react";
import axiosInstance from "@/lib/axiosBaseQuery";

export function HealthPing() {
  useEffect(() => {
    const pingHealth = async () => {
      try {
        await axiosInstance.get("/health");
      } catch (error) {
        // Silently fail - no need to show errors for health ping
      }
    };

    // First ping immediately
    pingHealth();

    // Then ping every 10 minutes (600000 ms) to keep server awake
    const interval = setInterval(pingHealth, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
