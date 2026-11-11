const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  state: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('District', districtSchema);
