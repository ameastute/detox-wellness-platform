// src/app/services/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, HeartPulse } from 'lucide-react';

// Define the type for our Service data
type Service = {
  id: string;
  title: string;
  description: string;
  category: 'MIND' | 'BODY';
};

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services. Please try again later.');
        }
        const data: Service[] = await response.json();
        setServices(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const mindServices = services.filter(s => s.category === 'MIND');
  const bodyServices = services.filter(s => s.category === 'BODY');

  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="bg-green-50 py-16 text-center">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Our Services</h1>
          <p className="text-lg text-gray-600 mt-4">Comprehensive care tailored to your individual needs.</p>
        </div>
      </section>

      {/* Services Tabs Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto">
          <Tabs defaultValue="mind" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="mind">Mind Services</TabsTrigger>
              <TabsTrigger value="body">Body Services</TabsTrigger>
            </TabsList>

            {/* Mind Services Content */}
            <TabsContent value="mind" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  mindServices.map(service => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <Brain className="w-10 h-10 text-green-600 mb-4" />
                        <CardTitle>{service.title}</CardTitle>
                        <CardDescription className="pt-2">{service.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Body Services Content */}
            <TabsContent value="body" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : (
                  bodyServices.map(service => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <HeartPulse className="w-10 h-10 text-green-600 mb-4" />
                        <CardTitle>{service.title}</CardTitle>
                        <CardDescription className="pt-2">{service.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
