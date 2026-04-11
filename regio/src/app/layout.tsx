import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REGIO",
  description: "Local exchange platform — community currency and time credits",
  icons: {
    icon: "/logo-S.png",
    apple: "/logo-S.png",
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { RealTimeProvider } from "@/context/RealTimeContext";
import { QueryProvider } from "@/lib/api/query-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#e0e0e0] min-h-screen font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <RealTimeProvider>
              <LanguageProvider>
                {children}
              </LanguageProvider>
            </RealTimeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
