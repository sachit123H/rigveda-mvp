import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Node environment — tests run in Node (not jsdom) since we're testing
    // server-side loaders, API route handlers, and data pipeline logic.
    // Component tests (if added) should use the `@vitest/browser` plugin instead.
    environment: "node",
    // Root for test discovery
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Setup file to configure global test utilities (none yet, ready to extend)
    // setupFiles: ["tests/setup.ts"],
    // Coverage (via @vitest/coverage-v8)
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**", "app/api/**", "scripts/**"],
      exclude: ["node_modules", ".next", "prisma"],
    },
    // Suppress verbose output in CI
    reporters: process.env.CI ? ["verbose"] : ["default"],
  },
  resolve: {
    alias: {
      // Mirror tsconfig.json paths so `@/lib/...` resolves in tests
      "@": path.resolve(__dirname, "."),
    },
  },
});
