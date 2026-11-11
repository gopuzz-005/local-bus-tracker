const express = require('express');
const {
  getTrips,
  getActiveTrip,
  startTrip,
  updateTripStatus,
  updateTripLocation,
  endTrip,
  getDriverHistory,
  createTrip
} = require('../controllers/tripController');
const { protect, admin, driverOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public / Driver / Passenger active trip route
router.get('/active', protect, getActiveTrip);
router.get('/driver-history', protect, driverOrAdmin, getDriverHistory);

// Driver / Admin trip lifecycle routes
router.post('/start', protect, driverOrAdmin, startTrip);
router.put('/:id/status', protect, driverOrAdmin, updateTripStatus);
router.put('/:id/location', protect, driverOrAdmin, updateTripLocation);
router.put('/:id/end', protect, driverOrAdmin, endTrip);

// Base trips route
router.route('/')
  .get(getTrips)
  .post(protect, admin, createTrip);

module.exports = router;
