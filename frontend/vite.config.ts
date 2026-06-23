// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const staticBuild = process.env.STATIC_BUILD === "true";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Docker serves the production frontend through FastAPI, so generate one
    // client-side application shell and let Python handle route fallbacks.
    ...(staticBuild
      ? {
          spa: {
            enabled: true,
            prerender: { outputPath: "/index" },
          },
        }
      : {}),
  },
  // When NITRO_PRESET is set (e.g. in Docker), force Nitro to run with that preset.
  // Without this, Nitro is skipped in non-Lovable environments.
  nitro: staticBuild
    ? false
    : process.env.NITRO_PRESET
      ? { preset: process.env.NITRO_PRESET }
      : undefined,
});
