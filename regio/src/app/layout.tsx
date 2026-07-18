import type { Metadata } from "next";
import { Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto-condensed",
  display: "swap",
});
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { RealTimeProvider } from "@/context/RealTimeContext";
import { QueryProvider } from "@/lib/api/query-provider";
import { DialogProvider } from "@/context/DialogContext";
import { ToastProvider } from "@/context/ToastContext";

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
    <html lang="en" className={`${roboto.variable} ${robotoCondensed.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <RealTimeProvider>
              <LanguageProvider>
                <DialogProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </DialogProvider>
              </LanguageProvider>
            </RealTimeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
