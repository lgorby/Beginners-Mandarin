import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "你好 Mandarin — Learn Mandarin from Zero",
  description:
    "A beginner Mandarin course with tones, pronunciation practice, a talking dictionary, and character writing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/*
        h-dvh, not min-h-full: the viewport is a hard ceiling, so every
        route lays itself out inside a known height instead of growing
        the page. dvh rather than vh because mobile browser chrome makes
        vh overflow. overflow-hidden means nothing scrolls the PAGE —
        each route owns an explicit inner scroll region for the content
        that genuinely cannot be bounded (a results list, a lesson map).
      */}
      <body className="flex h-dvh flex-col overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
