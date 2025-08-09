// src/routes/uploadRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, adminOnly } from '../middleware/authMiddleware';
import sharp from 'sharp';

const router = Router();

// Configure multer for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = 'uploads/';
    
    // Organize uploads by type
    if (file.mimetype.startsWith('image/')) {
      uploadDir += 'images/';
    } else if (file.mimetype === 'application/pdf') {
      uploadDir += 'documents/';
    } else {
      uploadDir += 'misc/';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Only images, PDFs, and Word documents are permitted.'));
    }
  }
});

// Helper function to normalize file paths
const normalizeFilePath = (filePath: string): string => {
  return filePath.replace(/\\/g, '/');
};

// Helper function to optimize images
const optimizeImage = async (inputPath: string, outputPath: string, quality = 85): Promise<void> => {
  try {
    await sharp(inputPath)
      .jpeg({ quality, progressive: true })
      .png({ quality })
      .webp({ quality })
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .toFile(outputPath);
      
    // Remove original if optimization successful
    if (inputPath !== outputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
  } catch (error) {
    console.error('Image optimization failed:', error);
    // If optimization fails, keep the original
  }
};

// POST upload single file (Admin only)
router.post('/single', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = normalizeFilePath(req.file.path);
    
    // Optimize image if it's an image file
    if (req.file.mimetype.startsWith('image/')) {
      const optimizedPath = filePath.replace(/\.(jpg|jpeg|png|gif)$/i, '_optimized.$1');
      await optimizeImage(req.file.path, optimizedPath);
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: filePath,
        url: `/uploads/${path.relative('uploads/', filePath)}`
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up file if processing failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'File upload failed' });
  }
});

// POST upload multiple files (Admin only)
router.post('/multiple', protect, adminOnly, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const filePath = normalizeFilePath(file.path);
        
        // Optimize image if it's an image file
        if (file.mimetype.startsWith('image/')) {
          const optimizedPath = filePath.replace(/\.(jpg|jpeg|png|gif)$/i, '_optimized.$1');
          await optimizeImage(file.path, optimizedPath);
        }

        return {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: filePath,
          url: `/uploads/${path.relative('uploads/', filePath)}`
        };
      })
    );

    res.json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    
    // Clean up files if processing failed
    const files = req.files as Express.Multer.File[];
    if (files) {
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ error: 'File upload failed' });
  }
});

// DELETE file (Admin only)
router.delete('/:filename', protect, adminOnly, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    
    // Find file in different directories
    const possiblePaths = [
      `uploads/images/${sanitizedFilename}`,
      `uploads/documents/${sanitizedFilename}`,
      `uploads/misc/${sanitizedFilename}`,
      `uploads/practitioners/${sanitizedFilename}`,
      `uploads/services/${sanitizedFilename}`,
      `uploads/programs/${sanitizedFilename}`,
      `uploads/testimonials/${sanitizedFilename}`
    ];

    let fileFound = false;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fileFound = true;
        break;
      }
    }

    if (!fileFound) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// GET list files in directory (Admin only)
router.get('/list/:directory?', protect, adminOnly, async (req, res) => {
  try {
    const { directory = 'images' } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Security: only allow specific directories
    const allowedDirs = ['images', 'documents', 'misc', 'practitioners', 'services', 'programs', 'testimonials'];
    if (!allowedDirs.includes(directory)) {
      return res.status(400).json({ error: 'Invalid directory' });
    }

    const uploadDir = `uploads/${directory}`;
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({ files: [], totalCount: 0, hasMore: false });
    }

    // Get all files in directory
    const allFiles = fs.readdirSync(uploadDir)
      .filter(file => {
        const filePath = path.join(uploadDir, file);
        return fs.statSync(filePath).isFile();
      })
      .map(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        
        return {
          filename: file,
          path: normalizeFilePath(filePath),
          url: `/uploads/${directory}/${file}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          type: getFileType(ext),
          mimetype: getMimeType(ext)
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());

    // Paginate results
    const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedFiles = allFiles.slice(startIndex, endIndex);

    res.json({
      files: paginatedFiles,
      totalCount: allFiles.length,
      hasMore: endIndex < allFiles.length,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(allFiles.length / parseInt(limit as string))
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// GET file info (Admin only)
router.get('/info/:filename', protect, adminOnly, async (req, res) => {
  try {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    
    // Find file in different directories
    const possiblePaths = [
      { dir: 'images', path: `uploads/images/${sanitizedFilename}` },
      { dir: 'documents', path: `uploads/documents/${sanitizedFilename}` },
      { dir: 'misc', path: `uploads/misc/${sanitizedFilename}` },
      { dir: 'practitioners', path: `uploads/practitioners/${sanitizedFilename}` },
      { dir: 'services', path: `uploads/services/${sanitizedFilename}` },
      { dir: 'programs', path: `uploads/programs/${sanitizedFilename}` },
      { dir: 'testimonials', path: `uploads/testimonials/${sanitizedFilename}` }
    ];

    for (const { dir, path: filePath } of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const ext = path.extname(sanitizedFilename).toLowerCase();
        
        res.json({
          filename: sanitizedFilename,
          directory: dir,
          path: normalizeFilePath(filePath),
          url: `/uploads/${dir}/${sanitizedFilename}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          type: getFileType(ext),
          mimetype: getMimeType(ext)
        });
        return;
      }
    }

    res.status(404).json({ error: 'File not found' });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Helper functions
function getFileType(ext: string): string {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const documentExts = ['.pdf', '.doc', '.docx'];
  
  if (imageExts.includes(ext)) return 'image';
  if (documentExts.includes(ext)) return 'document';
  return 'misc';
}

function getMimeType(ext: string): string {
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

export default router;