import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { WardrobeProvider } from "@/contexts/WardrobeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { HeaderProvider } from "@/contexts/HeaderContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

import ConditionalHeader from "@/components/layout/ConditionalHeader";
import AuthGate from "@/components/auth/AuthGate";
import ErrorBoundary from "@/components/common/ErrorBoundary";

import ToasterProvider from "@/components/common/ToasterProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "YEAHLO - Premium Fashion E-commerce",
  description: "Shop the latest fashion trends at YEAHLO",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <AuthProvider>
            <ProductsProvider>
              <CategoriesProvider>
                <CartProvider>
                  <WishlistProvider>
                    <WardrobeProvider>
                      <SearchProvider>
                        <HeaderProvider>
                          <NotificationProvider>

                        {/* Header always renders */}
                        <ConditionalHeader />

                      {/* Page content always renders */}
                      <main
                        id="page-content"
                        style={{
                          backgroundColor: "white",
                          minHeight: "100vh",
                        }}
                      >
                        {children}
                      </main>

                      {/* Login modal overlays on top */}
                      <AuthGate />

                      {/* Global toaster with close button */}
                      <ToasterProvider />

                          </NotificationProvider>
                        </HeaderProvider>
                      </SearchProvider>
                    </WardrobeProvider>
                  </WishlistProvider>
                </CartProvider>
              </CategoriesProvider>
            </ProductsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
