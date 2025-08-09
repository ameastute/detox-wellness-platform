// src/app/about/page.tsx
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="bg-white">
      {/* Page Header Section */}
      <section className="bg-green-50 py-16 text-center">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">About Detox Wellness Clinic</h1>
          <p className="text-lg text-gray-600 mt-4">Our Journey, Our Mission, Our Commitment to You</p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded with a vision to provide integrated and compassionate care, Detox Wellness Clinic began as a small practice with a big mission: to treat the mind and body as one. Our founder, driven by a passion for holistic healing, established this clinic to create a safe space where individuals can find expert guidance and support on their path to recovery and wellness.
            </p>
            <p className="text-gray-600">
              Over the years, we have grown into a leading rehabilitation center in Kerala, marked by countless success stories and a commitment to evidence-based practices.
            </p>
          </div>
          <div>
            <Image
              src="https://placehold.co/600x400/a7f3d0/1f2937?text=Our+Clinic"
              alt="Clinic Founder"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-12">Our Approach to Healing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Holistic Philosophy</h3>
              <p className="text-gray-600">We believe in treating the whole person, not just the symptoms. Our approach integrates mental and physical therapies for comprehensive care.</p>
            </div>
            <div className="p-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Evidence-Based Methods</h3>
              <p className="text-gray-600">All our treatment plans are rooted in scientific research and proven therapeutic techniques to ensure the best possible outcomes.</p>
            </div>
            <div className="p-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Patient-Centered Care</h3>
              <p className="text-gray-600">You are at the heart of everything we do. We listen to your needs and collaborate with you to create a personalized recovery journey.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Facility Tour Section (Placeholder) */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Tour Our Facility</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Image src="https://placehold.co/600x400/e2e8f0/475569?text=Treatment+Room" alt="Facility Image 1" width={600} height={400} className="rounded-lg shadow-md"/>
              <Image src="https://placehold.co/600x400/e2e8f0/475569?text=Reception" alt="Facility Image 2" width={600} height={400} className="rounded-lg shadow-md"/>
              <Image src="https://placehold.co/600x400/e2e8f0/475569?text=Gym" alt="Facility Image 3" width={600} height={400} className="rounded-lg shadow-md"/>
              <Image src="https://placehold.co/600x400/e2e8f0/475569?text=Garden" alt="Facility Image 4" width={600} height={400} className="rounded-lg shadow-md"/>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;