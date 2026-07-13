import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import frappeui from 'frappe-ui/vite'

export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('ion-'),
        },
      },
    }),
    frappeui({
      lucideIcons: true,
      frontendRoute: '/oil-ops',
      buildConfig: {
        indexHtmlPath: path.resolve(__dirname, `../oil_distribution/www/oil-ops.html`),
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    emptyOutDir: true,
    target: 'es2015',
    commonjsOptions: {
      include: [/tailwind.config.js/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "frappe-ui": ["frappe-ui"],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "frappe-ui > feather-icons",
      "showdown",
      "tailwind.config.js",
    ],
  },
})
