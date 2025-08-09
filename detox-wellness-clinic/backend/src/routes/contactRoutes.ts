// src/routes/contactRoutes.ts
import { Router } from 'express';
import prisma from '../lib/prisma';
import { protect, adminOnly } from '../middleware/authMiddleware';
import nodemailer from 'nodemailer';

const router = Router();

// Email configuration (you'll need to set these in your .env)
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// POST submit contact form (Public)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      type = 'GENERAL', // GENERAL, APPOINTMENT, CONSULTATION, COMPLAINT
      preferredContact = 'EMAIL'
    } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Create contact inquiry
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        type,
        preferredContact,
        status: 'PENDING'
      }
    });

    // Send notification email to admin (if configured)
    if (process.env.SMTP_USER && process.env.ADMIN_EMAIL) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `New Contact Inquiry: ${subject || 'General Inquiry'}`,
          html: `
            <h2>New Contact Inquiry Received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p><strong>Preferred Contact:</strong> ${preferredContact}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            
            <p><a href="${process.env.FRONTEND_URL}/admin/inquiries">View in Admin Panel</a></p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }

    // Send auto-reply to user
    if (process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: 'Thank you for contacting Detox Wellness Center',
          html: `
            <h2>Thank you for your inquiry</h2>
            <p>Dear ${name},</p>
            <p>Thank you for contacting Detox Wellness & Rehabilitation Center. We have received your message and will get back to you within 24 hours.</p>
            
            <h3>Your inquiry details:</h3>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Message:</strong> ${message}</p>
            
            <p>If this is urgent, please call us at <strong>+91-XXXX-XXXX</strong></p>
            
            <p>Best regards,<br>
            Detox Wellness & Rehabilitation Center Team</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send auto-reply email:', emailError);
      }
    }

    res.status(201).json({
      message: 'Your inquiry has been submitted successfully. We will contact you soon.',
      inquiry: {
        id: inquiry.id,
        name: inquiry.name,
        email: inquiry.email,
        subject: inquiry.subject,
        type: inquiry.type,
        status: inquiry.status,
        createdAt: inquiry.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Failed to submit inquiry. Please try again.' });
  }
});

// GET contact information (Public)
router.get('/info', async (req, res) => {
  try {
    // You can store this in database or environment variables
    const contactInfo = {
      phone: process.env.CLINIC_PHONE || '+91-XXXX-XXXX',
      email: process.env.CLINIC_EMAIL || 'info@detoxwellness.com',
      address: {
        street: process.env.CLINIC_ADDRESS || 'Your Clinic Address',
        city: process.env.CLINIC_CITY || 'Malappuram',
        state: process.env.CLINIC_STATE || 'Kerala',
        pincode: process.env.CLINIC_PINCODE || '676XXX',
        country: 'India'
      },
      workingHours: {
        weekdays: '9:00 AM - 6:00 PM',
        saturday: '9:00 AM - 2:00 PM',
        sunday: 'Closed'
      },
      socialMedia: {
        facebook: process.env.FACEBOOK_URL,
        instagram: process.env.INSTAGRAM_URL,
        twitter: process.env.TWITTER_URL,
        linkedin: process.env.LINKEDIN_URL
      },
      emergencyContact: process.env.EMERGENCY_CONTACT || '+91-XXXX-XXXX'
    };

    res.json(contactInfo);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({ error: 'Failed to fetch contact information' });
  }
});

// Admin routes (protected)
router.use(protect);
router.use(adminOnly);

// GET all inquiries (Admin only)
router.get('/admin/inquiries', async (req, res) => {
  try {
    const { 
      status, 
      type, 
      searchQuery, 
      dateStart, 
      dateEnd,
      limit = 50,
      offset = 0 
    } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (dateStart && dateEnd) {
      where.createdAt = { 
        gte: new Date(dateStart as string), 
        lte: new Date(dateEnd as string) 
      };
    }
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery as string, mode: 'insensitive' } },
        { email: { contains: searchQuery as string, mode: 'insensitive' } },
        { subject: { contains: searchQuery as string, mode: 'insensitive' } },
        { message: { contains: searchQuery as string, mode: 'insensitive' } }
      ];
    }

    const [inquiries, totalCount] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.contactInquiry.count({ where })
    ]);

    res.json({
      inquiries,
      totalCount,
      hasMore: totalCount > parseInt(offset as string) + inquiries.length
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// GET single inquiry (Admin only)
router.get('/admin/inquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id }
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Mark as read if it wasn't already
    if (inquiry.status === 'PENDING') {
      await prisma.contactInquiry.update({
        where: { id },
        data: { status: 'READ' }
      });
      inquiry.status = 'READ';
    }

    res.json(inquiry);
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});

// PUT update inquiry status (Admin only)
router.put('/admin/inquiries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'READ', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedInquiry = await prisma.contactInquiry.update({
      where: { id },
      data: { 
        status,
        adminNotes,
        updatedAt: new Date()
      }
    });

    res.json(updatedInquiry);
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});

// POST reply to inquiry (Admin only)
router.post('/admin/inquiries/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, sendEmail = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    // Get inquiry details
    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id }
    });

    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    // Update inquiry with reply
    const updatedInquiry = await prisma.contactInquiry.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        adminNotes: message,
        repliedAt: new Date(),
        repliedBy: req.user!.name
      }
    });

    // Send reply email if requested and email is configured
    if (sendEmail && process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: inquiry.email,
          subject: `Re: ${inquiry.subject || 'Your inquiry at Detox Wellness Center'}`,
          html: `
            <h2>Reply to your inquiry</h2>
            <p>Dear ${inquiry.name},</p>
            
            <p>Thank you for contacting Detox Wellness & Rehabilitation Center. Here's our reply to your inquiry:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <h3>Your original inquiry:</h3>
            <p><strong>Subject:</strong> ${inquiry.subject || 'General Inquiry'}</p>
            <p><strong>Message:</strong> ${inquiry.message}</p>
            
            <p>If you have any further questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            ${req.user!.name}<br>
            Detox Wellness & Rehabilitation Center</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send reply email:', emailError);
        return res.status(500).json({ error: 'Reply saved but failed to send email' });
      }
    }

    res.json({
      message: 'Reply sent successfully',
      inquiry: updatedInquiry
    });
  } catch (error) {
    console.error('Error replying to inquiry:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// DELETE inquiry (Admin only)
router.delete('/admin/inquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id }
    });
    
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    
    await prisma.contactInquiry.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

// GET inquiry statistics (Admin only)
router.get('/admin/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalInquiries,
      pendingInquiries,
      todayInquiries,
      weeklyInquiries,
      monthlyInquiries,
      inquiriesByType,
      inquiriesByStatus
    ] = await Promise.all([
      prisma.contactInquiry.count(),
      prisma.contactInquiry.count({ where: { status: 'PENDING' } }),
      prisma.contactInquiry.count({
        where: {
          createdAt: { gte: today }
        }
      }),
      prisma.contactInquiry.count({
        where: {
          createdAt: { gte: thisWeekStart }
        }
      }),
      prisma.contactInquiry.count({
        where: {
          createdAt: { gte: thisMonthStart }
        }
      }),
      prisma.contactInquiry.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } }
      }),
      prisma.contactInquiry.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    res.json({
      totalInquiries,
      pendingInquiries,
      todayInquiries,
      weeklyInquiries,
      monthlyInquiries,
      inquiriesByType: inquiriesByType.map(item => ({
        type: item.type,
        count: item._count.type
      })),
      inquiriesByStatus: inquiriesByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      }))
    });
  } catch (error) {
    console.error('Error fetching inquiry statistics:', error);
    res.status(500).json({ error: 'Failed to fetch inquiry statistics' });
  }
});

export default router;