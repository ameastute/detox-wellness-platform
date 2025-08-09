// src/app/contact/page.tsx
'use client';

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Import toast from sonner
import { MapPin, Phone, Mail } from 'lucide-react';

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // In a real application, you would handle form submission here,
    // e.g., send the data to your backend API which then uses a service
    // like Resend (from your docs) to send an email.

    // For now, we'll just simulate a successful submission.
    setTimeout(() => {
      setIsSubmitting(false);
      // Use the new sonner toast function
      toast.success("Message Sent!", {
        description: "Thank you for contacting us. We will get back to you shortly.",
      });
      // Here you would also clear the form fields
      (event.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="bg-green-50 py-16 text-center">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Contact Us</h1>
          <p className="text-lg text-gray-600 mt-4">We're here to help. Let's connect.</p>
        </div>
      </section>

      {/* Contact Form and Details Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-gray-50 p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" required />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" required />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" type="text" placeholder="Regarding my appointment" required />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Your message here..." required rows={5} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">Our Contact Information</h2>
            <p className="text-gray-600">
              Have a question or need to book an appointment? Feel free to reach out to us through any of the methods below.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Our Address</h3>
                  <p className="text-gray-600">Detox Wellness Clinic, Main Road, Cheruvathur, Kerala, India</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Call Us</h3>
                  <p className="text-gray-600">+91 123 456 7890</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Email Us</h3>
                  <p className="text-gray-600">contact@detoxwellness.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;