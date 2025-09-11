import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";

// SEO
export const metadata: Metadata = {
  title: "Farewell POC",
  description: "Farewell POC with fhEVM",
};

// app/prefix.ts
export const prefix =
  process.env.NODE_ENV === "production" ? "/farewell" : "";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="farewell-bg text-foreground antialiased">
        {/* Background layer – no min-width */}
        <div className="fixed inset-0 w-full h-full farewell-bg z-[-20] pointer-events-none" />

        {/* Fluid container on mobile; constrain only by max-width */}
        <main className="flex flex-col w-full max-w-screen-lg mx-auto pb-20 px-4 sm:px-6">
          <nav className="flex w-full h-fit py-2 items-center">
            <Image
              src={`${prefix}/farewell-logo.png`}
              alt="Farewell Logo"
              width={120}
              height={120}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </nav>

          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
