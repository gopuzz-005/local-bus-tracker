const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true
  },
  routeNumber: {
    type: String,
    required: true
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
  },
  orderedStops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop'
  }],
  routeCoordinates: [{
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }],
  estimatedDuration: {
    type: Number // in minutes
  },
  distance: {
    type: Number // in km
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
