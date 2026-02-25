import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Springfield Command Center",
  description: "Task management for the Simpson family",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Share+Tech+Mono&family=Special+Elite&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen relative">
        {children}
      </body>
    </html>
  );
}
