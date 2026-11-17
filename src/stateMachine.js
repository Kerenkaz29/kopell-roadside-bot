const Conversation = require('./models/Conversation');
const ServiceRequest = require('./models/ServiceRequest');
const Technician = require('./models/Technician');
const { assignTechnician } = require('./dispatch');
const { startSimulation } = require('./statusSimulator');
const { classifyIssue } = require('./ai/classifyIssue');
const { extractVehicleInfo } = require('./ai/extractVehicleInfo');

const ISSUE_PROMPT = 'קיבלנו את הפנייה שלך! מה קרה לרכב?';
const VEHICLE_PROMPT = 'תודה. שלחי בבקשה מספר רכב ומספר פוליסה (בהודעה אחת, בכל ניסוח שנוח לך)';
const CANCEL_WORDS = ['בטל', 'ביטול', 'לסגור', 'סגור', 'לבטל', 'cancel'];

function isCancelRequest(text) {
  return CANCEL_WORDS.some((word) => (text || '').includes(word));
}

// Drives one turn of the conversation and returns the reply text(s) to send back.
// Side effects (sending the location-request interactive message) happen here too,
// since that message type isn't plain text.
async function handleMessage(message, client) {
  let convo = await Conversation.findOne({ phone: message.from });

  if (!convo) {
    convo = await Conversation.create({ phone: message.from, state: 'START' });
  }

  switch (convo.state) {
    case 'START': {
      convo.state = 'AWAITING_ISSUE';
      await convo.save();
      return [ISSUE_PROMPT];
    }

    case 'AWAITING_ISSUE': {
      const { category, summary } = await classifyIssue(message.text || '');
      convo.data.issueType = category;
      convo.data.issueSummary = summary;
      convo.state = 'AWAITING_LOCATION';
      await convo.save();
      await client.requestLocation(message.from, `הבנתי - ${summary}. שתפי בבקשה את המיקום שלך כדי שנשלח טכנאי`);
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
      const { vehicleNumber, policyNumber } = await extractVehicleInfo(message.text || '');
      convo.data.vehicleNumber = vehicleNumber || 'לא צוין';
      convo.data.policyNumber = policyNumber || 'לא צוין';
      convo.state = 'DISPATCHED';
      await convo.save();

      const request = await ServiceRequest.create({
        phone: convo.phone,
        issueType: convo.data.issueSummary || convo.data.issueType,
        location: { type: 'Point', coordinates: [convo.data.location.lng, convo.data.location.lat] },
        vehicleNumber: convo.data.vehicleNumber,
        policyNumber: convo.data.policyNumber,
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
      startSimulation(request._id, client);

      return [
        `טכנאי בדרך אליך - ${assignment.technician.name}. זמן הגעה משוער: כ-${assignment.etaMinutes} דקות.`,
      ];
    }

    case 'DISPATCHED': {
      const request = await ServiceRequest.findOne({ phone: convo.phone }).sort({ createdAt: -1 });
      if (!request) return ['לא נמצאה קריאה פעילה. שלחי הודעה חדשה כדי לפתוח קריאה.'];

      if (isCancelRequest(message.text)) {
        request.status = 'CANCELLED';
        await request.save();
        if (request.technicianId) {
          await Technician.findByIdAndUpdate(request.technicianId, { status: 'AVAILABLE' });
        }
        convo.state = 'START';
        convo.data = {};
        await convo.save();
        return ['הפנייה בוטלה. אם תזדקקי לעזרה בעתיד, פשוט שלחי הודעה חדשה.'];
      }

      return [`הטכנאי ${request.status === 'ASSIGNED' ? 'בדרך' : 'מטפל בקריאה'}, ETA כ-${request.etaMinutes} דקות.`];
    }

    default:
      return ['תודה על הפנייה.'];
  }
}

module.exports = { handleMessage };
