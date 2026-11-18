// Live-demo script: walks a simulated customer through the full bot flow by
// posting to the same webhook endpoint Meta would call, then prints the
// resulting state so it can be narrated during a presentation. Run with the
// server already running (npm start) and the admin dashboard open in a browser.
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const config = require('./config');
const Conversation = require('./models/Conversation');
const ServiceRequest = require('./models/ServiceRequest');
const Technician = require('./models/Technician');

const DEMO_PHONE = '972501234567';

function postJson(message) {
  const body = {
    entry: [{ changes: [{ value: { messages: [{ from: DEMO_PHONE, id: `demo-${Date.now()}`, ...message }] } }] }],
  };
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        host: 'localhost',
        port: config.port,
        path: '/webhook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function step(label, message) {
  console.log(`\n👤 לקוח: ${label}`);
  await postJson(message);
  await wait(3000);
  const convo = await Conversation.findOne({ phone: DEMO_PHONE }).lean();
  console.log(`   (מצב שיחה: ${convo.state})`);
}

async function run() {
  await mongoose.connect(config.mongodbUri);
  await Conversation.deleteMany({ phone: DEMO_PHONE });
  await ServiceRequest.deleteMany({ phone: DEMO_PHONE });

  console.log('=== דמו: פנייה לבוט חילוץ דרכים ===');
  console.log('(פתחי את http://localhost:3000/admin/requests בדפדפן כדי לראות את זה חי)\n');

  await step('שלום', { type: 'text', text: { body: 'שלום' } });
  await step('תקר בגלגל', { type: 'text', text: { body: 'תקר בגלגל' } });
  await step('[משתפת מיקום]', { type: 'location', location: { latitude: 32.805, longitude: 35.11 } });
  await step('45-123-67 / פוליסה 7788', { type: 'text', text: { body: '45-123-67 / פוליסה 7788' } });

  const request = await ServiceRequest.findOne({ phone: DEMO_PHONE }).lean();
  const technician = request.technicianId ? await Technician.findById(request.technicianId).lean() : null;

  console.log('\n=== תוצאה ===');
  console.log(`סטטוס: ${request.status}`);
  console.log(`טכנאי משויך: ${technician ? technician.name : 'אין זמין'}`);
  console.log(`ETA: ${request.etaMinutes} דקות`);
  console.log('\nהסטטוס ימשיך להתעדכן אוטומטית (ON_THE_WAY -> ARRIVED -> COMPLETED) בדשבורד תוך כ-40 שניות.');

  process.exit(0);
}

run().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
