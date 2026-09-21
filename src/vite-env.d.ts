/// <reference types="vite/client" />

declare const __KOMARI_APP_KIND__: "admin" | "theme";
declare const __KOMARI_BOOTSTRAP__: boolean;

declare const __BUILD_TIME__: string;

declare module "monaco-editor/editor/editor.api.js" {
  export * from "monaco-editor";
}
