// src/routes/adminRoutes.ts
import { Router } from 'express';
import prisma from '../lib/prisma';
import { protect } from '../middleware/authMiddleware';
import { startOfDay, endOfDay } from 'date-fns';

const router = Router();

// This entire route is protected
router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todaysAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const completedAppointments = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        program: {
          select: {
            price: true,
          },
        },
      },
    });

    const totalRevenue = completedAppointments.reduce((sum, appt) => {
      return sum + (appt.program?.price || 0);
    }, 0);

    const recentAppointments = await prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { 
            service: true, 
            practitioner: true // --- FIX: Changed 'specialist' to 'practitioner' ---
        }
    });

    res.json({
      todaysAppointments,
      totalRevenue,
      recentAppointments
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;