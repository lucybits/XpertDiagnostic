import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const atkinsonHyperlegible = localFont({
  src: "../public/AtkinsonHyperlegible.ttf",
  variable: "--font-atkinson-hyperlegible",
  display: "swap",
});

export const metadata: Metadata = {
  title: "XpertDiagnostic",
  description: "Sistema experto para análisis médicos",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${atkinsonHyperlegible.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}