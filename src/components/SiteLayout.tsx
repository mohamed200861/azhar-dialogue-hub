import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ResponsiveAd } from "./ResponsiveAd";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <ResponsiveAd />
      <Footer />
    </div>
  );
}
