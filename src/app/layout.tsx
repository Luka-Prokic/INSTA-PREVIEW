import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const bartle = localFont({
  src: "../fonts/bbh-bartle/BBHBartle-Regular.ttf",
  display: "swap",
  weight: "400",
  variable: "--font-bartle",
});

export const metadata: Metadata = {
  title: {
    default: "INSTA PREVIEW",
    template: "%s · INSTA PREVIEW",
  },
  description: "Preview how new posts and Reels will look on your Instagram profile before you publish.",
  applicationName: "INSTA PREVIEW",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bartle.variable} data-theme="light" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
