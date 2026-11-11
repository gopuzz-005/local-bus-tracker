const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String },
  operatingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
