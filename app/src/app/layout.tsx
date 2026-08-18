import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CsiPalette } from "@/components/CsiPalette";
import { SuppressContextMenu } from "@/components/SuppressContextMenu";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Platter",
  description: "Preconstruction command center for LEMA.",
  other: {
    // Data-dense pages (CSI codes, chip abbreviations, mono figures) throw
    // off Chrome's language auto-detection enough to trigger an unprompted
    // translate offer. This suppresses that automatic prompt without
    // blocking manual translation — reachable via the omnibox translate
    // icon, unaffected by SuppressContextMenu's app-wide right-click
    // suppression (S-notes v135a475) even though the right-click path is
    // gone now.
    google: "notranslate",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CsiPalette />
        <SuppressContextMenu />
      </body>
    </html>
  );
}
