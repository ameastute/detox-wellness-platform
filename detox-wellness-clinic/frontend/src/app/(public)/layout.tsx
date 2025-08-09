// src/app/(admin)/layout.tsx
import { Inter } from "next/font/google";
import "../globals.css"; // We still use the same global styles
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Detox Clinic - Admin Panel",
  description: "Manage your clinic's operations.",
};

// This is the root layout for the ENTIRE admin section.
// It ensures the admin panel has its own separate HTML structure.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${inter.className} bg-gray-100`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}