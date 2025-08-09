// src/components/QuickContact.tsx
'use client';

import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const QuickContact = () => {
  return (
    <section className="w-full bg-white">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-16 md:py-24">
        {/* Map Section */}
        <div className="h-96 md:h-full w-full rounded-lg overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3907.6258833989353!2d75.19253507481585!3d12.14013913076804!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba46cf339a9636d%3A0x62ac395a3885a73!2sCheruvathur!5e0!3m2!1sen!2sin!4v1678886456789!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>

        {/* Contact Details Section */}
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-gray-800">Get In Touch</h2>
          <p className="text-gray-600">
            We are here to help you. Reach out to us for any queries or to book an appointment.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Our Address</h3>
                <p className="text-gray-600">Detox Wellness Clinic, Main Road, Cheruvathur, Kerala, India</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Call Us</h3>
                <p className="text-gray-600">+91 123 456 7890</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Email Us</h3>
                <p className="text-gray-600">contact@detoxwellness.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h3 className="font-semibold">Operating Hours</h3>
                <p className="text-gray-600">Mon - Sat: 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickContact;