const ServiceRequest = require('./models/ServiceRequest');
const Technician = require('./models/Technician');
const Conversation = require('./models/Conversation');
const { generateReply } = require('./ai/generateReply');

const STEPS = [
  {
    status: 'ON_THE_WAY',
    delayMs: 15000,
    instruction: 'עדכני את הלקוח שהטכנאי יצא לדרך אליה, כולל זמן ההגעה המשוער',
    facts: (r) => ({ זמן_הגעה_בדקות: r.etaMinutes }),
  },
  {
    status: 'ARRIVED',
    delayMs: 15000,
    instruction: 'עדכני את הלקוח שהטכנאי הגיע למיקום שלה',
    facts: () => ({}),
  },
  {
    status: 'COMPLETED',
    delayMs: 10000,
    instruction: 'הודיעי ללקוח שהטיפול הושלם, תודי לה שבחרה בשירותי החילוץ, ושתוכל לפנות שוב בכל עת',
    facts: () => ({}),
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
        const message = await generateReply(step.instruction, step.facts(request));
        await client.sendText(request.phone, message);
        console.log(`Request ${requestId} -> ${step.status}, update sent`);
      } catch (err) {
        console.error(`Request ${requestId} -> ${step.status}, update failed:`, err.message);
      }
    }, delay);
  }
}

module.exports = { startSimulation };
