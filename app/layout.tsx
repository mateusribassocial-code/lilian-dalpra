import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CLIENT } from "@/lib/client.config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Painel ${CLIENT.name}`,
  description: `CRM e campanhas — ${CLIENT.name}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#EFEFEF] text-[#2A2A28] antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
