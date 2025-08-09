// src/components/Hero.tsx
'use client';

import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="w-full bg-green-50 py-20 md:py-32">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
          Complete Mind & Body Rehabilitation
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          Professional therapy services in Cheruvathur, Kerala. We are here to guide you on your journey to wellness.
        </p>
        <div className="mt-8">
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            Book Free Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;