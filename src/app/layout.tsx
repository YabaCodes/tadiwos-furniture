import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tadiwos Furniture and Woodwork",
    template: "%s | Tadiwos Furniture and Woodwork",
  },
  description:
    "Made-to-order furniture and woodwork for homes, offices and organizations in Debre Birhan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
