import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import Pages from "vite-plugin-pages";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
import type { Plugin, UserConfig } from "vite";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

function localKomariThemePlugin(): Plugin {
  const themeRequestPath = "/themes/default/komari-theme.json";
  const localThemeFile = path.resolve(__dirname, "komari-theme.json");

  return {
    name: "local-komari-theme",
    apply: "serve",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();

        const url = new URL(req.url, "http://localhost");
        if (!url.pathname.endsWith(themeRequestPath)) return next();

        fs.readFile(localThemeFile, (err, data) => {
          if (err) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(
              JSON.stringify({
                error: "Local theme file not found",
                file: localThemeFile,
              })
            );
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(data);
        });
      });
    },
  };
}

// Vite's dev server only knows how to fall back to the project's default
// `index.html` for unmatched navigations. The admin app is a second HTML
// entry (`admin.html`), so without this, typing a deep admin URL (or any
// full-page navigation under /admin, /terminal, /manage, /install,
// /database-recovery) in the browser during `vite --mode admin` incorrectly
// loads the public theme's index.html instead and 404s. Mirror the same
// path rules the Go backend uses in production to decide which HTML to serve.
function adminDevFallbackPlugin(): Plugin {
  const adminPathPrefixes = ["/admin", "/terminal", "/manage", "/database-recovery"];
  const adminExactPaths = new Set(["/install"]);
  const isAdminPath = (pathname: string) =>
    adminExactPaths.has(pathname) || adminPathPrefixes.some((p) => pathname.startsWith(p));

  return {
    name: "admin-dev-fallback",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || req.method !== "GET") return next();
        const accept = req.headers.accept || "";
        if (!accept.includes("text/html")) return next();

        const url = new URL(req.url, "http://localhost");
        if (path.extname(url.pathname) || url.pathname === "/admin/admin.html") return next();
        if (!isAdminPath(url.pathname)) return next();

        try {
          const htmlPath = path.resolve(__dirname, "admin.html");
          const rawHtml = fs.readFileSync(htmlPath, "utf-8");
          const html = await server.transformIndexHtml(url.pathname, rawHtml, req.originalUrl);
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(html);
        } catch (e) {
          next(e as Error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const isAdminApp = mode === "admin";
  const buildTime = new Date().toISOString();

  // Supports configuring BASE_URL via environment variables, defaulting to the root path.
  const base: string = isAdminApp ? "/admin/" : (process.env.VITE_BASE_URL ? process.env.VITE_BASE_URL : '/');
  const baseConfig: UserConfig = {
    base: base,
    plugins: [
      ...(isAdminApp ? [adminDevFallbackPlugin()] : [localKomariThemePlugin()]),
      react(),
      tailwindcss(),
      Pages({
        dirs: "src/pages",
        extensions: ["tsx", "jsx"],
      }),
      VitePWA({
        disable: isAdminApp,
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "assets/pwa-icon.webp"],
        manifest: {
          name: "Komari Monitor",
          short_name: "Komari Monitor",
          description: "A simple server monitor tool",
          theme_color: "#2563eb",
          background_color: "#ffffff",
          display: "standalone",
          scope: base,
          start_url: base,
          icons: [
            {
              src: "${base}assets/pwa-icon.webp",
              sizes: "192x192",
              type: "image/webp",
              purpose: "maskable any",
            },
            {
              src: "${base}assets/pwa-icon.webp",
              sizes: "512x512",
              type: "image/webp",
              purpose: "maskable any",
            },
          ],
        },
        workbox: {
          // HTML is rendered dynamically with theme, plugin, and site settings.
          // Cache only immutable assets so every navigation reaches the server.
          globPatterns: ["**/*.{js,css,ico,png,svg}"],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
      visualizer({
        open: false,
        filename: "bundle-analysis.html",
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    define: {
      __BUILD_TIME__: JSON.stringify(buildTime),
      __KOMARI_APP_KIND__: JSON.stringify(isAdminApp ? "admin" : "theme"),
      __KOMARI_BOOTSTRAP__: JSON.stringify(!isAdminApp),
    },
      resolve: {
        alias: [
          { find: "@", replacement: path.resolve(__dirname, "./src") },
          {
            find: /^monaco-editor-codicon\.css$/,
            replacement: path.resolve(
              __dirname,
              "node_modules/monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css",
            ),
          },
        // Force xterm to use the CJS build to avoid a rollup bug where `||=` in
        // xterm.mjs is incorrectly lowered to `void 0||(i={})` with an undeclared `i`,
        // causing `ReferenceError: i is not defined` at requestMode when vi sends DECRQM sequences.
        // Regex to match only the bare specifier, not subpaths like @xterm/xterm/css/xterm.css.
        { find: /^@xterm\/xterm$/, replacement: path.resolve(__dirname, "node_modules/@xterm/xterm/lib/xterm.js") },
      ],
    },
    build: {
      assetsDir: "assets",
      // Theme archives have always exposed their public entry as dist/index.html.
      // Keep that wire format stable; the built-in admin application lives below it.
      outDir: isAdminApp ? "dist/admin" : "dist",
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        input: isAdminApp ? "admin.html" : "index.html",
        output: {
          // go embed ignore files start with '_'
          chunkFileNames: "assets/chunk-[name]-[hash].js",
          entryFileNames: "assets/entry-[name]-[hash].js",
          // Do not use manualChunks, use React.lazy() and <Suspense> instead
        }
      },
    },
  };

  if (mode === "development" || mode === "admin") {
    const envPath = path.resolve(process.cwd(), ".env.development");
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      for (const k in envConfig) {
        process.env[k] = envConfig[k];
      }
    }
    if (!process.env.VITE_API_TARGET) {
      process.env.VITE_API_TARGET = "http://127.0.0.1:25774";
    }
    baseConfig.server = {
      proxy: {
        "/api": {
          target: process.env.VITE_API_TARGET,
          changeOrigin: true,
          rewriteWsOrigin: true,
          ws: true,
        },
        "/themes": {
          target: process.env.VITE_API_TARGET,
          changeOrigin: true,
        },
      },
    };
  }

  return baseConfig;
});
