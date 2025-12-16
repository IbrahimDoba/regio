import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regio App",
  description: "Regio App Prototype",
};

import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "@/lib/api/query-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#e0e0e0] flex justify-center min-h-screen font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
