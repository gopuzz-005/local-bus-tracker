const express = require('express');
const { getDistricts, createDistrict, deleteDistrict } = require('../controllers/districtController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(getDistricts)
  .post(protect, admin, createDistrict);

router.route('/:id')
  .delete(protect, admin, deleteDistrict);

module.exports = router;
