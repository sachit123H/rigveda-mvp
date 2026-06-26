import type { Metadata } from "next";
import { Inter, Crimson_Pro, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import Chatbot from "./components/Chatbot";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
});

const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-deva",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Digital Library of Indic Intellectual History (DLIIH)",
  description: "A premium open-access platform for philological and textual exploration of the Rigveda Samhita and early Indic texts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable} ${notoDeva.variable}`} suppressHydrationWarning>
      <body className="bg-[#fbfbf9] text-[#1c1917] font-sans antialiased" suppressHydrationWarning>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
