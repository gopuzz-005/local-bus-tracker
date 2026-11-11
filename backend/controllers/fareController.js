const Fare = require('../models/Fare');

// @desc    Get all fares
// @route   GET /api/fares
// @access  Public
const getFares = async (req, res) => {
  try {
    const data = await Fare.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a fare
// @route   POST /api/fares
// @access  Private/Admin
const createFare = async (req, res) => {
  try {
    const data = new Fare(req.body);
    const createdData = await data.save();
    res.status(201).json(createdData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getFares, createFare };
