const express = require('express');
const { getAlerts, createAlert } = require('../controllers/alertController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getAlerts)
  .post(protect, admin, createAlert);

module.exports = router;
