import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cartoon Video Agent",
  description:
    "Generate and publish stylized cartoon videos to all your social media channels with a single click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
