const axios = require('axios');
const config = require('../config');

const api = axios.create({
  baseURL: `https://graph.facebook.com/v20.0/${config.whatsapp.phoneNumberId}`,
  headers: { Authorization: `Bearer ${config.whatsapp.token}` },
});

async function sendText(to, body) {
  await api.post('/messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  });
}

async function requestLocation(to, body) {
  await api.post('/messages', {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'location_request_message',
      body: { text: body },
      action: { name: 'send_location' },
    },
  });
}

module.exports = { sendText, requestLocation };
