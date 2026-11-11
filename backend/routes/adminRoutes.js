const express = require('express');
const {
  getDashboardStats,
  getAdminUsers,
  getAdminDrivers
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/users', protect, admin, getAdminUsers);
router.get('/drivers', protect, admin, getAdminDrivers);

module.exports = router;
