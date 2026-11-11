const express = require('express');
const { getLocalities, createLocality } = require('../controllers/localityController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getLocalities)
  .post(protect, admin, createLocality);

module.exports = router;
