// src/routes/notificationRoutes.ts
import { Router } from 'express';
import prisma from '../lib/prisma';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// GET all notifications for current user
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;
    
    const where: any = { 
      userId: req.user!.id 
    };
    
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.notification.count({
        where: { 
          userId: req.user!.id,
          read: false 
        }
      })
    ]);

    res.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === parseInt(limit as string)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET unread notifications count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { 
        userId: req.user!.id,
        read: false 
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check if user owns this notification
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to modify this notification' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { 
        read: true,
        readAt: new Date()
      }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.user!.id,
        read: false 
      },
      data: { 
        read: true,
        readAt: new Date()
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// DELETE notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Check if user owns this notification
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }

    await prisma.notification.delete({ where: { id } });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// DELETE all read notifications
router.delete('/clear-read', async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { 
        userId: req.user!.id,
        read: true 
      }
    });

    res.json({ message: 'All read notifications cleared' });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({ error: 'Failed to clear read notifications' });
  }
});

// Admin routes
router.use(adminOnly);

// POST create system notification (Admin only)
router.post('/system', async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'INFO',
      targetUserIds,
      sendToAll = false
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    let userIds: string[] = [];

    if (sendToAll) {
      // Send to all admin users
      const allAdmins = await prisma.admin.findMany({
        select: { id: true }
      });
      userIds = allAdmins.map(admin => admin.id);
    } else if (targetUserIds && Array.isArray(targetUserIds)) {
      userIds = targetUserIds;
    } else {
      return res.status(400).json({ error: 'Must specify target users or send to all' });
    }

    // Create notifications for all target users
    const notifications = await Promise.all(
      userIds.map(userId => 
        prisma.notification.create({
          data: {
            title,
            message,
            type,
            userId,
            read: false
          }
        })
      )
    );

    res.status(201).json({
      message: `Notification sent to ${notifications.length} users`,
      notificationCount: notifications.length
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
    res.status(500).json({ error: 'Failed to create system notification' });
  }
});

// GET notification statistics (Admin only)
router.get('/admin/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalNotifications,
      unreadNotifications,
      todayNotifications,
      weeklyNotifications,
      monthlyNotifications,
      notificationsByType
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { read: false } }),
      prisma.notification.count({
        where: {
          createdAt: { gte: today }
        }
      }),
      prisma.notification.count({
        where: {
          createdAt: { gte: thisWeekStart }
        }
      }),
      prisma.notification.count({
        where: {
          createdAt: { gte: thisMonthStart }
        }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } }
      })
    ]);

    res.json({
      totalNotifications,
      unreadNotifications,
      todayNotifications,
      weeklyNotifications,
      monthlyNotifications,
      notificationsByType: notificationsByType.map(item => ({
        type: item.type,
        count: item._count.type
      }))
    });
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

// Utility function to create notification (used by other routes)
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'APPOINTMENT' = 'INFO',
  relatedId?: string,
  relatedType?: string
) => {
  try {
    return await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId,
        relatedId,
        relatedType,
        read: false
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Utility function to notify all admins
export const notifyAllAdmins = async (
  title: string,
  message: string,
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'APPOINTMENT' = 'INFO',
  relatedId?: string,
  relatedType?: string
) => {
  try {
    const allAdmins = await prisma.admin.findMany({
      select: { id: true }
    });

    const notifications = await Promise.all(
      allAdmins.map(admin => 
        createNotification(admin.id, title, message, type, relatedId, relatedType)
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error notifying all admins:', error);
    throw error;
  }
};

export default router;