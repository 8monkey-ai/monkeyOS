import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({ compiler: true, exclude: [/node_modules/, /src\/pages\/work-items\.tsx$/] }),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:3000", "/healthz": "http://127.0.0.1:3000" },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "supabase", test: /node_modules\/@supabase\//, priority: 30 },
            {
              name: "react",
              test: /node_modules\/(?:react|react-dom|react-router)\//,
              priority: 20,
            },
            { name: "vendor", test: /node_modules\//, priority: 1, maxSize: 450_000 },
          ],
        },
      },
    },
  },
});
