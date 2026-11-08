import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ARIF AL BAROKA — Info Penjualan Pupuk Bersubsidi",
  description:
    "Sistem informasi penjualan pupuk bersubsidi Kios Pengecer ARIF AL BAROKA. Data petani, kuota pupuk, dan rekapitulasi musim tanam.",
   icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  keywords: [
    "pupuk bersubsidi",
    "ARIF AL BAROKA",
    "kios pengecer",
    "petani",
    "kuota pupuk",
  ],
  authors: [{ name: "ARIF AL BAROKA" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
