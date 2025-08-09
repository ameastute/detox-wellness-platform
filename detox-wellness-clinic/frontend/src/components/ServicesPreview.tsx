// src/components/ServicesPreview.tsx
'use client';

import { useState, useEffect } from "react";
import ServiceCard from "./ServiceCard";

type Service = {
  id: string;
  title: string;
  description: string;
  category: 'MIND' | 'BODY';
};

const ServicesPreview = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/services');
        const data = await res.json();
        setServices(data);
      } catch (error) {
        console.error("Failed to fetch services", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const mindServices = services.filter(s => s.category === 'MIND');
  const bodyServices = services.filter(s => s.category === 'BODY');

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold mb-2 text-center text-gray-800">Our Services</h2>
        <p className="text-lg text-gray-600 text-center mb-12">Holistic care for your mind and body.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Mind Services */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">Mind Services</h3>
            <div className="grid gap-6">
              {isLoading ? <p>Loading...</p> : mindServices.map(s => <ServiceCard key={s.id} {...s} />)}
            </div>
          </div>
          {/* Body Services */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">Body Services</h3>
            <div className="grid gap-6">
              {isLoading ? <p>Loading...</p> : bodyServices.map(s => <ServiceCard key={s.id} {...s} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;