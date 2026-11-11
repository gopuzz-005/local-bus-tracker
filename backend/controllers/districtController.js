const District = require('../models/District');

// @desc    Get all active districts
// @route   GET /api/districts
// @access  Public
const getDistricts = async (req, res) => {
  try {
    const districts = await District.find({ active: true });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a district
// @route   POST /api/districts
// @access  Private/Admin
const createDistrict = async (req, res) => {
  try {
    const { name, state, code } = req.body;
    const districtExists = await District.findOne({ name });
    if (districtExists) return res.status(400).json({ message: 'District already exists' });
    
    const district = await District.create({ name, state, code });
    res.status(201).json(district);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a district
// @route   DELETE /api/districts/:id
// @access  Private/Admin
const deleteDistrict = async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    if (!district) return res.status(404).json({ message: 'District not found' });
    
    await district.deleteOne();
    res.json({ message: 'District removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDistricts, createDistrict, deleteDistrict };
