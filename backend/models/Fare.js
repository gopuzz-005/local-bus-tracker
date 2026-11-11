const mongoose = require('mongoose');

const fareSchema = new mongoose.Schema({
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  fromStop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop', required: true },
  toStop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop', required: true },
  amount: { type: Number, required: true },
  ticketType: { type: String, enum: ['Adult', 'Child', 'Student', 'Senior', 'Other'], default: 'Adult' }
}, { timestamps: true });

module.exports = mongoose.model('Fare', fareSchema);
