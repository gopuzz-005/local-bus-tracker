const Alert = require('../models/Alert');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Public
const getAlerts = async (req, res) => {
  try {
    const data = await Alert.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a alert
// @route   POST /api/alerts
// @access  Private/Admin
const createAlert = async (req, res) => {
  try {
    const data = new Alert(req.body);
    const createdData = await data.save();
    res.status(201).json(createdData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAlerts, createAlert };
