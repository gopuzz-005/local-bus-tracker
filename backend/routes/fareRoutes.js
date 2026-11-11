const express = require('express');
const { getFares, createFare } = require('../controllers/fareController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getFares)
  .post(protect, admin, createFare);

module.exports = router;
