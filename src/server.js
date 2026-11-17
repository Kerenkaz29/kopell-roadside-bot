const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');
const parseIncoming = require('./whatsapp/parseIncoming');
const parseIncomingTwilio = require('./whatsapp/parseIncomingTwilio');
const metaClient = require('./whatsapp/metaClient');
const twilioClient = require('./whatsapp/twilioClient');
const { handleMessage } = require('./stateMachine');
const ServiceRequest = require('./models/ServiceRequest');
const Technician = require('./models/Technician');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function processMessage(message, client) {
  console.log('Incoming message:', message);
  try {
    const replies = await handleMessage(message, client);
    console.log('Bot reply:', replies);
    for (const reply of replies) {
      await client.sendText(message.from, reply);
    }
    console.log('WhatsApp delivery: sent to', message.from);
  } catch (err) {
    console.log('WhatsApp delivery: skipped (provider verification pending) -', err.response?.data?.error?.message || err.message);
  }
}

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  const message = parseIncoming(req.body);
  res.sendStatus(200);
  if (message) await processMessage(message, metaClient);
});

app.post('/webhook/twilio', async (req, res) => {
  const message = parseIncomingTwilio(req.body);
  res.set('Content-Type', 'text/xml').send('<Response></Response>');
  if (message) await processMessage(message, twilioClient);
});

app.get('/admin/requests', async (req, res) => {
  const requests = await ServiceRequest.find().sort({ createdAt: -1 }).limit(50).lean();
  const technicians = await Technician.find().lean();
  const techById = Object.fromEntries(technicians.map((t) => [String(t._id), t.name]));

  const rows = requests
    .map(
      (r) => `
    <tr>
      <td>${r.phone}</td>
      <td>${r.issueType}</td>
      <td>${r.vehicleNumber || ''}</td>
      <td><span class="badge ${r.status}">${r.status}</span></td>
      <td>${r.technicianId ? techById[String(r.technicianId)] || '-' : '-'}</td>
      <td>${r.etaMinutes ?? '-'}</td>
      <td>${new Date(r.createdAt).toLocaleTimeString('he-IL')}</td>
    </tr>`
    )
    .join('');

  res.send(`<!doctype html>
<html dir="rtl"><head><meta charset="utf-8"><meta http-equiv="refresh" content="3">
<title>Kopell Roadside - Live Requests</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; background: #f6f7f9; }
  h1 { font-size: 1.25rem; }
  table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  th, td { padding: 0.6rem 1rem; text-align: right; border-bottom: 1px solid #eee; }
  th { background: #1a2b4c; color: white; }
  .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; color: white; }
  .badge.NEW { background: #888; }
  .badge.ASSIGNED { background: #f0a500; }
  .badge.ON_THE_WAY { background: #3b82f6; }
  .badge.ARRIVED { background: #8b5cf6; }
  .badge.COMPLETED { background: #22c55e; }
  .badge.CANCELLED { background: #ef4444; }
</style></head>
<body>
  <h1>Kopell Roadside Bot - קריאות חיות</h1>
  <table>
    <tr><th>טלפון</th><th>תקלה</th><th>רכב</th><th>סטטוס</th><th>טכנאי</th><th>ETA (דק')</th><th>נפתח</th></tr>
    ${rows || '<tr><td colspan="7">אין קריאות עדיין</td></tr>'}
  </table>
</body></html>`);
});

async function start() {
  await mongoose.connect(config.mongodbUri);
  console.log('MongoDB connected');
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
