const Favorite = require('../models/Favorite');

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate('referenceId');
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { type, referenceId } = req.body;
    const exists = await Favorite.findOne({ user: req.user._id, referenceId });
    if (exists) return res.status(400).json({ message: 'Already in favorites' });
    
    const favorite = await Favorite.create({ user: req.user._id, type, referenceId });
    const populated = await favorite.populate('referenceId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({ _id: req.params.id, user: req.user._id });
    if (!favorite) return res.status(404).json({ message: 'Favorite not found' });
    
    await favorite.deleteOne();
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };
