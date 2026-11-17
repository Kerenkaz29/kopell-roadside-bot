// Extracts the first inbound message from a WhatsApp Cloud API webhook payload.
// Returns null when the payload has no message (e.g. a delivery/read status update).
function parseIncoming(body) {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message) return null;

  const base = {
    from: message.from,
    messageId: message.id,
    type: message.type,
  };

  if (message.type === 'text') {
    return { ...base, text: message.text.body };
  }

  if (message.type === 'location') {
    return {
      ...base,
      location: { lat: message.location.latitude, lng: message.location.longitude },
    };
  }

  if (message.type === 'interactive') {
    const reply = message.interactive?.button_reply || message.interactive?.list_reply;
    return { ...base, buttonId: reply?.id, buttonTitle: reply?.title };
  }

  return base;
}

module.exports = parseIncoming;
