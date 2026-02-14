import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

("./globals.css");

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains"
});

export const metadata: Metadata = {
  title: "Net Guard - Extension Security Dashboard",
  description:
    "Real-time browser extension security monitoring, threat analysis, and risk assessment dashboard."
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
