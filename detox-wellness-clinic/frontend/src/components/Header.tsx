// src/components/Header.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';

const Header = () => {
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Specialists', href: '/specialists' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <Link href="/">
          <Image src="/logo.png" alt="Detox Wellness Clinic Logo" width={150} height={50} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="text-gray-600 hover:text-green-600 transition-colors">
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Contact & CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a href="tel:+911234567890" className="flex items-center gap-2 text-gray-700">
            <Phone size={16} />
            <span>+91 123 456 7890</span>
          </a>
          <Button>Book Appointment</Button>
        </div>

        {/* Mobile Menu Button (we will make this functional later) */}
        <div className="md:hidden">
            <Button variant="outline" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;