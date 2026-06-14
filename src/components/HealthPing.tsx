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

    // Then ping every 8 minutes (480000 ms) to keep server awake
    // Render's free tier has ~15 min inactivity timeout, so 8 min ensures we stay active
    const interval = setInterval(pingHealth, 8 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
