const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
