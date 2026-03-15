// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import customErrorOverlayPlugin from "./vite-error-overlay-plugin.js";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [
    {
      name: "framewire",
      hooks: {
        "astro:config:setup": ({ injectScript, command }) => {
          if (command === "dev") {
            injectScript(
              "page",
              `import loadFramewire from "framewire.js";
              loadFramewire(true);`
            );
          }
        },
      },
    },
    tailwind(),
    react(),
  ],
  vite: {
    plugins: [customErrorOverlayPlugin()],
    cacheDir: 'node_modules/.cache/.vite',
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'zustand',
        'framer-motion',
        'date-fns',
        'clsx',
        'class-variance-authority',
        'tailwind-merge',
        '@radix-ui/*',
        'zod',
      ],
    },
  },
  devToolbar: {
    enabled: false,
  },
  image: {
    domains: ["static.wixstatic.com"],
  },
  server: {
    allowedHosts: true,
    host: true,
  },
  security: {
    checkOrigin: false
  }
});
