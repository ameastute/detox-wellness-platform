// backend/src/routes/adminRoutes.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to all admin routes
router.use(protect);
router.use(adminOnly);

// Dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get various statistics
    const [
      todayAppointments,
      weeklyRevenue,
      totalPatients,
      activeSpecialists,
      pendingAppointments,
      completedAppointments,
      popularServices,
      recentAppointments
    ] = await Promise.all([
      // Today's appointments count
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow
          }
        }
      }),

      // This week's revenue (you'll need to add payment tracking)
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: thisWeekStart
          },
          status: 'COMPLETED'
        }
      }),

      // Total unique patients (based on email/phone)
      prisma.appointment.groupBy({
        by: ['patientEmail'],
        where: {
          patientEmail: {
            not: null
          }
        }
      }).then(groups => groups.length),

      // Active specialists count
      prisma.practitioner.count({
        where: {
          status: 'ACTIVE'
        }
      }),

      // Pending appointments
      prisma.appointment.count({
        where: {
          status: 'PENDING'
        }
      }),

      // Completed appointments this month
      prisma.appointment.count({
        where: {
          status: 'COMPLETED',
          appointmentDate: {
            gte: thisMonthStart
          }
        }
      }),

      // Popular services
      prisma.appointment.groupBy({
        by: ['serviceId'],
        _count: {
          serviceId: true
        },
        orderBy: {
          _count: {
            serviceId: 'desc'
          }
        },
        take: 5
      }),

      // Recent appointments
      prisma.appointment.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          service: {
            select: { title: true }
          },
          practitioner: {
            select: { name: true, title: true }
          },
          program: {
            select: { name: true }
          }
        }
      })
    ]);

    // Get service names for popular services
    const serviceIds = popularServices.map(s => s.serviceId);
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds
        }
      },
      select: {
        id: true,
        title: true
      }
    });

    const popularServicesWithNames = popularServices.map(stat => {
      const service = services.find(s => s.id === stat.serviceId);
      return {
        serviceName: service?.title || 'Unknown Service',
        count: stat._count.serviceId
      };
    });

    res.json({
      todayAppointments,
      weeklyRevenue: weeklyRevenue * 1000, // Placeholder calculation
      totalPatients,
      activeSpecialists,
      pendingAppointments,
      completedAppointments,
      popularServices: popularServicesWithNames,
      recentAppointments: recentAppointments.map(apt => ({
        id: apt.id,
        patientName: apt.patientName,
        service: apt.service.title,
        practitioner: `${apt.practitioner.title}. ${apt.practitioner.name}`,
        program: apt.program.name,
        status: apt.status,
        appointmentDate: apt.appointmentDate,
        createdAt: apt.createdAt
      }))
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get all admins
router.get('/users', async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// Create new admin user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role = 'ADMIN' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: newAdmin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// Update admin user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id }
    });

    if (!existingAdmin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Prevent self-role modification
    if (req.user!.id === id && role && role !== existingAdmin.role) {
      return res.status(400).json({ error: 'Cannot modify your own role' });
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Admin user updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Failed to update admin user' });
  }
});

// Delete admin user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user!.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id }
    });

    if (!existingAdmin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Delete admin
    await prisma.admin.delete({
      where: { id }
    });

    res.json({ message: 'Admin user deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
});

export default router;