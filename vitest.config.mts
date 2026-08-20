import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the "@/*" alias straight from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    // Pure logic only for now — curriculum rules, pinyin, step generation.
    // Add `environment: "jsdom"` when the first component test needs a DOM.
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "dist-portable/**"],
  },
});
