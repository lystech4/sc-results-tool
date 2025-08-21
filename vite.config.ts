import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "antd/lib": "antd/es",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Permet d'importer les variables globales dans tous les fichiers scss
        additionalData: `
           @import "@/assets/styles/variables.scss";
           `,
      },
    },
  },
});
