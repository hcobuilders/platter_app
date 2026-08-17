import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CsiPalette } from "@/components/CsiPalette";

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
    // blocking manual translation (still available via right-click).
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
      </body>
    </html>
  );
}
