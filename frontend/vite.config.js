import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
import Icons from "unplugin-icons/vite"

export default defineConfig({
  plugins: [
    vue(),
    Icons({ compiler: "vue3" }),
  ],
  base: "/assets/oil_distribution/frontend/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "../oil_distribution/public/frontend",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
})
