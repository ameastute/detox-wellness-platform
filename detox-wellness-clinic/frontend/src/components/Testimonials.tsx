// src/components/Testimonials.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from 'lucide-react';

type Testimonial = {
  id: string;
  patientName: string;
  story: string;
  rating: number;
};

// A helper component to render the star ratings
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-1">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/testimonials');
        const data = await res.json();
        setTestimonials(data);
      } catch (error) {
        console.error("Failed to fetch testimonials", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">Success Stories from Our Patients</h2>
          <p className="text-lg text-gray-600 mt-2">
            Real stories, real results.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center">Loading testimonials...</p>
        ) : (
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3 p-4">
                  <Card className="h-full flex flex-col">
                    <CardContent className="flex flex-col items-start justify-between p-6 flex-grow">
                      <StarRating rating={testimonial.rating} />
                      <p className="text-gray-700 my-4 flex-grow">"{testimonial.story}"</p>
                      <p className="font-bold text-gray-900 self-end">- {testimonial.patientName}</p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
