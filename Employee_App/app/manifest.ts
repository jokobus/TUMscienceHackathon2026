import type { MetadataRoute } from "next";

/**
 * PWA manifest — makes the Employee App installable to the home screen and
 * launchable full-screen (standalone) with the Würth-red theme.
 * Next.js serves this at /manifest.webmanifest and auto-links it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WEave · Würth Employee",
    short_name: "WEave",
    description:
      "On-site companion for Würth event teams — run events, capture signals, message attendees, view KPIs.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#CC0000",
    theme_color: "#CC0000",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
