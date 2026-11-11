const express = require('express');
const { getBusTrackingData } = require('../controllers/trackingController');
const router = express.Router();

router.get('/buses/:id', getBusTrackingData);

module.exports = router;
