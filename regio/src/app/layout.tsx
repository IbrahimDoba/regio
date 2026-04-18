import type { Metadata } from "next";
import { Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { RealTimeProvider } from "@/context/RealTimeContext";
import { QueryProvider } from "@/lib/api/query-provider";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-roboto-condensed",
  display: "swap",
});

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
      <body className={`${roboto.variable} ${robotoCondensed.variable} min-h-screen font-sans antialiased`}>
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
