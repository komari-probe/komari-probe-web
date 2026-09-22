import { LiveDataProvider } from "../state/LiveDataContext";
import Footer from "./Footer";
import NavBar from "./NavBar";
import { Outlet } from "react-router-dom";
import { usePublicInfo } from "@/shared/contexts/PublicInfoContext";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { AccountProvider } from "@/shared/auth/AccountContext";

const PublicLayoutContent = () => {
  const { publicInfo } = usePublicInfo();
  const isMobile = useIsMobile();
  const bgUrlDesktop = publicInfo?.theme_settings?.backgroundImageUrlDesktop;
  const bgUrlMobile = publicInfo?.theme_settings?.backgroundImageUrlMobile;
  const bgUrl = isMobile ? bgUrlMobile || bgUrlDesktop : bgUrlDesktop;
  const mainContentWidth =
    publicInfo?.theme_settings?.mainContentWidth ?? 100;
  return (
    <div
      className={
        bgUrl
          ? "km-layout layout flex flex-col w-full min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
          : "km-layout layout flex flex-col w-full min-h-screen bg-accent-1"
      }
      style={{
        backgroundImage: bgUrl ? `url(${bgUrl})` : "none",
      }}
    >
      <main
        className="km-main main-content m-1 h-full"
        style={{
          width: `${mainContentWidth}vw`,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <NavBar />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const IndexLayout = () => (
  <AccountProvider>
    <LiveDataProvider>
      <PublicLayoutContent />
    </LiveDataProvider>
  </AccountProvider>
);

export default IndexLayout;
