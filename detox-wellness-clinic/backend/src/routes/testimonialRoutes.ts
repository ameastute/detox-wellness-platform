// src/routes/testimonialRoutes.ts
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
    const uploadDir = 'uploads/testimonials';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'testimonial-' + uniqueSuffix + path.extname(file.originalname));
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
    fileSize: 2 * 1024 * 1024 // 2MB limit for testimonial photos
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
      console.log('Old testimonial photo deleted:', photoUrl);
    } catch (error) {
      console.error('Error deleting old testimonial photo:', error);
    }
  }
};

// GET all testimonials (Public)
router.get('/', async (req, res) => {
  try {
    const { 
      featured, 
      status = 'ACTIVE', 
      serviceId, 
      rating, 
      limit, 
      offset = 0 
    } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (featured) where.featured = featured === 'true';
    if (serviceId) where.serviceId = serviceId;
    if (rating) where.rating = { gte: parseInt(rating as string) };

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit ? parseInt(limit as string) : undefined,
      skip: parseInt(offset as string),
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    // Normalize image URLs
    const testimonialsWithNormalizedPaths = testimonials.map(testimonial => ({
      ...testimonial,
      photoUrl: normalizePhotoPath(testimonial.photoUrl)
    }));

    res.json(testimonialsWithNormalizedPaths);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// GET testimonial statistics (Public)
router.get('/stats', async (req, res) => {
  try {
    const [totalCount, averageRating, ratingDistribution] = await Promise.all([
      // Total active testimonials
      prisma.testimonial.count({
        where: { status: 'ACTIVE' }
      }),

      // Average rating
      prisma.testimonial.aggregate({
        where: { status: 'ACTIVE' },
        _avg: { rating: true }
      }),

      // Rating distribution
      prisma.testimonial.groupBy({
        by: ['rating'],
        where: { status: 'ACTIVE' },
        _count: { rating: true },
        orderBy: { rating: 'desc' }
      })
    ]);

    res.json({
      totalTestimonials: totalCount,
      averageRating: averageRating._avg.rating || 0,
      ratingDistribution: ratingDistribution.map(item => ({
        rating: item.rating,
        count: item._count.rating
      }))
    });
  } catch (error) {
    console.error('Error fetching testimonial stats:', error);
    res.status(500).json({ error: 'Failed to fetch testimonial statistics' });
  }
});

// Admin routes (protected)
router.use(protect);
router.use(adminOnly);

// GET all testimonials for admin (includes inactive)
router.get('/admin', async (req, res) => {
  try {
    const { 
      status, 
      serviceId, 
      rating, 
      searchQuery,
      limit, 
      offset = 0 
    } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;
    if (rating) where.rating = { gte: parseInt(rating as string) };
    if (searchQuery) {
      where.OR = [
        { patientName: { contains: searchQuery as string, mode: 'insensitive' } },
        { content: { contains: searchQuery as string, mode: 'insensitive' } }
      ];
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: parseInt(offset as string),
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    // Normalize image URLs
    const testimonialsWithNormalizedPaths = testimonials.map(testimonial => ({
      ...testimonial,
      photoUrl: normalizePhotoPath(testimonial.photoUrl)
    }));

    res.json(testimonialsWithNormalizedPaths);
  } catch (error) {
    console.error('Error fetching admin testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// POST create new testimonial (Admin only)
router.post('/admin', upload.single('photo'), async (req, res) => {
  try {
    const {
      patientName,
      age,
      location,
      content,
      rating,
      serviceId,
      programId,
      featured,
      status,
      treatmentDate
    } = req.body;

    // Validate required fields
    if (!patientName || !content || !rating) {
      return res.status(400).json({ error: 'Patient name, content, and rating are required' });
    }

    // Validate rating range
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify service exists if provided
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) {
        return res.status(400).json({ error: 'Invalid service ID' });
      }
    }

    // Verify program exists if provided
    if (programId) {
      const program = await prisma.program.findUnique({ where: { id: programId } });
      if (!program) {
        return res.status(400).json({ error: 'Invalid program ID' });
      }
    }

    const photoUrl = req.file ? normalizePhotoPath(req.file.path) : null;

    const newTestimonial = await prisma.testimonial.create({
      data: {
        patientName,
        age: age ? parseInt(age) : null,
        location,
        content,
        rating: ratingNum,
        serviceId: serviceId || null,
        programId: programId || null,
        featured: featured === 'true',
        status: status || 'ACTIVE',
        photoUrl,
        treatmentDate: treatmentDate ? new Date(treatmentDate) : null
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    res.status(201).json({
      ...newTestimonial,
      photoUrl: normalizePhotoPath(newTestimonial.photoUrl)
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    
    // Clean up uploaded file if testimonial creation failed
    if (req.file) {
      await deleteOldPhoto(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

// PUT update testimonial (Admin only)
router.put('/admin/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientName,
      age,
      location,
      content,
      rating,
      serviceId,
      programId,
      featured,
      status,
      treatmentDate
    } = req.body;

    // Check if testimonial exists
    const currentTestimonial = await prisma.testimonial.findUnique({
      where: { id },
      select: { photoUrl: true }
    });

    if (!currentTestimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    // Validate rating range if provided
    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
    }

    // Verify service exists if provided
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) {
        return res.status(400).json({ error: 'Invalid service ID' });
      }
    }

    // Verify program exists if provided
    if (programId) {
      const program = await prisma.program.findUnique({ where: { id: programId } });
      if (!program) {
        return res.status(400).json({ error: 'Invalid program ID' });
      }
    }

    const dataToUpdate: any = {
      patientName,
      age: age ? parseInt(age) : null,
      location,
      content,
      rating: rating ? parseInt(rating) : undefined,
      serviceId: serviceId || null,
      programId: programId || null,
      featured: featured === 'true',
      status: status || 'ACTIVE',
      treatmentDate: treatmentDate ? new Date(treatmentDate) : null
    };

    // Handle photo update
    if (req.file) {
      // Delete old photo if it exists
      if (currentTestimonial.photoUrl) {
        await deleteOldPhoto(currentTestimonial.photoUrl);
      }
      dataToUpdate.photoUrl = normalizePhotoPath(req.file.path);
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: { id },
      data: dataToUpdate,
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    res.json({
      ...updatedTestimonial,
      photoUrl: normalizePhotoPath(updatedTestimonial.photoUrl)
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    
    // Clean up uploaded file if update failed
    if (req.file) {
      await deleteOldPhoto(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

// PUT toggle testimonial status (Admin only)
router.put('/admin/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: { id },
      data: { 
        status: testimonial.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    res.json({
      ...updatedTestimonial,
      photoUrl: normalizePhotoPath(updatedTestimonial.photoUrl)
    });
  } catch (error) {
    console.error('Error toggling testimonial status:', error);
    res.status(500).json({ error: 'Failed to toggle testimonial status' });
  }
});

// PUT toggle featured status (Admin only)
router.put('/admin/:id/toggle-featured', async (req, res) => {
  try {
    const { id } = req.params;
    
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: { id },
      data: { 
        featured: !testimonial.featured
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    res.json({
      ...updatedTestimonial,
      photoUrl: normalizePhotoPath(updatedTestimonial.photoUrl)
    });
  } catch (error) {
    console.error('Error toggling testimonial featured status:', error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
});

// DELETE testimonial (Admin only)
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get testimonial to delete associated photo
    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
      select: { photoUrl: true }
    });
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    
    // Delete the testimonial from database
    await prisma.testimonial.delete({ where: { id } });
    
    // Delete associated photo file
    if (testimonial.photoUrl) {
      await deleteOldPhoto(testimonial.photoUrl);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

export default router;