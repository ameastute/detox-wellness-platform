// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import SpecialistCard from '@/components/SpecialistCard';
import Hero from '@/components/Hero';
import ServicesPreview from '@/components/ServicesPreview';
import WhyChooseUs from '@/components/WhyChooseUs';
import Testimonials from '@/components/Testimonials';
import QuickContact from '@/components/QuickContact';

// ... (The Specialist type definition remains the same)
type Specialist = {
  id: string;
  name: string;
  credentials: string;
  experienceInYears: number;
};

export default function Home() {
  // ... (The useState and useEffect hooks for fetching specialists remain the same)
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/specialists');
        if (!response.ok) throw new Error('Data could not be fetched!');
        const data: Specialist[] = await response.json();
        setSpecialists(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpecialists();
  }, []);

  return (
    // The main tag is now in layout.tsx, so we can use a fragment <> here
    <>
      <Hero />
      <ServicesPreview />
      <WhyChooseUs />
      <Testimonials />
      <QuickContact />
      

      {/* Specialists Section */}
      <section className="w-full py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-center text-gray-800">
            Meet Our Specialists
          </h2>

          {isLoading && <p className="text-center text-gray-500">Loading...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {specialists.length > 0 ? (
                specialists.map((specialist) => (
                  <SpecialistCard
                    key={specialist.id}
                    name={specialist.name}
                    credentials={specialist.credentials}
                    experience={specialist.experienceInYears}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500">No specialists found.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}