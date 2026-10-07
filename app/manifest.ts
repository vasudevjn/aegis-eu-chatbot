import type { MetadataRoute } from "next";
import { AI_NAME, AI_DESCRIPTION, BROWSER_TAB_TITLE } from "@/config";

// Web app manifest (served at /manifest.webmanifest): lets phones and browsers
// install Aegis with its own name and icon. The chatbot is the installed app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BROWSER_TAB_TITLE,
    short_name: AI_NAME,
    description: AI_DESCRIPTION,
    start_url: "/chat",
    display: "standalone",
    background_color: "#fdfdfd",
    theme_color: "#192a58",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
