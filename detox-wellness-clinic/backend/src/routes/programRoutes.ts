// src/routes/programRoutes.ts
import { Router } from 'express';
import prisma from '../lib/prisma';
import { protect, adminOnly } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/programs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'program-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to normalize photo paths
const normalizePhotoPath = (photoUrl: string | null): string | null => {
  if (!photoUrl) return null;
  return photoUrl.replace(/\\/g, '/');
};

// Helper function to delete old photo file
const deleteOldPhoto = async (photoUrl: string | null) => {
  if (photoUrl && fs.existsSync(photoUrl)) {
    try {
      fs.unlinkSync(photoUrl);
      console.log('Old program image deleted:', photoUrl);
    } catch (error) {
      console.error('Error deleting old program image:', error);
    }
  }
};

// GET all programs (Public)
router.get('/', async (req, res) => {
  try {
    const { featured, type, status = 'ACTIVE', serviceId } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (featured) where.featured = featured === 'true';
    if (type) where.type = type;
    if (serviceId) where.serviceId = serviceId;

    const programs = await prisma.program.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        _count: {
          select: {
            appointments: true
          }
        }
      }
    });

    // Normalize image URLs and add enrollment count
    const programsWithNormalizedPaths = programs.map(program => ({
      ...program,
      imageUrl: normalizePhotoPath(program.imageUrl),
      enrollmentCount: program._count.appointments
    }));

    res.json(programsWithNormalizedPaths);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// GET single program by ID or slug (Public)
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a valid UUID (ID) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    const program = await prisma.program.findUnique({
      where: isUUID ? { id: identifier } : { slug: identifier },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true
          }
        },
        appointments: {
          select: {
            id: true,
            patientName: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            appointments: true
          }
        }
      }
    });

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Normalize image URLs
    const programWithNormalizedPaths = {
      ...program,
      imageUrl: normalizePhotoPath(program.imageUrl),
      enrollmentCount: program._count.appointments
    };

    res.json(programWithNormalizedPaths);
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

// Admin routes (protected)
router.use(protect);
router.use(adminOnly);

// POST create new program (Admin only)
router.post('/admin', upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      duration,
      price,
      maxParticipants,
      serviceId,
      featured,
      status,
      inclusions,
      schedule,
      requirements
    } = req.body;

    // Validate required fields
    if (!name || !description || !type || !serviceId) {
      return res.status(400).json({ error: 'Name, description, type, and service are required' });
    }

    // Verify service exists
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const imageUrl = req.file ? normalizePhotoPath(req.file.path) : null;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Parse JSON fields
    const parsedInclusions = inclusions ? JSON.parse(inclusions) : [];
    const parsedSchedule = schedule ? JSON.parse(schedule) : {};
    const parsedRequirements = requirements ? JSON.parse(requirements) : [];

    const newProgram = await prisma.program.create({
      data: {
        name,
        slug,
        description,
        type,
        duration: duration ? parseInt(duration) : null,
        price: price ? parseFloat(price) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        serviceId,
        featured: featured === 'true',
        status: status || 'ACTIVE',
        imageUrl,
        inclusions: parsedInclusions,
        schedule: parsedSchedule,
        requirements: parsedRequirements
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      }
    });

    res.status(201).json({
      ...newProgram,
      imageUrl: normalizePhotoPath(newProgram.imageUrl)
    });
  } catch (error) {
    console.error('Error creating program:', error);
    
    // Clean up uploaded file if program creation failed
    if (req.file) {
      await deleteOldPhoto(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// PUT update program (Admin only)
router.put('/admin/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      duration,
      price,
      maxParticipants,
      serviceId,
      featured,
      status,
      inclusions,
      schedule,
      requirements
    } = req.body;

    // Check if program exists
    const currentProgram = await prisma.program.findUnique({
      where: { id },
      select: { imageUrl: true }
    });

    if (!currentProgram) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Verify service exists if serviceId is provided
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) {
        return res.status(400).json({ error: 'Invalid service ID' });
      }
    }

    const dataToUpdate: any = {
      name,
      description,
      type,
      duration: duration ? parseInt(duration) : null,
      price: price ? parseFloat(price) : null,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      serviceId,
      featured: featured === 'true',
      status: status || 'ACTIVE'
    };

    if (name) {
      dataToUpdate.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }

    // Parse JSON fields
    if (inclusions) dataToUpdate.inclusions = JSON.parse(inclusions);
    if (schedule) dataToUpdate.schedule = JSON.parse(schedule);
    if (requirements) dataToUpdate.requirements = JSON.parse(requirements);

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (currentProgram.imageUrl) {
        await deleteOldPhoto(currentProgram.imageUrl);
      }
      dataToUpdate.imageUrl = normalizePhotoPath(req.file.path);
    }

    const updatedProgram = await prisma.program.update({
      where: { id },
      data: dataToUpdate,
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      }
    });

    res.json({
      ...updatedProgram,
      imageUrl: normalizePhotoPath(updatedProgram.imageUrl)
    });
  } catch (error) {
    console.error('Error updating program:', error);
    
    // Clean up uploaded file if update failed
    if (req.file) {
      await deleteOldPhoto(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// PUT toggle program status (Admin only)
router.put('/admin/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const program = await prisma.program.findUnique({ where: { id } });
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const updatedProgram = await prisma.program.update({
      where: { id },
      data: { 
        status: program.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      }
    });

    res.json({
      ...updatedProgram,
      imageUrl: normalizePhotoPath(updatedProgram.imageUrl)
    });
  } catch (error) {
    console.error('Error toggling program status:', error);
    res.status(500).json({ error: 'Failed to toggle program status' });
  }
});

// DELETE program (Admin only)
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check for existing appointments
    const appointmentCount = await prisma.appointment.count({
      where: { programId: id }
    });

    if (appointmentCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete program with existing appointments. Please cancel all appointments first.' 
      });
    }
    
    // Get program to delete associated image
    const program = await prisma.program.findUnique({
      where: { id },
      select: { imageUrl: true }
    });
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    // Delete the program from database
    await prisma.program.delete({ where: { id } });
    
    // Delete associated image file
    if (program.imageUrl) {
      await deleteOldPhoto(program.imageUrl);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

export default router;