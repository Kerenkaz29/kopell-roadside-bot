const express = require('express');
const mongoose = require('mongoose');
const config = require('./config');
const parseIncoming = require('./whatsapp/parseIncoming');

const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
  const message = parseIncoming(req.body);
  if (message) {
    console.log('Incoming message:', message);
  }
  res.sendStatus(200);
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
