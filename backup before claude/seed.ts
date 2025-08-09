// prisma/seed.ts
import { PrismaClient, ServiceCategory, ConsultationType, Title, PractitionerRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clear data in reverse dependency order to avoid errors
  await prisma.appointment.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.program.deleteMany();
  // The problematic line has been removed. We will now delete practitioners and services directly.
  await prisma.practitioner.deleteMany();
  await prisma.service.deleteMany();
  await prisma.testimonial.deleteMany();
  console.log('Cleared existing data.');

  // --- Seed Admin User ---
  const adminPassword = await bcrypt.hash('password123', 10);
  await prisma.admin.create({
    data: { email: 'admin@detox.com', name: 'Default Admin', password: adminPassword },
  });
  console.log('Seeded admin user.');

  // --- Seed Services ---
  const counseling = await prisma.service.create({ data: { title: 'Mental Health Counseling', description: 'For depression, anxiety, etc.', category: ServiceCategory.MIND }});
  const childTherapy = await prisma.service.create({ data: { title: 'Child & Adolescent Therapy', description: 'For behavioral issues.', category: ServiceCategory.MIND }});
  const neuroRehab = await prisma.service.create({ data: { title: 'Neurological Rehabilitation', description: 'For stroke, brain injuries.', category: ServiceCategory.BODY }});
  const orthoTherapy = await prisma.service.create({ data: { title: 'Orthopedic Therapy', description: 'For joint pain, sports injuries.', category: ServiceCategory.BODY }});
  console.log('Seeded services.');

  // --- Seed Practitioners ---
  const practitionerPassword = await bcrypt.hash('practitioner123', 10);
  await prisma.practitioner.create({
    data: {
      slug: 'dr-anjali-sharma',
      title: Title.DR,
      name: 'Anjali Sharma',
      email: 'anjali@detox.com',
      password: practitionerPassword,
      role: PractitionerRole.DOCTOR,
      contactPrimary: '+919876543210',
      credentials: 'MBBS, MD (Psychiatry)',
      education: 'MD in Psychiatry from NIMHANS, Bangalore',
      certifications: ['Indian Psychiatric Society Certified'],
      experienceInYears: 12,
      bio: 'Dr. Sharma is a compassionate psychiatrist with over a decade of experience in treating a wide range of mental health conditions. She believes in a patient-centric approach.',
      languages: ['English', 'Hindi', 'Malayalam'],
      consultationType: ConsultationType.BOTH,
      services: { 
        connect: [{ id: counseling.id }, { id: childTherapy.id }]
      }
    },
  });
  await prisma.practitioner.create({
    data: {
      slug: 'mr-ben-thomas',
      title: Title.MR,
      name: 'Ben Thomas',
      email: 'ben@detox.com',
      password: practitionerPassword,
      role: PractitionerRole.THERAPIST,
      contactPrimary: '+919123456789',
      credentials: 'MPT (Ortho)',
      education: 'Masters in Physiotherapy from Manipal University',
      certifications: ['Certified Orthopedic Manual Therapist (COMT)'],
      experienceInYears: 8,
      bio: 'Mr. Thomas is a skilled physiotherapist specializing in orthopedic and sports-related injuries. He is dedicated to helping patients regain mobility and strength.',
      languages: ['English', 'Malayalam'],
      consultationType: ConsultationType.OFFLINE,
      services: {
        connect: [{ id: orthoTherapy.id }, { id: neuroRehab.id }]
      }
    },
  });
  console.log('Seeded practitioners.');
  
  // --- Seed Programs & Testimonials ---
  await prisma.program.createMany({ data: [
      { name: 'BASIC PROGRAM', description: 'A single session to get you started.', features: ['1 Session Only', 'Initial Assessment Included', 'Treatment Plan Provided'], price: 499, sessions: 1 },
      { name: 'EXTENDED PROGRAM', description: 'A multi-session program for ongoing support.', features: ['3 Sessions (Weekly)', 'Progress Tracking', 'Follow-up Support'], price: 1399, sessions: 3 },
      { name: 'RESIDENTIAL PROGRAM', description: 'Intensive in-house treatment for a comprehensive approach.', features: ['Intensive In-house Treatment', '24/7 Professional Support', 'Accommodation & Meals'], price: 4999, sessions: 0 },
  ] });
  console.log('Seeded programs.');
  await prisma.testimonial.createMany({ data: [
      { patientName: 'Rohan S.', story: 'The personalized physiotherapy plan helped me recover from my sports injury faster than I ever thought possible.', rating: 5 },
      { patientName: 'Anitha K.', story: 'I struggled with anxiety for years. The counseling sessions provided me with the tools to manage my stress and live a much happier life.', rating: 5 },
      { patientName: 'David P.', story: 'After my stroke, I thought I would never regain full mobility. The neurological rehab program here worked wonders.', rating: 5 },
  ] });
  console.log('Seeded testimonials.');

  console.log('Seeding finished.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
