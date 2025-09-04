import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Farewell POC",
  description: "Farewell POC with FHEVM",
};

// app/prefix.ts
export const prefix =
  process.env.NODE_ENV === "production" ? "/farewell-react" : "";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`farewell-bg text-foreground antialiased`}>
        <div className="fixed inset-0 w-full h-full farewell-bg z-[-20] min-w-[850px]"></div>
        <main className="flex flex-col max-w-screen-lg mx-auto pb-20 min-w-[850px]">
          <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center">
            <Image
              src={`${prefix}/farewell-logo.png`}
              alt="Farewell Logo"
              width={120}
              height={120}
            />
          </nav>
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
