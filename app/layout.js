import { EB_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "HTU Staff Welfare Scheme",
  description: "Official Welfare Scheme, contributions, claims, and emergency loan portal for Ho Technical University staff.",
  icons: {
    icon: "/htu_logo.jpg",
  },
};

import { Suspense } from "react";
import { WelfareProvider } from "@/lib/context/WelfareContext";

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-cream text-text flex flex-col">
        <Suspense fallback={null}>
          <WelfareProvider>
            {children}
          </WelfareProvider>
        </Suspense>
      </body>
    </html>
  );
}
