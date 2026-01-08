import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- UPDATE METADATA DI SINI ---
export const metadata: Metadata = {
  title: "ChainVote - E-Voting Blockchain Aman",
  description: "Platform pemilihan digital berbasis Blockchain yang jujur, transparan, dan anti-manipulasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Mengubah lang="en" menjadi "id" (Indonesia)
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Konfigurasi Notifikasi Sonner */}
        <Toaster position="top-center" richColors closeButton theme="dark" />
      </body>
    </html>
  );
}