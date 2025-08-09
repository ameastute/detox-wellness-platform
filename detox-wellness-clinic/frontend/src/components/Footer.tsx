// src/components/Footer.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <Image src="/logo.png" alt="Detox Wellness Clinic Logo" width={180} height={60} className="bg-white p-2 rounded-md"/>
            <p className="mt-4 text-gray-400">
              Your trusted partner for complete mind and body rehabilitation. We provide personalized care to help you achieve optimal wellness.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
              <li><Link href="/services" className="hover:text-green-400 transition-colors">Services</Link></li>
              <li><Link href="/specialists" className="hover:text-green-400 transition-colors">Specialists</Link></li>
              <li><Link href="/contact" className="hover:text-green-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold text-lg mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-green-400 transition-colors"><Facebook /></a>
              <a href="#" className="hover:text-green-400 transition-colors"><Instagram /></a>
              <a href="#" className="hover:text-green-400 transition-colors"><Youtube /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Detox Wellness Clinic. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
