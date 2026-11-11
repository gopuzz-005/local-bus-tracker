const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  currentStop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
  nextStop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
    default: 'NOT_STARTED'
  }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
