import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExcelGen — Excel Template Generator",
  description: "Generate customised, professional Excel templates for finance, project management, consulting, and Azure. Download ready-to-use .xlsx files.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
