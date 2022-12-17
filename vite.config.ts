import { defineConfig, preview } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Makes the service worker (used for notifications) not work on dev, so disabled for now.
    // basicSsl(),
    VitePWA({
      registerType: "autoUpdate",
      // devOptions: {
      //   enabled: true,
      // },
      includeAssets: [
        "favicon.ico",
        "logo-dark.svg",
        "logo-light.svg",
        "logo.svg",
        "logo-dark.png",
      ],
      manifest: {
        name: "woah!",
        short_name: "woah!",
        description: "A little app to help you stay hydrated.",
        theme_color: "#4338ca",
        background_color: "#18181b",
        icons: [
          {
            src: "logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "logo-dark.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        display: "standalone",
      },
    }),
  ],
  // preview: {
  //   open: true,
  //   https: true,
  // },
});
