const Conversation = require('./models/Conversation');
const ServiceRequest = require('./models/ServiceRequest');
const { assignTechnician } = require('./dispatch');
const { requestLocation } = require('./whatsapp/client');
const { startSimulation } = require('./statusSimulator');

const ISSUE_PROMPT = 'קיבלנו את הפנייה שלך! מה קרה לרכב? (תקר / תאונה / נעילה / תקלה)';
const VEHICLE_PROMPT = 'תודה. שלחי בבקשה מספר רכב ומספר פוליסה (בהודעה אחת, למשל: "12-345-67 / פוליסה 9988")';

// Drives one turn of the conversation and returns the reply text(s) to send back.
// Side effects (sending the location-request interactive message) happen here too,
// since that message type isn't plain text.
async function handleMessage(message) {
  let convo = await Conversation.findOne({ phone: message.from });

  if (!convo) {
    convo = await Conversation.create({ phone: message.from, state: 'START' });
    return [ISSUE_PROMPT];
  }

  switch (convo.state) {
    case 'START': {
      convo.data.issueType = message.text || 'לא צוין';
      convo.state = 'AWAITING_LOCATION';
      await convo.save();
      await requestLocation(message.from, 'תודה. שתפי בבקשה את המיקום שלך כדי שנשלח טכנאי');
      return [];
    }

    case 'AWAITING_LOCATION': {
      if (message.type !== 'location') {
        return ['נא לשתף מיקום באמצעות כפתור השיתוף בוואטסאפ כדי שנוכל להמשיך'];
      }
      convo.data.location = message.location;
      convo.state = 'AWAITING_VEHICLE';
      await convo.save();
      return [VEHICLE_PROMPT];
    }

    case 'AWAITING_VEHICLE': {
      convo.data.vehicleNumber = message.text || 'לא צוין';
      convo.state = 'DISPATCHED';
      await convo.save();

      const request = await ServiceRequest.create({
        phone: convo.phone,
        issueType: convo.data.issueType,
        location: { type: 'Point', coordinates: [convo.data.location.lng, convo.data.location.lat] },
        vehicleNumber: convo.data.vehicleNumber,
      });

      const assignment = await assignTechnician(request.location);
      if (!assignment) {
        request.status = 'NEW';
        await request.save();
        return ['מצטערים, כרגע כל הטכנאים תפוסים. ניצור קשר ברגע שאחד יתפנה.'];
      }

      request.status = 'ASSIGNED';
      request.technicianId = assignment.technician._id;
      request.etaMinutes = assignment.etaMinutes;
      await request.save();
      startSimulation(request._id);

      return [
        `טכנאי בדרך אליך - ${assignment.technician.name}. זמן הגעה משוער: כ-${assignment.etaMinutes} דקות.`,
      ];
    }

    case 'DISPATCHED': {
      const request = await ServiceRequest.findOne({ phone: convo.phone }).sort({ createdAt: -1 });
      if (!request) return ['לא נמצאה קריאה פעילה. שלחי הודעה חדשה כדי לפתוח קריאה.'];
      return [`הטכנאי ${request.status === 'ASSIGNED' ? 'בדרך' : 'מטפל בקריאה'}, ETA כ-${request.etaMinutes} דקות.`];
    }

    default:
      return ['תודה על הפנייה.'];
  }
}

module.exports = { handleMessage };
