// src/app/(admin)/admin/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, Calendar, Users, LogOut } from 'lucide-react';
import { toast } from 'sonner';

// Custom hook for idle timeout
const useIdleTimeout = (timeout: number, onIdle: () => void) => {
    const timeoutId = useRef<NodeJS.Timeout>();
    const router = useRouter();

    const resetTimer = useCallback(() => {
        if (timeoutId.current) clearTimeout(timeoutId.current);
        const token = localStorage.getItem('authToken');
        if (token) { // Only set timer if user is logged in
            timeoutId.current = setTimeout(onIdle, timeout);
        }
    }, [onIdle, timeout]);

    useEffect(() => {
        const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'scroll', 'click'];
        const handleEvent = () => resetTimer();

        events.forEach(event => window.addEventListener(event, handleEvent));
        resetTimer(); // Start the timer initially

        return () => {
            if (timeoutId.current) clearTimeout(timeoutId.current);
            events.forEach(event => window.removeEventListener(event, handleEvent));
        };
    }, [resetTimer, router]);
};

const ProtectedAdminView = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const handleLogout = useCallback((message = "You have been logged out.") => {
    localStorage.removeItem('authToken');
    router.push('/admin/login');
    toast.info(message);
  }, [router]);

  // Set timeout to 15 minutes (900000 milliseconds)
  useIdleTimeout(900000, () => handleLogout("You have been logged out due to inactivity."));

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <h1 className="text-2xl font-bold text-green-600 mb-8">Admin Panel</h1>
        <nav className="flex flex-col space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"><LayoutDashboard size={20} /> Dashboard</Link>
          <Link href="/admin/appointments" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"><Calendar size={20} /> Appointments</Link>
          <Link href="/admin/practitioners" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"><Users size={20} /> Practitioners</Link>
        </nav>
        <button onClick={() => handleLogout()} className="mt-auto flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-red-500">
          <LogOut size={20} /> Logout
        </button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  return <ProtectedAdminView>{children}</ProtectedAdminView>;
}
