// src/app/specialists/page.tsx
'use client';

import { useState, useEffect } from 'react';
import SpecialistCard from '@/components/SpecialistCard'; // We can reuse our existing component!

// Define the type for our Specialist data
type Specialist = {
  id: string;
  name: string;
  credentials: string;
  experienceInYears: number;
};

const SpecialistsPage = () => {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We are fetching from the same endpoint we created in Part 4
    const fetchSpecialists = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/specialists');
        if (!response.ok) {
          throw new Error('Failed to fetch specialists. Please try again later.');
        }
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
    <div className="bg-white">
      {/* Page Header */}
      <section className="bg-green-50 py-16 text-center">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Meet Our Team</h1>
          <p className="text-lg text-gray-600 mt-4">Dedicated professionals committed to your health and recovery.</p>
        </div>
      </section>

      {/* Specialists Grid Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto">
          {isLoading && <p className="text-center text-gray-500">Loading specialists...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
    </div>
  );
};

export default SpecialistsPage;