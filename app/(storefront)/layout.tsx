import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StoreProvider } from "@/lib/store-context";
import { StoreOverlays } from "@/components/shared/StoreOverlays";

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
