const express = require('express');
const { getBuses, createBus, assignDriver, updateLocation, getAssignedBus, getBusById } = require('../controllers/busController');
const { protect, admin, driverOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/assigned', protect, driverOrAdmin, getAssignedBus);

router.route('/')
  .get(getBuses)
  .post(protect, admin, createBus);

router.get('/:id', getBusById);
router.put('/:id/driver', protect, admin, assignDriver);
router.put('/:id/location', protect, driverOrAdmin, updateLocation);

module.exports = router;
