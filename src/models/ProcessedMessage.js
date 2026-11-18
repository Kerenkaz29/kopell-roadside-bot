const mongoose = require('mongoose');

// Records every inbound message id we've handled, so a webhook retry (Meta
// resends on timeout) doesn't get processed - and replied to - twice.
const processedMessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' },
});

module.exports = mongoose.model('ProcessedMessage', processedMessageSchema);
