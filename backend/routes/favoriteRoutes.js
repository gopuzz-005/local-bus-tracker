const express = require('express');
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getFavorites)
  .post(protect, addFavorite);

router.route('/:id')
  .delete(protect, removeFavorite);

module.exports = router;
