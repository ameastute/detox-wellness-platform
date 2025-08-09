// src/routes/practitionerRoutes.ts
import { Router } from 'express';
import prisma from '../lib/prisma';
import { protect, adminOnly } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/practitioners';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'practitioner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      // Correct way to reject a file without crashing the server
      cb(null, false);
      // You can also pass an error to be handled by the global error handler
      // return cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Apply authentication and admin-only middleware to all routes
router.use(protect, adminOnly);

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
    } catch (error) {
      console.error('Error deleting old photo:', error);
    }
  }
};

// GET all practitioners
router.get('/', async (req, res) => {
  try {
    const practitioners = await prisma.practitioner.findMany({
      orderBy: { createdAt: 'desc' },
      include: { services: true }
    });
    
    const practitionersWithCorrectPaths = practitioners.map(practitioner => ({
      ...practitioner,
      photoUrl: normalizePhotoPath(practitioner.photoUrl)
    }));
    
    res.json(practitionersWithCorrectPaths);
  } catch (error) { 
    console.error('Error fetching practitioners:', error);
    res.status(500).json({ error: 'Failed to fetch practitioners' }); 
  }
});

// POST (Create) a new practitioner
router.post('/', upload.single('photo'), async (req, res, next) => {
  try {
    const { password, ...restOfData } = req.body;
    
    if (!password || password.trim() === '') {
      return res.status(400).json({ error: 'Password is required for new practitioners' });
    }
    
    const photoUrl = req.file ? normalizePhotoPath(req.file.path) : null;
    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = restOfData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const newPractitioner = await prisma.practitioner.create({
      data: {
        ...restOfData,
        slug,
        password: hashedPassword,
        photoUrl,
        experienceInYears: parseInt(restOfData.experienceInYears, 10),
        languages: restOfData.languages.split(',').map((s: string) => s.trim()),
        certifications: restOfData.certifications.split(',').map((s: string) => s.trim()),
        services: {
          connect: JSON.parse(restOfData.services).map((id: string) => ({ id }))
        }
      },
      include: { services: true }
    });
    
    const responseData = { ...newPractitioner, photoUrl: normalizePhotoPath(newPractitioner.photoUrl) };
    res.status(201).json(responseData);
  } catch (error) { 
    console.error('Error creating practitioner:', error);
    if (req.file) await deleteOldPhoto(req.file.path);
    next(error); // Pass to global error handler
  }
});

// PUT (Update) a practitioner
router.put('/:id', upload.single('photo'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { password, ...restOfData } = req.body;
        
        const currentPractitioner = await prisma.practitioner.findUnique({ where: { id } });
        if (!currentPractitioner) return res.status(404).json({ error: 'Practitioner not found' });
        
        const dataToUpdate: any = {
            ...restOfData,
            slug: restOfData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            experienceInYears: parseInt(restOfData.experienceInYears, 10),
            languages: restOfData.languages.split(',').map((s: string) => s.trim()),
            certifications: restOfData.certifications.split(',').map((s: string) => s.trim()),
            services: { set: JSON.parse(restOfData.services).map((id: string) => ({ id })) }
        };

        if (req.file) {
            if (currentPractitioner.photoUrl) await deleteOldPhoto(currentPractitioner.photoUrl);
            dataToUpdate.photoUrl = normalizePhotoPath(req.file.path);
        }
        
        if (password && password.trim() !== '') {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        const updatedPractitioner = await prisma.practitioner.update({ 
          where: { id }, data: dataToUpdate, include: { services: true }
        });
        
        const responseData = { ...updatedPractitioner, photoUrl: normalizePhotoPath(updatedPractitioner.photoUrl) };
        res.json(responseData);
    } catch (error) { 
        console.error('Error updating practitioner:', error);
        if (req.file) await deleteOldPhoto(req.file.path);
        next(error); // Pass to global error handler
    }
});

// PUT (Toggle Status) a practitioner's active status
router.put('/:id/toggle-status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const practitioner = await prisma.practitioner.findUnique({ where: { id } });
        if (!practitioner) return res.status(404).json({ error: 'Practitioner not found' });

        const updatedPractitioner = await prisma.practitioner.update({
            where: { id },
            data: { status: practitioner.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' },
            include: { services: true }
        });
        
        const responseData = { ...updatedPractitioner, photoUrl: normalizePhotoPath(updatedPractitioner.photoUrl) };
        res.json(responseData);
    } catch (error) { 
        console.error('Error updating practitioner status:', error);
        next(error); // Pass to global error handler
    }
});

// DELETE a practitioner
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const practitioner = await prisma.practitioner.findUnique({ where: { id } });
    if (!practitioner) return res.status(404).json({ error: 'Practitioner not found' });
    
    await prisma.practitioner.delete({ where: { id } });
    if (practitioner.photoUrl) await deleteOldPhoto(practitioner.photoUrl);
    
    res.status(204).send();
  } catch (error) { 
    console.error('Error deleting practitioner:', error);
    next(error); // Pass to global error handler
  }
});

export default router;
