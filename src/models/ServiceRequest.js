const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    issueType: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    vehicleNumber: String,
    policyNumber: String,
    status: {
      type: String,
      enum: ['NEW', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
      default: 'NEW',
    },
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
    etaMinutes: Number,
  },
  { timestamps: true }
);

serviceRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
