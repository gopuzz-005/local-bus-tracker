const mongoose = require('mongoose');

const liveLocationSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LiveLocation', liveLocationSchema);
