import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import PageTransition from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Diablos Rojos Fotografía Deportiva",
  description: "Galerías fotográficas de fútbol infantil - Diablos Rojos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
