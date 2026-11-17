const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['tow', 'repair'], required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  status: { type: String, enum: ['AVAILABLE', 'BUSY'], default: 'AVAILABLE' },
});

technicianSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Technician', technicianSchema);
