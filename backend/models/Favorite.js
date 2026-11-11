const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Bus', 'Route', 'Stop'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'type' }
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
