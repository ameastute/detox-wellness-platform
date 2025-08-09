// src/routes/appointmentRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import prisma from '../lib/prisma';
import { AppointmentStatus, ConsultationType } from '@prisma/client';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST a new appointment (Public route)
router.post('/', upload.single('medicalReport'), async (req, res) => {
  try {
    const {
      consultationType,
      patientName, patientAge, patientGender, patientMobile, patientEmail,
      serviceId, practitionerId, programId, // Corrected from specialistId
      sessions,
      residentialMonth, residentialYear
    } = req.body;

    const medicalReportUrl = req.file ? req.file.path : null;
    const parsedSessions = sessions ? JSON.parse(sessions) : [];
    const primaryAppointmentDate = parsedSessions.length > 0 ? new Date(parsedSessions[0].date) : new Date();

    const newAppointment = await prisma.appointment.create({
      data: {
        appointmentDate: primaryAppointmentDate,
        consultationType: consultationType as ConsultationType,
        status: AppointmentStatus.CONFIRMED,
        patientName,
        patientAge: parseInt(patientAge, 10),
        patientGender,
        patientMobile,
        patientEmail,
        service: { connect: { id: serviceId } },
        practitioner: { connect: { id: practitionerId } }, // Corrected from specialist
        program: { connect: { id: programId } },
        sessionDates: parsedSessions.map((s: any) => new Date(s.date)),
        residentialMonth,
        residentialYear,
        medicalReportUrl,
      },
    });

    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Failed to create appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});


// GET all appointments (Protected Admin Route)
router.get('/', protect, async (req, res) => {
  try {
    const { status, serviceId, practitionerId, searchQuery, dateStart, dateEnd } = req.query; // Corrected from specialistId

    const where: any = {};

    if (status) where.status = status as any;
    if (serviceId) where.serviceId = serviceId as string;
    if (practitionerId) where.practitionerId = practitionerId as string; // Corrected
    if (dateStart && dateEnd) where.appointmentDate = { gte: new Date(dateStart as string), lte: new Date(dateEnd as string) };
    if (searchQuery) {
      where.OR = [
        { patientName: { contains: searchQuery as string, mode: 'insensitive' } },
        { patientMobile: { contains: searchQuery as string, mode: 'insensitive' } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'desc' },
      include: {
        service: true,
        practitioner: true, // Corrected from specialist
        program: true,
      },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

export default router;
