const express = require('express');
const { getSchedules, createSchedule } = require('../controllers/scheduleController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getSchedules)
  .post(protect, admin, createSchedule);

module.exports = router;
