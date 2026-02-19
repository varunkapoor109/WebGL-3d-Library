import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebGL Animation Library",
  description: "A showcase of WebGL animations built with Three.js and React Three Fiber",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
