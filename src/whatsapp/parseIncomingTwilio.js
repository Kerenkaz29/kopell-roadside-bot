// Twilio posts inbound WhatsApp messages as application/x-www-form-urlencoded,
// shaped very differently from Meta's JSON webhook - normalize to the same
// {from, messageId, type, text, location} shape the state machine expects.
function parseIncomingTwilio(body) {
  if (!body?.From) return null;

  const from = body.From.replace('whatsapp:', '').replace('+', '');
  const base = { from, messageId: body.MessageSid, type: 'text' };

  if (body.Latitude && body.Longitude) {
    return { ...base, type: 'location', location: { lat: Number(body.Latitude), lng: Number(body.Longitude) } };
  }

  return { ...base, text: body.Body };
}

module.exports = parseIncomingTwilio;
