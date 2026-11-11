const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true
  },
  operator: {
    type: String
  },
  type: {
    type: String,
    enum: ['Ordinary', 'Fast Passenger', 'Limited Stop', 'Express', 'Other'],
    default: 'Ordinary'
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Inactive'
  },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
