import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// React Router already owns JSX and Fast Refresh. Select only the official plugin's Oxc compiler
// transform until React Router exposes a first-class compiler hook.
const reactCompiler = react({ compiler: true }).find(
  (plugin) => plugin.name === "vite:react-compiler",
);
if (!reactCompiler) throw new Error("The Vite Oxc React Compiler plugin is unavailable");

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), reactCompiler],
  resolve: { tsconfigPaths: true },
});
