// src/app/(admin)/layout.tsx
import { Inter } from "next/font/google";
import "../globals.css"; // We can still use the same global styles
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

// This is the root layout for the ENTIRE admin section.
// It ensures the admin panel has its own separate HTML structure,
// completely independent of the public website's layout.
export const metadata = {
  title: "Detox Clinic - Admin Panel",
  description: "Manage your clinic's operations.",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}