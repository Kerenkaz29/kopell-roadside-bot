const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    state: {
      type: String,
      enum: ['START', 'AWAITING_LOCATION', 'AWAITING_VEHICLE', 'DISPATCHED', 'DONE'],
      default: 'START',
    },
    data: {
      issueType: String,
      location: {
        lat: Number,
        lng: Number,
      },
      vehicleNumber: String,
      policyNumber: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
