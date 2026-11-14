import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets us write `import x from "@/lib/options"` instead of "../../lib/options".
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
