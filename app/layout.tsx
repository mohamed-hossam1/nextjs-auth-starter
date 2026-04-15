import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { StateProvider } from "@/providers/state-provider";
import QueryProvider from "@/providers/query-provider";
import { DM_Serif_Display, DM_Serif_Text, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";

const serifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif-display",
});

const serifText = DM_Serif_Text({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif-body",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL!),
  title: {
    template: "%s | mocode",
    default: "mocode",
  },
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${serifDisplay.variable} ${serifText.variable} ${mono.variable}`}
    >
      <body>
        <QueryProvider>
          <StateProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </StateProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
