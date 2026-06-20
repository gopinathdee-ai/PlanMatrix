import type { Metadata } from "next";
import { Kodchasan, Roboto_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const kodchasan = Kodchasan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kodchasan",
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto-condensed",
});

export const metadata: Metadata = {
  title: "Floor Plan Management System",
  description: "Real floor plan-based cubicle management system",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${kodchasan.variable} ${robotoCondensed.variable}`}>
      <body>
        {children}
        <Toaster position="top-right" richColors expand={true} closeButton />
      </body>
    </html>
  );
}
