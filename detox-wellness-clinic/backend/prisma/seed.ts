// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Create default admin users
    console.log('👤 Creating admin users...');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);

    const admin = await prisma.admin.upsert({
      where: { email: 'admin@detoxwellness.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@detoxwellness.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    });

    const superAdmin = await prisma.admin.upsert({
      where: { email: 'superadmin@detoxwellness.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'superadmin@detoxwellness.com',
        password: superAdminPassword,
        role: 'SUPER_ADMIN'
      }
    });

    console.log('✅ Admin users created');

    // Create services
    console.log('🏥 Creating services...');
    
    const services = [
      {
        title: 'Alcohol Detoxification',
        slug: 'alcohol-detoxification',
        description: 'Comprehensive alcohol detox program with medical supervision and psychological support.',
        category: 'DETOX',
        price: 15000,
        duration: 21,
        featured: true,
        status: 'ACTIVE',
        benefits: [
          'Medical supervision 24/7',
          'Personalized treatment plan',
          'Psychological counseling',
          'Nutritional support',
          'Family therapy sessions'
        ],
        prerequisites: [
          'Medical assessment required',
          'Must be committed to treatment',
          'Age 18 or above'
        ]
      },
      {
        title: 'Drug Rehabilitation',
        slug: 'drug-rehabilitation',
        description: 'Complete drug rehabilitation program focusing on physical and mental recovery.',
        category: 'REHABILITATION',
        price: 25000,
        duration: 90,
        featured: true,
        status: 'ACTIVE',
        benefits: [
          'Comprehensive medical care',
          'Individual therapy sessions',
          'Group counseling',
          'Life skills training',
          'Aftercare support'
        ],
        prerequisites: [
          'Complete medical evaluation',
          'Commitment to 90-day program',
          'Family support preferred'
        ]
      },
      {
        title: 'Stress Management Therapy',
        slug: 'stress-management-therapy',
        description: 'Professional stress management and anxiety treatment programs.',
        category: 'THERAPY',
        price: 3000,
        duration: 30,
        featured: false,
        status: 'ACTIVE',
        benefits: [
          'Stress reduction techniques',
          'Mindfulness training',
          'Cognitive behavioral therapy',
          'Relaxation methods',
          'Lifestyle counseling'
        ],
        prerequisites: [
          'Initial consultation required',
          'Open to lifestyle changes'
        ]
      },
      {
        title: 'Family Counseling',
        slug: 'family-counseling',
        description: 'Comprehensive family therapy to rebuild relationships and communication.',
        category: 'COUNSELING',
        price: 2500,
        duration: 45,
        featured: false,
        status: 'ACTIVE',
        benefits: [
          'Family relationship healing',
          'Communication improvement',
          'Conflict resolution',
          'Support system building',
          'Educational sessions'
        ],
        prerequisites: [
          'All family members must participate',
          'Commitment to regular sessions'
        ]
      },
      {
        title: 'Wellness & Prevention',
        slug: 'wellness-prevention',
        description: 'Preventive wellness programs for maintaining mental and physical health.',
        category: 'WELLNESS',
        price: 1500,
        duration: 14,
        featured: false,
        status: 'ACTIVE',
        benefits: [
          'Health assessment',
          'Preventive care planning',
          'Nutrition guidance',
          'Exercise programs',
          'Mental wellness support'
        ],
        prerequisites: [
          'Health screening',
          'Commitment to wellness goals'
        ]
      }
    ];

    const createdServices = [];
    for (const serviceData of services) {
      const service = await prisma.service.upsert({
        where: { slug: serviceData.slug },
        update: {},
        create: serviceData
      });
      createdServices.push(service);
    }

    console.log('✅ Services created');

    // Create programs
    console.log('📋 Creating programs...');
    
    const programs = [
      {
        name: 'Intensive Detox Program',
        slug: 'intensive-detox-program',
        description: 'A comprehensive 21-day intensive detox program with round-the-clock medical supervision.',
        type: 'RESIDENTIAL',
        duration: 21,
        price: 45000,
        maxParticipants: 10,
        serviceId: createdServices[0].id, // Alcohol Detoxification
        featured: true,
        status: 'ACTIVE',
        inclusions: [
          'Private accommodation',
          'All meals included',
          'Daily medical checkups',
          'Individual counseling sessions',
          'Group therapy',
          'Recreation activities',
          'Family visitation'
        ],
        schedule: {
          daily: {
            '6:00 AM': 'Morning meditation',
            '7:00 AM': 'Breakfast',
            '9:00 AM': 'Medical checkup',
            '10:00 AM': 'Individual therapy',
            '12:00 PM': 'Lunch',
            '2:00 PM': 'Group session',
            '4:00 PM': 'Recreation time',
            '6:00 PM': 'Dinner',
            '8:00 PM': 'Evening reflection'
          }
        },
        requirements: [
          'Medical clearance',
          'Commitment to 21-day stay',
          'No outside substances allowed'
        ]
      },
      {
        name: 'Outpatient Recovery Program',
        slug: 'outpatient-recovery-program',
        description: '90-day outpatient program for individuals who can maintain their daily responsibilities.',
        type: 'OUTPATIENT',
        duration: 90,
        price: 15000,
        maxParticipants: 15,
        serviceId: createdServices[1].id, // Drug Rehabilitation
        featured: true,
        status: 'ACTIVE',
        inclusions: [
          'Weekly counseling sessions',
          'Group therapy (twice weekly)',
          'Medical monitoring',
          'Crisis support hotline',
          'Educational workshops',
          'Family sessions'
        ],
        schedule: {
          weekly: {
            'Monday': 'Individual counseling',
            'Wednesday': 'Group therapy',
            'Friday': 'Medical checkup',
            'Saturday': 'Family session (monthly)'
          }
        },
        requirements: [
          'Stable living environment',
          'Transportation availability',
          'Weekly attendance mandatory'
        ]
      },
      {
        name: 'Stress Relief Workshop',
        slug: 'stress-relief-workshop',
        description: 'A 7-day intensive workshop focusing on stress management techniques.',
        type: 'WORKSHOP',
        duration: 7,
        price: 5000,
        maxParticipants: 20,
        serviceId: createdServices[2].id, // Stress Management
        featured: false,
        status: 'ACTIVE',
        inclusions: [
          'Daily workshop sessions',
          'Meditation training',
          'Yoga classes',
          'Nutritional guidance',
          'Take-home materials',
          'Follow-up session'
        ],
        schedule: {
          daily: {
            '9:00 AM': 'Morning meditation',
            '10:00 AM': 'Workshop session',
            '12:00 PM': 'Break',
            '2:00 PM': 'Practical exercises',
            '4:00 PM': 'Yoga/relaxation'
          }
        },
        requirements: [
          'Comfortable clothing for yoga',
          'Openness to new techniques'
        ]
      }
    ];

    const createdPrograms = [];
    for (const programData of programs) {
      const program = await prisma.program.upsert({
        where: { slug: programData.slug },
        update: {},
        create: programData
      });
      createdPrograms.push(program);
    }

    console.log('✅ Programs created');

    // Create practitioners
    console.log('👨‍⚕️ Creating practitioners...');
    
    const practitionerPassword = await bcrypt.hash('practitioner123', 10);
    
    const practitioners = [
      {
        name: 'Dr. Rajesh Kumar',
        slug: 'dr-rajesh-kumar',
        title: 'Dr',
        specialization: 'Addiction Medicine',
        qualifications: 'MBBS, MD (Psychiatry), Certificate in Addiction Medicine',
        experienceInYears: 15,
        languages: ['English', 'Hindi', 'Malayalam'],
        email: 'rajesh@detoxwellness.com',
        phone: '+91-9876543210',
        password: practitionerPassword,
        bio: 'Dr. Rajesh Kumar is a renowned addiction medicine specialist with over 15 years of experience in treating various forms of substance abuse. He has helped hundreds of patients recover and lead healthy lives.',
        expertise: [
          'Alcohol detoxification',
          'Drug rehabilitation',
          'Behavioral therapy',
          'Relapse prevention'
        ],
        certifications: ['Indian Society of Addiction Medicine', 'International Certification in Addiction Counseling'],
        consultationFee: 1000,
        status: 'ACTIVE'
      },
      {
        name: 'Dr. Priya Nair',
        slug: 'dr-priya-nair',
        title: 'Dr',
        specialization: 'Clinical Psychology',
        qualifications: 'MA Psychology, PhD Clinical Psychology',
        experienceInYears: 12,
        languages: ['English', 'Malayalam', 'Tamil'],
        email: 'priya@detoxwellness.com',
        phone: '+91-9876543211',
        password: practitionerPassword,
        bio: 'Dr. Priya Nair specializes in clinical psychology with a focus on addiction counseling and family therapy. Her compassionate approach has helped many families heal together.',
        expertise: [
          'Individual counseling',
          'Family therapy',
          'Cognitive behavioral therapy',
          'Trauma counseling'
        ],
        certifications: ['Licensed Clinical Psychologist', 'Family Therapy Certification'],
        consultationFee: 800,
        status: 'ACTIVE'
      },
      {
        name: 'Mr. Arun Menon',
        slug: 'mr-arun-menon',
        title: 'Mr',
        specialization: 'Addiction Counselor',
        qualifications: 'MSW, Certified Addiction Counselor',
        experienceInYears: 8,
        languages: ['English', 'Malayalam'],
        email: 'arun@detoxwellness.com',
        phone: '+91-9876543212',
        password: practitionerPassword,
        bio: 'Arun Menon is a certified addiction counselor who brings personal experience and professional expertise to help clients overcome their challenges.',
        expertise: [
          'Group counseling',
          'Peer support',
          'Relapse prevention',
          'Life skills training'
        ],
        certifications: ['Certified Addiction Counselor', 'Motivational Interviewing Certification'],
        consultationFee: 600,
        status: 'ACTIVE'
      }
    ];

    const createdPractitioners = [];
    for (const practData of practitioners) {
      const practitioner = await prisma.practitioner.upsert({
        where: { email: practData.email },
        update: {},
        create: {
          ...practData,
          services: {
            connect: createdServices.slice(0, 3).map(s => ({ id: s.id }))
          }
        }
      });
      createdPractitioners.push(practitioner);
    }

    console.log('✅ Practitioners created');

    // Create testimonials
    console.log('💬 Creating testimonials...');
    
    const testimonials = [
      {
        patientName: 'Ramesh K.',
        age: 45,
        location: 'Malappuram, Kerala',
        content: 'The team at Detox Wellness Center changed my life. After struggling with alcohol addiction for years, their comprehensive program helped me get clean and stay sober. The doctors and counselors were incredibly supportive throughout my journey.',
        rating: 5,
        serviceId: createdServices[0].id,
        programId: createdPrograms[0].id,
        featured: true,
        status: 'ACTIVE',
        treatmentDate: new Date('2024-06-01')
      },
      {
        patientName: 'Meera S.',
        age: 32,
        location: 'Kozhikode, Kerala',
        content: 'I was skeptical about seeking help, but the outpatient program was perfect for my situation. I could continue working while getting the support I needed. Dr. Priya\'s counseling sessions were life-changing.',
        rating: 5,
        serviceId: createdServices[1].id,
        programId: createdPrograms[1].id,
        featured: true,
        status: 'ACTIVE',
        treatmentDate: new Date('2024-07-15')
      },
      {
        patientName: 'Anonymous',
        age: 28,
        location: 'Thrissur, Kerala',
        content: 'The stress management workshop helped me develop coping mechanisms that I still use today. The techniques I learned have significantly improved my quality of life.',
        rating: 4,
        serviceId: createdServices[2].id,
        programId: createdPrograms[2].id,
        featured: false,
        status: 'ACTIVE',
        treatmentDate: new Date('2024-08-01')
      },
      {
        patientName: 'Suresh M.',
        age: 38,
        location: 'Palakkad, Kerala',
        content: 'Family counseling sessions helped repair the relationships that my addiction had damaged. My family is stronger now because of the support we received here.',
        rating: 5,
        serviceId: createdServices[3].id,
        featured: true,
        status: 'ACTIVE',
        treatmentDate: new Date('2024-05-20')
      },
      {
        patientName: 'Lakshmi R.',
        age: 41,
        location: 'Kannur, Kerala',
        content: 'The medical supervision during detox made me feel safe. The staff was compassionate and professional. I\'m now 6 months clean and feeling better than ever.',
        rating: 5,
        serviceId: createdServices[0].id,
        featured: false,
        status: 'ACTIVE',
        treatmentDate: new Date('2024-03-10')
      }
    ];

    for (const testimonialData of testimonials) {
      await prisma.testimonial.upsert({
        where: { 
          patientName_serviceId: { 
            patientName: testimonialData.patientName, 
            serviceId: testimonialData.serviceId 
          }
        },
        update: {},
        create: testimonialData
      });
    }

    console.log('✅ Testimonials created');

    // Create sample appointments
    console.log('📅 Creating sample appointments...');
    
    const sampleAppointments = [
      {
        appointmentDate: new Date('2024-12-20'),
        consultationType: 'CONSULTATION',
        status: 'CONFIRMED',
        patientName: 'John Doe',
        patientAge: 35,
        patientGender: 'MALE',
        patientMobile: '+91-9876543210',
        patientEmail: 'john.doe@email.com',
        serviceId: createdServices[0].id,
        practitionerId: createdPractitioners[0].id,
        programId: createdPrograms[0].id,
        sessionDates: [new Date('2024-12-20')],
        residentialMonth: 'JANUARY',
        residentialYear: '2025'
      },
      {
        appointmentDate: new Date('2024-12-18'),
        consultationType: 'FOLLOW_UP',
        status: 'COMPLETED',
        patientName: 'Sarah Wilson',
        patientAge: 29,
        patientGender: 'FEMALE',
        patientMobile: '+91-9876543211',
        patientEmail: 'sarah.wilson@email.com',
        serviceId: createdServices[1].id,
        practitionerId: createdPractitioners[1].id,
        programId: createdPrograms[1].id,
        sessionDates: [new Date('2024-12-18'), new Date('2024-12-25')],
        residentialMonth: 'DECEMBER',
        residentialYear: '2024'
      }
    ];

    for (const appointmentData of sampleAppointments) {
      await prisma.appointment.create({
        data: appointmentData
      });
    }

    console.log('✅ Sample appointments created');

    // Create sample contact inquiries
    console.log('📧 Creating sample contact inquiries...');
    
    const contactInquiries = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91-9876543213',
        subject: 'Inquiry about alcohol detox program',
        message: 'I am interested in your alcohol detoxification program. Could you please provide more details about the duration and cost?',
        type: 'APPOINTMENT',
        preferredContact: 'PHONE',
        status: 'PENDING'
      },
      {
        name: 'Priya Nair',
        email: 'priya.nair@example.com',
        phone: '+91-9876543214',
        subject: 'Family counseling services',
        message: 'My family is going through a difficult time. We would like to know more about your family counseling services.',
        type: 'CONSULTATION',
        preferredContact: 'EMAIL',
        status: 'READ'
      }
    ];

    for (const inquiryData of contactInquiries) {
      await prisma.contactInquiry.create({
        data: inquiryData
      });
    }

    console.log('✅ Sample contact inquiries created');

    // Create sample notifications for admin users
    console.log('🔔 Creating sample notifications...');
    
    const notifications = [
      {
        title: 'New Appointment Booked',
        message: 'John Doe has booked an appointment for alcohol detox consultation on Dec 20, 2024.',
        type: 'APPOINTMENT',
        userId: admin.id,
        read: false
      },
      {
        title: 'Contact Form Submission',
        message: 'New inquiry received from Rajesh Kumar about alcohol detox program.',
        type: 'INFO',
        userId: admin.id,
        read: false
      },
      {
        title: 'System Update',
        message: 'The system has been successfully updated with new features.',
        type: 'SUCCESS',
        userId: superAdmin.id,
        read: true
      }
    ];

    for (const notificationData of notifications) {
      await prisma.notification.create({
        data: notificationData
      });
    }

    console.log('✅ Sample notifications created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin User: admin@detoxwellness.com / admin123');
    console.log('Super Admin: superadmin@detoxwellness.com / superadmin123');
    console.log('Practitioner: rajesh@detoxwellness.com / practitioner123');
    console.log('\n🌐 You can now start your backend server and test the API endpoints.');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });