// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { generateToken, protect } from '../middleware/authMiddleware';

const router = Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(admin.id);

    // Return success response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    if (!admin) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: admin });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Get current user
    const currentUser = await prisma.admin.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: any = {};

    // Update basic info
    if (name && name !== currentUser.name) {
      updateData.name = name;
    }

    if (email && email !== currentUser.email) {
      // Check if email is already taken
      const existingUser = await prisma.admin.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email is already taken' });
      }

      updateData.email = email.toLowerCase();
    }

    // Update password if provided
    if (newPassword && currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    const updatedUser = await prisma.admin.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, updatedAt: true }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Logout (optional - mainly handled on frontend)
router.post('/logout', protect, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Verify token endpoint
router.get('/verify', protect, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

export default router;