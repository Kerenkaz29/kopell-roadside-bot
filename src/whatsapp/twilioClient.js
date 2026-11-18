const twilio = require('twilio');
const config = require('../config');

let client;
function getClient() {
  if (!client) client = twilio(config.twilio.accountSid, config.twilio.authToken);
  return client;
}

async function sendText(to, body) {
  await getClient().messages.create({
    from: config.twilio.fromNumber,
    to: `whatsapp:+${to}`,
    body,
  });
}

// Twilio's WhatsApp API has no native "request location" message type;
// just ask the user to share it via WhatsApp's own attachment button.
async function requestLocation(to, body) {
  await sendText(to, `${body} (לחצי על סיכת המיקום 📎 בוואטסאפ ושתפי מיקום)`);
}

module.exports = { sendText, requestLocation };
