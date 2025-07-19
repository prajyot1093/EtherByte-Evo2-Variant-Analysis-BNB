import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Web3Providers } from "~/components/providers/web3-providers";
import { ClientOnly } from "~/components/client-only";

export const metadata: Metadata = {
  title: "Evo2 Variant Analysis - BNB Chain",
  description: "AI-powered genomic analysis with NFT minting on BNB Smart Chain",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <ClientOnly fallback={<div>Loading...</div>}>
          <Web3Providers>
            {children}
          </Web3Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
