import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/jasleen-wishlist/", // MUST match repo name for GitHub Pages
});
