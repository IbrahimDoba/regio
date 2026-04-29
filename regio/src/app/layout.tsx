import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { RealTimeProvider } from "@/context/RealTimeContext";
import { QueryProvider } from "@/lib/api/query-provider";
import { DialogProvider } from "@/context/DialogContext";

export const metadata: Metadata = {
  title: "REGIO",
  description: "Local exchange platform — community currency and time credits",
  icons: {
    icon: "/logo-S.png",
    apple: "/logo-S.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <RealTimeProvider>
              <LanguageProvider>
                <DialogProvider>
                  {children}
                </DialogProvider>
              </LanguageProvider>
            </RealTimeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
