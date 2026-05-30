import { Navbar } from "@/shared/components/layout/Navbar";
import { Footer } from "@/shared/components/layout/Footer";
import { StoreProvider } from "@/shared/lib/store-context";
import { StoreOverlays } from "@/shared/components/StoreOverlays";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <StoreOverlays />
    </StoreProvider>
  );
}
