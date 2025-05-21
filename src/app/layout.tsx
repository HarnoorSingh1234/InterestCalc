import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner"; // Using the Shadcn wrapper for Sonner

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HS Traders - Invoice & Interest Calculation",
  description: "deals in all types of yarn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Layout>{children}</Layout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}