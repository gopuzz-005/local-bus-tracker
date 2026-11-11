const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  locality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Locality'
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  landmarks: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Stop', stopSchema);
