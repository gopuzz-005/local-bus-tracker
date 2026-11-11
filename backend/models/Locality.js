const mongoose = require('mongoose');

const localitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Locality', localitySchema);
