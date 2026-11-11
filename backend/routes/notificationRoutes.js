const express = require('express');
const { getNotifications, createNotification, getUserNotifications, markNotificationRead } = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getNotifications)
  .post(protect, admin, createNotification);

router.get('/:userId', protect, getUserNotifications);
router.put('/:id/read', protect, markNotificationRead);

module.exports = router;
