const Schedule = require('../models/Schedule');

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Public
const getSchedules = async (req, res) => {
  try {
    const data = await Schedule.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a schedule
// @route   POST /api/schedules
// @access  Private/Admin
const createSchedule = async (req, res) => {
  try {
    const data = new Schedule(req.body);
    const createdData = await data.save();
    res.status(201).json(createdData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getSchedules, createSchedule };
