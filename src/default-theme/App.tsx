import { Suspense, useEffect, useMemo } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import {
  ThemeContext,
  THEME_DEFAULTS,
  type Appearance,
  type Colors,
} from "@/shared/contexts/ThemeContext";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { useSystemTheme } from "@/shared/hooks/useSystemTheme";
import Loading from "@/shared/components/loading";
import { PublicInfoProvider } from "@/shared/contexts/PublicInfoContext";
import { PWAInstallPrompt } from "./features/pwa/PWAInstallPrompt";
import { PWAUpdatePrompt } from "./features/pwa/PWAUpdatePrompt";
import { OfflineIndicator } from "./features/pwa/OfflineIndicator";
import { Toaster } from "@/shared/ui/sonner";
import { RPC2Provider } from "@/shared/contexts/RPC2Context";
import { NodeListProvider } from "@/shared/contexts/NodeListContext";
import { useTemporaryShareKey } from "@/shared/auth/useTemporaryShareKey";
import { themeRoutes } from "./routes";

function DefaultThemeContent() {
  useTemporaryShareKey();
  const [appearance, setAppearance] = useLocalStorage<Appearance>("appearance", THEME_DEFAULTS.appearance);
  const [color, setColor] = useLocalStorage<Colors>("color", THEME_DEFAULTS.color);
  const resolvedAppearance = useSystemTheme(appearance);
  const routing = useRoutes(themeRoutes);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedAppearance === "dark");
  }, [resolvedAppearance]);

  const themeContextValue = useMemo(
    () => ({ appearance, setAppearance, color, setColor }),
    [appearance, setAppearance, color, setColor],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <Theme appearance={resolvedAppearance} accentColor={color} scaling="110%" className="theme-root" style={{ backgroundColor: "transparent", minHeight: "100vh" }}>
        <RPC2Provider>
          <PublicInfoProvider>
            <NodeListProvider>
              <Toaster />
              <OfflineIndicator />
              {routing}
              <PWAInstallPrompt />
              <PWAUpdatePrompt />
            </NodeListProvider>
          </PublicInfoProvider>
        </RPC2Provider>
      </Theme>
    </ThemeContext.Provider>
  );
}

export function DefaultThemeApp() {
  return <BrowserRouter><Suspense fallback={<Loading />}><DefaultThemeContent /></Suspense></BrowserRouter>;
}
