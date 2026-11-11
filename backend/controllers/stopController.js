const Stop = require('../models/Stop');

const getStops = async (req, res) => {
  try {
    const stops = await Stop.find({}).populate('district', 'name state');
    res.json(stops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createStop = async (req, res) => {
  try {
    const { name, district, latitude, longitude } = req.body;
    const stopExists = await Stop.findOne({ name, district });
    if (stopExists) return res.status(400).json({ message: 'Stop already exists in this district' });
    
    const stop = await Stop.create({ name, district, latitude, longitude });
    res.status(201).json(stop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteStop = async (req, res) => {
  try {
    const stop = await Stop.findById(req.params.id);
    if (!stop) return res.status(404).json({ message: 'Stop not found' });
    
    await stop.deleteOne();
    res.json({ message: 'Stop removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getStops, createStop, deleteStop };
