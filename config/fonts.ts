import { Fira_Code as FontMono, Inter as FontSans } from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap", // Prevent layout shift during font loading
  preload: true,
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap", // Prevent layout shift during font loading
  preload: true,
});
