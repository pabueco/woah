import { defineConfig, preview } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), basicSsl()],
  // preview: {
  //   open: true,
  //   https: true,
  // },
});
