const Locality = require('../models/Locality');

// @desc    Get all localities
// @route   GET /api/localities
// @access  Public
const getLocalities = async (req, res) => {
  try {
    const localities = await Locality.find().populate('district', 'name');
    res.json(localities);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a locality
// @route   POST /api/localities
// @access  Private/Admin
const createLocality = async (req, res) => {
  try {
    const { name, district, pincode } = req.body;
    const locality = new Locality({ name, district, pincode });
    const createdLocality = await locality.save();
    res.status(201).json(createdLocality);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getLocalities, createLocality };
