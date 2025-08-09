// src/components/WhyChooseUs.tsx
'use client';

import { Award, Cpu, ClipboardList, Wifi, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Array to hold the feature data, making it easy to manage
const features = [
  {
    icon: <Award className="w-10 h-10 text-green-600" />,
    title: 'Expert Qualified Specialists',
    description: 'Our team consists of certified and experienced professionals dedicated to your well-being.',
  },
  {
    icon: <Cpu className="w-10 h-10 text-green-600" />,
    title: 'Modern Equipment & Techniques',
    description: 'We use state-of-the-art equipment and evidence-based methods for effective treatment.',
  },
  {
    icon: <ClipboardList className="w-10 h-10 text-green-600" />,
    title: 'Personalized Treatment Plans',
    description: 'Every treatment plan is tailored to your unique needs and personal health goals.',
  },
  {
    icon: <Wifi className="w-10 h-10 text-green-600" />,
    title: 'Flexible Consultations',
    description: 'Choose from convenient online or in-person consultations to fit your lifestyle.',
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-green-600" />,
    title: 'Insurance Acceptance',
    description: 'We work with various insurance providers to make our services accessible.',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="w-full py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800">Why Choose Us?</h2>
          <p className="text-lg text-gray-600 mt-2">
            Your partner in comprehensive mind and body wellness.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="text-center items-center p-6 border-none shadow-lg hover:-translate-y-2 transition-transform duration-300">
              <CardHeader className="items-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="pt-2">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
          {/* This is a little trick to center the last item on a 3-column grid */}
          <div className="hidden lg:block"></div> 
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;