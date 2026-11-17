const ServiceRequest = require('./models/ServiceRequest');
const Technician = require('./models/Technician');
const Conversation = require('./models/Conversation');

const STEPS = [
  { status: 'ON_THE_WAY', delayMs: 15000, message: (r) => `עדכון: הטכנאי יצא לדרך אליך, ETA כ-${r.etaMinutes} דקות.` },
  { status: 'ARRIVED', delayMs: 15000, message: () => 'הטכנאי הגיע למיקום שלך.' },
  {
    status: 'COMPLETED',
    delayMs: 10000,
    message: () => 'הטיפול הושלם. תודה שבחרת בשירותי החילוץ שלנו! אם תזדקקי לעזרה נוספת, פשוט שלחי הודעה חדשה.',
  },
];

// Walks a freshly-dispatched request through its lifecycle on a timer, pushing a
// WhatsApp update at each step. Demo-only stand-in for a real technician's app.
function startSimulation(requestId, client) {
  let delay = 0;
  for (const step of STEPS) {
    delay += step.delayMs;
    setTimeout(async () => {
      const request = await ServiceRequest.findById(requestId);
      if (!request || request.status === 'CANCELLED') return;

      request.status = step.status;
      await request.save();

      if (step.status === 'COMPLETED') {
        if (request.technicianId) {
          await Technician.findByIdAndUpdate(request.technicianId, { status: 'AVAILABLE' });
        }
        await Conversation.updateOne({ phone: request.phone }, { state: 'START', data: {} });
      }

      try {
        await client.sendText(request.phone, step.message(request));
        console.log(`Request ${requestId} -> ${step.status}, update sent`);
      } catch (err) {
        console.error(`Request ${requestId} -> ${step.status}, update failed:`, err.message);
      }
    }, delay);
  }
}

module.exports = { startSimulation };
