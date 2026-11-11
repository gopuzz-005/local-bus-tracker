const express = require('express');
const { getStops, createStop, deleteStop } = require('../controllers/stopController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(getStops)
  .post(protect, admin, createStop);

router.route('/:id')
  .delete(protect, admin, deleteStop);

module.exports = router;
