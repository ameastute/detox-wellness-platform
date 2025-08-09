// src/routes/serviceRoutes.ts
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
    const uploadDir = 'uploads/services';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
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
      console.log('Old service image deleted:', photoUrl);
    } catch (error) {
      console.error('Error deleting old service image:', error);
    }
  }
};

// GET all services (Public)
router.get('/', async (req, res) => {
  try {
    const { featured, category, status = 'ACTIVE' } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (featured) where.featured = featured === 'true';
    if (category) where.category = category;

    const services = await prisma.service.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        practitioners: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            title: true,
            photoUrl: true
          }
        }
      }
    });

    // Normalize image URLs
    const servicesWithNormalizedPaths = services.map(service => ({
      ...service,
      imageUrl: normalizePhotoPath(service.imageUrl),
      practitioners: service.practitioners.map(p => ({
        ...p,
        photoUrl: normalizePhotoPath(p.photoUrl)
      }))
    }));

    res.json(servicesWithNormalizedPaths);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// GET single service by ID or slug (Public)
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a valid UUID (ID) or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    const service = await prisma.service.findUnique({
      where: isUUID ? { id: identifier } : { slug: identifier },
      include: {
        practitioners: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            title: true,
            photoUrl: true,
            experienceInYears: true,
            languages: true
          }
        },
        programs: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Normalize image URLs
    const serviceWithNormalizedPaths = {
      ...service,
      imageUrl: normalizePhotoPath(service.imageUrl),
      practitioners: service.practitioners.map(p => ({
        ...p,
        photoUrl: normalizePhotoPath(p.photoUrl)
      }))
    };

    res.json(serviceWithNormalizedPaths);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Admin routes (protected)
router.use(protect);
router.use(adminOnly);

// POST create new service (Admin only)
router.post('/admin', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      duration,
      featured,
      status,
      benefits,
      prerequisites
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const imageUrl = req.file ? normalizePhotoPath(req.file.path) : null;
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    // Parse JSON fields
    const parsedBenefits = benefits ? JSON.parse(benefits) : [];
    const parsedPrerequisites = prerequisites ? JSON.parse(prerequisites) : [];

    const newService = await prisma.service.create({
      data: {
        title,
        slug,
        description,
        category,
        price: price ? parseFloat(price) : null,
        duration: duration ? parseInt(duration) : null,
        featured: featured === 'true',
        status: status || 'ACTIVE',
        imageUrl,
        benefits: parsedBenefits,
        prerequisites: parsedPrerequisites
      }
    });

    res.status(201).json({
      ...newService,
      imageUrl: normalizePhotoPath(newService.imageUrl)
    });
  } catch (error) {
    console.error('Error creating service:', error);
    
    // Clean up uploaded file if service creation failed
    if (req.file) {
      await deleteOldPhoto(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT update service (Admin only)
router.put('/admin/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      price,
      duration,
      featured,
      status,
      benefits,
      prerequisites
    } = req.body;

    // Check if service exists
    const currentService = await prisma.service.findUnique({
      where: { id },
      select: { imageUrl: true }
    });

    if (!currentService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const dataToUpdate: any = {
      title,
      description,
      category,
      price: price ? parseFloat(price) : null,
      duration: duration ? parseInt(duration) : null,
      featured: featured === 'true',
      status: status || 'ACTIVE'
    };

    if (title) {
      dataToUpdate.slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }

    // Parse JSON fields
    if (benefits) dataToUpdate.benefits = JSON.parse(benefits);
    if (prerequisites) dataToUpdate.prerequisites = JSON.parse(prerequisites);

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (currentService.imageUrl) {
        await deleteOldPhoto(currentService.imageUrl);
      }
      dataToUpdate.imageUrl = normalizePhotoPath(req.file.path);
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: dataToUpdate,
      include: {
        practitioners: {
          select: {
            id: true,
            name: true,
            title: true
          }
        }
      }
    });

    res.json({
      ...updatedService,
      imageUrl: normalizePhotoPath(updatedService.imageUrl)
    });
  } catch (error) {
    console.error('Error updating service:', error);
    
    // Clean up uploaded file if update failed
    if (req.file) {
      await deleteOldPhoto(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// PUT toggle service status (Admin only)
router.put('/admin/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await prisma.service.findUnique({ where: { id } });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: { 
        status: service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      }
    });

    res.json({
      ...updatedService,
      imageUrl: normalizePhotoPath(updatedService.imageUrl)
    });
  } catch (error) {
    console.error('Error toggling service status:', error);
    res.status(500).json({ error: 'Failed to toggle service status' });
  }
});

// DELETE service (Admin only)
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get service to delete associated image
    const service = await prisma.service.findUnique({
      where: { id },
      select: { imageUrl: true }
    });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Delete the service from database
    await prisma.service.delete({ where: { id } });
    
    // Delete associated image file
    if (service.imageUrl) {
      await deleteOldPhoto(service.imageUrl);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;